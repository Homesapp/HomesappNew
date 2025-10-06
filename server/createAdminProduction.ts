import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function createAdminInProduction() {
  try {
    // Check if we should use production database
    const useProduction = process.env.USE_PRODUCTION === "true";
    const databaseUrl = useProduction 
      ? process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error("Error: No database URL found");
      console.log("Make sure DATABASE_URL or PROD_DATABASE_URL is set");
      process.exit(1);
    }

    console.log(`Connecting to ${useProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database...`);
    const sql = neon(databaseUrl);

    // Get username and password from command line or use defaults
    const username = process.argv[2] || "admin";
    const password = process.argv[3] || "admin123";

    console.log(`Creating admin user: ${username}`);

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT id FROM admin_users WHERE username = ${username}
    `;

    if (existingAdmin.length > 0) {
      console.log(`❌ Admin with username "${username}" already exists`);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const result = await sql`
      INSERT INTO admin_users (id, username, email, "passwordHash", "firstName", "lastName", role, "isActive")
      VALUES (
        gen_random_uuid(),
        ${username},
        ${username}@homesapp.com,
        ${passwordHash},
        'Admin',
        'User',
        'master',
        true
      )
      RETURNING id, username, email, role
    `;

    console.log("\n✅ Admin created successfully:");
    console.log(`Username: ${result[0].username}`);
    console.log(`Email: ${result[0].email}`);
    console.log(`Role: ${result[0].role}`);
    console.log(`ID: ${result[0].id}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`\nYou can now login at your published app's /login page`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdminInProduction();
