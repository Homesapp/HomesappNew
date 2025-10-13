import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
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

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust proxy for secure cookies
    cookie: {
      httpOnly: true,
      // Use secure cookies in production or on Replit (which uses HTTPS even in dev)
      secure: process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DOMAINS,
      sameSite: 'strict',
      maxAge: sessionTtl,
    },
  });
  
  // Expose store for WebSocket authentication
  (sessionMiddleware as any).store = sessionStore;
  
  return sessionMiddleware;
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
      const localUser = await storage.getUser(req.session.userId);
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
        };
        return next();
      }
    } catch (error) {
      console.error("Error loading local user session:", error);
    }
  }

  // Check if user is authenticated via Replit Auth
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.expires_at) {
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

    // Check user authenticated via local login or Replit Auth
    const user = req.user as any;
    if (!user || !user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.claims.sub;
    const dbUser = await storage.getUser(userId);

    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    // For local auth users, check their role directly
    // For Replit Auth users, also check their role
    const userRole = dbUser.additionalRole || dbUser.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};
