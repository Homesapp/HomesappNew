import bcrypt from "bcryptjs";
import { storage } from "./storage";

async function createAdmin() {
  try {
    const username = process.argv[2] || "admin";
    const password = process.argv[3] || "admin123";
    
    // Check if admin already exists
    const existingAdmin = await storage.getAdminByUsername(username);
    if (existingAdmin) {
      console.log(`Admin with username "${username}" already exists`);
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create admin
    const admin = await storage.createAdmin({
      username,
      passwordHash,
      email: `${username}@homesapp.com`,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
    });
    
    console.log("Admin created successfully:");
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`ID: ${admin.id}`);
    console.log(`\nYou can now login with these credentials.`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
