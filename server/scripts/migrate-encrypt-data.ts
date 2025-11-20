import { db } from "../db";
import { users, externalUnitAccessControls } from "../../shared/schema";
import { encrypt, isEncrypted } from "../encryption";
import { eq, isNotNull, sql } from "drizzle-orm";

/**
 * Migration script to encrypt existing sensitive data in the database
 * 
 * This script should be run ONCE before deploying encryption changes to production.
 * It will:
 * 1. Find all records with unencrypted sensitive data
 * 2. Encrypt the data using AES-256-GCM
 * 3. Update the records in the database
 * 
 * IMPORTANT: 
 * - Back up your database before running this script
 * - Ensure ENCRYPTION_KEY is set in environment
 * - Run this script in a maintenance window
 * - Verify encryption after completion
 */

interface MigrationStats {
  totalAccessControls: number;
  encryptedAccessControls: number;
  failedAccessControls: number;
  totalUsers: number;
  encryptedBankAccounts: number;
  encryptedClabes: number;
  failedUsers: number;
}

async function migrateAccessControls(): Promise<{ encrypted: number; failed: number; total: number }> {
  console.log("\n🔐 Starting access controls encryption migration...");
  
  const stats = { encrypted: 0, failed: 0, total: 0 };
  
  try {
    // Find all access controls with non-null access codes
    const controls = await db
      .select()
      .from(externalUnitAccessControls)
      .where(isNotNull(externalUnitAccessControls.accessCode));
    
    stats.total = controls.length;
    console.log(`   Found ${controls.length} access controls with access codes`);
    
    for (const control of controls) {
      try {
        // Check if already encrypted using proper detection
        if (isEncrypted(control.accessCode)) {
          console.log(`   ⏭️  Skipping ${control.id} (already encrypted)`);
          continue;
        }
        
        // Encrypt the access code (encrypt is now idempotent)
        const encryptedCode = encrypt(control.accessCode!);
        
        // Update the record - preserve original updatedAt
        await db
          .update(externalUnitAccessControls)
          .set({ 
            accessCode: encryptedCode
            // Do NOT update updatedAt to preserve audit history
          })
          .where(eq(externalUnitAccessControls.id, control.id));
        
        stats.encrypted++;
        console.log(`   ✅ Encrypted access control ${control.id}`);
        
      } catch (error) {
        stats.failed++;
        console.error(`   ❌ Failed to encrypt access control ${control.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during access controls migration:", error);
    throw error;
  }
  
  return stats;
}

async function migrateUserBankInfo(): Promise<{ encrypted: number; failed: number; total: number; accounts: number; clabes: number }> {
  console.log("\n🔐 Starting user bank information encryption migration...");
  
  const stats = { encrypted: 0, failed: 0, total: 0, accounts: 0, clabes: 0 };
  
  try {
    // Find all users with bank information
    const usersWithBankInfo = await db
      .select()
      .from(users)
      .where(
        sql`${users.bankAccountNumber} IS NOT NULL OR ${users.bankClabe} IS NOT NULL`
      );
    
    stats.total = usersWithBankInfo.length;
    console.log(`   Found ${usersWithBankInfo.length} users with bank information`);
    
    for (const user of usersWithBankInfo) {
      try {
        const updates: any = {};
        let needsUpdate = false;
        
        // Encrypt bank account number if present and not already encrypted
        if (user.bankAccountNumber) {
          if (!isEncrypted(user.bankAccountNumber)) {
            updates.bankAccountNumber = encrypt(user.bankAccountNumber);
            stats.accounts++;
            needsUpdate = true;
            console.log(`   ✅ Encrypted bank account for user ${user.id}`);
          } else {
            console.log(`   ⏭️  Skipping bank account for user ${user.id} (already encrypted)`);
          }
        }
        
        // Encrypt CLABE if present and not already encrypted
        if (user.bankClabe) {
          if (!isEncrypted(user.bankClabe)) {
            updates.bankClabe = encrypt(user.bankClabe);
            stats.clabes++;
            needsUpdate = true;
            console.log(`   ✅ Encrypted CLABE for user ${user.id}`);
          } else {
            console.log(`   ⏭️  Skipping CLABE for user ${user.id} (already encrypted)`);
          }
        }
        
        // Update if any field was encrypted - preserve original updatedAt
        if (needsUpdate) {
          await db
            .update(users)
            .set(updates)
            .where(eq(users.id, user.id));
          
          stats.encrypted++;
        }
        
      } catch (error) {
        stats.failed++;
        console.error(`   ❌ Failed to encrypt bank info for user ${user.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ Error during user bank info migration:", error);
    throw error;
  }
  
  return stats;
}

async function verifyEncryption(): Promise<boolean> {
  console.log("\n🔍 Verifying encryption...");
  
  try {
    // Check access controls using proper encryption detection
    const unencryptedControls = await db
      .select()
      .from(externalUnitAccessControls)
      .where(
        sql`${externalUnitAccessControls.accessCode} IS NOT NULL 
            AND ${externalUnitAccessControls.accessCode} NOT LIKE 'ENC:v1:%'`
      )
      .limit(5);
    
    if (unencryptedControls.length > 0) {
      console.log(`   ⚠️  Found ${unencryptedControls.length} unencrypted access controls`);
      console.log("   Sample IDs:", unencryptedControls.map(c => c.id).join(", "));
    } else {
      console.log("   ✅ All access controls appear to be encrypted");
    }
    
    // Check user bank info using proper encryption detection
    const unencryptedUsers = await db
      .select()
      .from(users)
      .where(
        sql`(${users.bankAccountNumber} IS NOT NULL AND ${users.bankAccountNumber} NOT LIKE 'ENC:v1:%')
            OR (${users.bankClabe} IS NOT NULL AND ${users.bankClabe} NOT LIKE 'ENC:v1:%')`
      )
      .limit(5);
    
    if (unencryptedUsers.length > 0) {
      console.log(`   ⚠️  Found ${unencryptedUsers.length} users with unencrypted bank records`);
      console.log("   Sample IDs:", unencryptedUsers.map(u => u.id).join(", "));
    } else {
      console.log("   ✅ All user bank information appears to be encrypted");
    }
    
    return unencryptedControls.length === 0 && unencryptedUsers.length === 0;
    
  } catch (error) {
    console.error("❌ Error during verification:", error);
    return false;
  }
}

async function runMigration() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║       SENSITIVE DATA ENCRYPTION MIGRATION                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("⚠️  WARNING: This script will encrypt sensitive data in the database");
  console.log("⚠️  Ensure you have a database backup before proceeding");
  console.log("");
  
  // Check if ENCRYPTION_KEY is set
  if (!process.env.ENCRYPTION_KEY) {
    console.log("⚠️  WARNING: ENCRYPTION_KEY not set, using development key");
    console.log("   This is NOT secure for production data!");
    console.log("");
  }
  
  const startTime = Date.now();
  
  try {
    // Migrate access controls
    const accessControlStats = await migrateAccessControls();
    
    // Migrate user bank info
    const userStats = await migrateUserBankInfo();
    
    // Verify encryption
    const allEncrypted = await verifyEncryption();
    
    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                     MIGRATION SUMMARY                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("📊 Access Controls:");
    console.log(`   Total records:      ${accessControlStats.total}`);
    console.log(`   Encrypted:          ${accessControlStats.encrypted}`);
    console.log(`   Failed:             ${accessControlStats.failed}`);
    console.log("");
    console.log("📊 User Bank Information:");
    console.log(`   Total users:        ${userStats.total}`);
    console.log(`   Users updated:      ${userStats.encrypted}`);
    console.log(`   Account numbers:    ${userStats.accounts}`);
    console.log(`   CLABEs:             ${userStats.clabes}`);
    console.log(`   Failed:             ${userStats.failed}`);
    console.log("");
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log("");
    
    if (allEncrypted) {
      console.log("✅ MIGRATION COMPLETED SUCCESSFULLY");
      console.log("✅ All sensitive data appears to be encrypted");
    } else {
      console.log("⚠️  MIGRATION COMPLETED WITH WARNINGS");
      console.log("⚠️  Some data may not be encrypted - review logs above");
    }
    
    console.log("");
    console.log("Next steps:");
    console.log("1. Verify application can read encrypted data correctly");
    console.log("2. Test creating new records to ensure encryption works");
    console.log("3. Monitor logs for decryption errors");
    console.log("");
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ MIGRATION FAILED");
    console.error(error);
    console.log("\n⚠️  Database may be in an inconsistent state");
    console.log("⚠️  Restore from backup and investigate the error");
    process.exit(1);
  }
}

// Run the migration
runMigration();
