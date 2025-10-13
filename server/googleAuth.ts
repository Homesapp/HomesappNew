import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";

export function setupGoogleAuth(app: Express) {
  // Check if Google OAuth credentials are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found - Google direct login disabled");
    return;
  }

  // Build the full callback URL
  // In development, use REPLIT_DEV_DOMAIN. In production, use first domain from REPLIT_DOMAINS
  let callbackURL: string;
  
  if (process.env.NODE_ENV === 'production' && process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    callbackURL = `https://${domain}/auth/google/callback`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    callbackURL = `https://${process.env.REPLIT_DEV_DOMAIN}/auth/google/callback`;
  } else {
    // Fallback for local development
    callbackURL = "http://localhost:5000/auth/google/callback";
  }

  console.log(`Google OAuth callback URL: ${callbackURL}`);

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Extract user data from Google profile
          const userData = {
            id: profile.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value || null,
          };

          // Create or update user in database
          await storage.upsertUser(userData);

          // Return user for session
          done(null, {
            claims: {
              sub: profile.id,
              email: userData.email,
              first_name: userData.firstName,
              last_name: userData.lastName,
              profile_image_url: userData.profileImageUrl,
            },
            googleAuth: true,
          });
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          done(error, null);
        }
      }
    )
  );

  // Google OAuth Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account", // Always show account selector
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      // Successful authentication
      console.log("Google OAuth callback successful");
      console.log("User authenticated:", req.isAuthenticated());
      console.log("User data:", req.user);
      console.log("Session ID:", req.sessionID);
      
      // Redirect to home
      res.redirect("/");
    }
  );

  console.log("Google OAuth direct login configured successfully");
}
