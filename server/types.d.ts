import "express-session";

declare module "express-session" {
  interface SessionData {
    adminUser?: {
      id: string;
      username: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
    };
  }
}
