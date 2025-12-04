import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import MemoryStore from "memorystore";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import pg from "pg";
const { Pool } = pg;
import { storage } from "./storage";

// Replit Auth is optional - only enabled when REPLIT_DOMAINS is available
const isReplitAuthEnabled = !!process.env.REPLIT_DOMAINS;

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Create a connection pool with higher timeout for Neon cold starts
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 45000, // 45 seconds for Neon cold starts
  idleTimeoutMillis: 60000, // Keep connections alive longer
  max: 10,
  keepAlive: true, // Enable keepAlive to prevent connections from being dropped
  keepAliveInitialDelayMillis: 10000,
});

// Track pool health
let poolHealthy = true;

// Handle pool errors gracefully
sessionPool.on('error', (err) => {
  console.error('Session pool error:', err);
  poolHealthy = false;
});

sessionPool.on('connect', () => {
  poolHealthy = true;
});

// Warm up the database connection on startup
async function warmUpConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Session] Warming up database connection (attempt ${i + 1}/${retries})...`);
      const client = await sessionPool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[Session] Database connection warm-up successful');
      poolHealthy = true;
      return true;
    } catch (error) {
      console.error(`[Session] Warm-up attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, i + 1) * 1000;
        console.log(`[Session] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.warn('[Session] All warm-up attempts failed, using fallback memory store');
  poolHealthy = false;
  return false;
}

let sessionMiddlewareInstance: ReturnType<typeof session> | null = null;

export async function initializeSession(): Promise<void> {
  await warmUpConnection();
}

export function getSession() {
  if (sessionMiddlewareInstance) {
    return sessionMiddlewareInstance;
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore: session.Store;
  
  if (poolHealthy) {
    // Use PostgreSQL store
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      pool: sessionPool,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
      errorLog: (err: Error) => {
        console.error('[Session Store Error]', err);
        // If we get connection errors, mark pool as unhealthy
        if (err.message?.includes('timeout') || err.message?.includes('Connection terminated')) {
          poolHealthy = false;
        }
      },
    });
    console.log('[Session] Using PostgreSQL session store');
  } else {
    // Fallback to memory store
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    console.warn('[Session] Using memory session store (fallback mode)');
  }
  
  sessionMiddlewareInstance = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust proxy for secure cookies
    cookie: {
      httpOnly: true,
      // Use secure cookies in production or on Replit (which uses HTTPS even in dev)
      secure: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DOMAINS,
      // Use 'lax' to allow OAuth callbacks (cookies sent on top-level navigation from external sites like Google)
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
  
  // Expose store for WebSocket authentication
  (sessionMiddlewareInstance as any).store = sessionStore;
  
  return sessionMiddlewareInstance;
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const userData: any = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  };

  // In development mode, allow setting role from OIDC claims for testing
  if (process.env.NODE_ENV === "development" && claims["roles"] && Array.isArray(claims["roles"]) && claims["roles"].length > 0) {
    userData.role = claims["roles"][0];
  }

  await storage.upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only setup Replit Auth if REPLIT_DOMAINS is available
  if (!isReplitAuthEnabled) {
    console.warn("REPLIT_DOMAINS not found - Replit Auth disabled. Using local auth only.");
    
    // Provide fallback login/logout routes
    app.get("/api/login", (req, res) => {
      res.status(503).json({ 
        message: "Replit Auth not configured. Please use local login.",
        localLoginUrl: "/login"
      });
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
    
    return;
  }

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
    }

    // Note: serializeUser/deserializeUser are shared between Replit Auth and Google OAuth
    // They are defined here but work for both strategies
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
    
    console.log("Replit Auth configured successfully");
  } catch (error) {
    console.error("Error setting up Replit Auth:", error);
    console.warn("Falling back to local auth only");
    
    // Provide fallback routes in case of error
    app.get("/api/login", (req, res) => {
      res.status(503).json({ 
        message: "Replit Auth configuration error. Please use local login.",
        localLoginUrl: "/login"
      });
    });
    
    app.get("/api/callback", (req, res) => {
      res.redirect("/");
    });
    
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  const reqPath = req.path;
  const isExternalRentalFormTokens = reqPath === "/api/external/rental-form-tokens";
  
  if (isExternalRentalFormTokens) {
    console.log("[Auth Debug] rental-form-tokens: session exists?", !!req.session, "adminUser?", !!req.session?.adminUser, "userId?", !!req.session?.userId);
  }
  
  // Check if admin is impersonating another user
  if (req.session?.impersonatedUserId && req.session?.originalAdminId) {
    try {
      const impersonatedUser = await storage.getUser(req.session.impersonatedUserId);
      if (impersonatedUser) {
        req.user = {
          claims: {
            sub: impersonatedUser.id,
            email: impersonatedUser.email,
            first_name: impersonatedUser.firstName,
            last_name: impersonatedUser.lastName,
          },
          localAuth: true,
          isImpersonated: true,
          originalAdminId: req.session.originalAdminId,
          cachedRole: impersonatedUser.additionalRole || impersonatedUser.role,
          cachedAgencyId: impersonatedUser.externalAgencyId,
        };
        return next();
      }
    } catch (error) {
      console.error("Error loading impersonated user:", error);
      // Clear impersonation on error
      delete req.session.impersonatedUserId;
      delete req.session.originalAdminId;
    }
  }
  
  // Check if admin is authenticated via local session
  if (req.session && req.session.adminUser) {
    // Normalize admin identity into req.user for consistent downstream access
    req.user = {
      claims: {
        sub: req.session.adminUser.id,
        email: req.session.adminUser.email,
        first_name: req.session.adminUser.firstName,
        last_name: req.session.adminUser.lastName,
      },
      adminAuth: true, // Flag to indicate admin authentication
    };
    return next();
  }

  // Check if user is authenticated via local login (email/password)
  if (req.session && req.session.userId) {
    try {
      // Cache TTL: 5 minutes (300000 ms) - balance between performance and security
      const CACHE_TTL_MS = 5 * 60 * 1000;
      const now = Date.now();
      
      // Use cached user data if available and not expired, otherwise fetch from DB
      let localUser = req.session.cachedUser;
      const cacheValid = localUser 
        && localUser.id === req.session.userId 
        && localUser.cachedAt 
        && (now - localUser.cachedAt) < CACHE_TTL_MS;
      
      if (!cacheValid) {
        const dbUser = await storage.getUser(req.session.userId);
        if (dbUser) {
          // Cache user data in session (role, agencyId, etc.) with timestamp
          req.session.cachedUser = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.additionalRole || dbUser.role,
            externalAgencyId: dbUser.externalAgencyId,
            isSuspended: dbUser.isSuspended,
            cachedAt: now,
          };
          localUser = req.session.cachedUser;
        } else {
          localUser = null;
        }
      }
      
      // Block suspended users from accessing the app
      if (localUser?.isSuspended) {
        // Clear the session to force logout
        req.session.destroy((err: any) => {
          if (err) console.error("Error destroying session for suspended user:", err);
        });
        return res.status(403).json({ 
          message: "Tu cuenta ha sido suspendida. Contacta al administrador.",
          code: "ACCOUNT_SUSPENDED"
        });
      }
      
      if (localUser) {
        // Attach user to request for downstream middleware
        req.user = {
          claims: {
            sub: localUser.id,
            email: localUser.email,
            first_name: localUser.firstName,
            last_name: localUser.lastName,
          },
          localAuth: true, // Flag to indicate local authentication
          // Include cached role and agencyId for requireRole middleware
          cachedRole: req.session.cachedUser?.role,
          cachedAgencyId: req.session.cachedUser?.externalAgencyId,
        };
        return next();
      }
    } catch (error) {
      console.error("Error loading local user session:", error);
    }
  }

  // Check if user is authenticated via Google OAuth
  const user = req.user as any;
  if (req.isAuthenticated() && user?.googleAuth) {
    // Check if Google OAuth user is suspended and cache role/agencyId
    if (user.claims?.sub) {
      const dbUser = await storage.getUser(user.claims.sub);
      if (dbUser?.isSuspended) {
        req.logout(() => {});
        return res.status(403).json({ 
          message: "Tu cuenta ha sido suspendida. Contacta al administrador.",
          code: "ACCOUNT_SUSPENDED"
        });
      }
      // Cache role and agencyId for requireRole middleware
      if (dbUser) {
        user.cachedRole = dbUser.additionalRole || dbUser.role;
        user.cachedAgencyId = dbUser.externalAgencyId;
      }
    }
    // Google OAuth session - no token refresh needed
    return next();
  }

  // Check if user is authenticated via Replit Auth
  if (!req.isAuthenticated() || !user?.expires_at) {
    if (isExternalRentalFormTokens) {
      console.log("[Auth Debug] rental-form-tokens: Returning 401 - isAuthenticated:", req.isAuthenticated(), "expires_at:", user?.expires_at);
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    // Check admin session first
    if (req.session && req.session.adminUser) {
      const adminRole = req.session.adminUser.role;
      if (!allowedRoles.includes(adminRole)) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }
      return next();
    }

    // Try to use cached role from isAuthenticated middleware (local auth)
    if (req.user?.cachedRole) {
      if (!allowedRoles.includes(req.user.cachedRole)) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }
      return next();
    }

    // Get user ID from either local session or Replit Auth
    let userId: string | undefined;
    
    // Check for local login session
    if (req.session && req.session.userId) {
      userId = req.session.userId;
    }
    // Check for Replit Auth
    else if (req.user && (req.user as any).claims) {
      userId = (req.user as any).claims.sub;
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if we have cached user data in session (with TTL validation)
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    let userRole: string | undefined;
    
    const cacheValid = req.session?.cachedUser?.id === userId 
      && req.session.cachedUser.role
      && req.session.cachedUser.cachedAt
      && (now - req.session.cachedUser.cachedAt) < CACHE_TTL_MS;
    
    if (cacheValid) {
      userRole = req.session.cachedUser.role;
    } else {
      // Fetch from DB if not cached or cache expired
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        return res.status(401).json({ message: "Unauthorized: user not found" });
      }
      userRole = dbUser.additionalRole || dbUser.role;
      
      // Cache for future requests with timestamp
      req.session.cachedUser = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: userRole,
        externalAgencyId: dbUser.externalAgencyId,
        cachedAt: now,
      };
    }
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};
