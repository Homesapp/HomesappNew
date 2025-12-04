import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Fallback logic: Use SOURCE_DATABASE_URL if DATABASE_URL is corrupted or missing
// Accept both postgres:// and postgresql:// as valid prefixes (Neon uses postgres://)
const isValidDbUrl = (url: string | undefined): boolean => {
  return !!url && (url.startsWith('postgresql://') || url.startsWith('postgres://'));
};

const databaseUrl = isValidDbUrl(process.env.DATABASE_URL)
  ? process.env.DATABASE_URL 
  : process.env.SOURCE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
