import { db } from "../db";
import { users, externalUnitAccessControls } from "../../shared/schema";
import { decrypt, isEncrypted } from "../encryption";
import { isNotNull, sql } from "drizzle-orm";

/**
 * Verification script to test encryption/decryption functionality
 * 
 * This script:
 * 1. Samples encrypted records from the database
 * 2. Attempts to decrypt them
 * 3. Reports any errors
 * 
 * Run this after the migration to verify everything works correctly.
 */

async function verifyAccessControls(): Promise<{ total: number; successful: number; failed: number }> {
  console.log("\n🔍 Verifying access controls encryption...");
  
  const stats = { total: 0, successful: 0, failed: 0 };
  
  try {
    // Sample 10 access controls
    const controls = await db
      .select()
      .from(externalUnitAccessControls)
      .where(isNotNull(externalUnitAccessControls.accessCode))
      .limit(10);
    
    stats.total = controls.length;
    console.log(`   Testing ${controls.length} access controls`);
    
    for (const control of controls) {
      try {
        if (control.accessCode) {
          // Check if encrypted
          if (!isEncrypted(control.accessCode)) {
            console.log(`   ⚠️  ${control.id}: NOT ENCRYPTED (plaintext)`);
            stats.failed++;
            continue;
          }
          
          const decrypted = decrypt(control.accessCode);
          stats.successful++;
          console.log(`   ✅ ${control.id}: Decrypted successfully (length: ${decrypted.length})`);
        }
      } catch (error) {
        stats.failed++;
        console.error(`   ❌ ${control.id}: Decryption failed:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ Error verifying access controls:", error);
  }
  
  return stats;
}

async function verifyUserBankInfo(): Promise<{ total: number; successful: number; failed: number }> {
  console.log("\n🔍 Verifying user bank information encryption...");
  
  const stats = { total: 0, successful: 0, failed: 0 };
  
  try {
    // Sample 10 users with bank info
    const usersWithBank = await db
      .select()
      .from(users)
      .where(
        sql`${users.bankAccountNumber} IS NOT NULL OR ${users.bankClabe} IS NOT NULL`
      )
      .limit(10);
    
    stats.total = usersWithBank.length;
    console.log(`   Testing ${usersWithBank.length} users`);
    
    for (const user of usersWithBank) {
      try {
        let userSuccess = true;
        
        if (user.bankAccountNumber) {
          try {
            if (!isEncrypted(user.bankAccountNumber)) {
              console.log(`   ⚠️  ${user.id}: Bank account NOT ENCRYPTED (plaintext)`);
              userSuccess = false;
            } else {
              const decrypted = decrypt(user.bankAccountNumber);
              console.log(`   ✅ ${user.id}: Bank account decrypted (length: ${decrypted.length})`);
            }
          } catch (error) {
            console.error(`   ❌ ${user.id}: Bank account decryption failed:`, error);
            userSuccess = false;
          }
        }
        
        if (user.bankClabe) {
          try {
            if (!isEncrypted(user.bankClabe)) {
              console.log(`   ⚠️  ${user.id}: CLABE NOT ENCRYPTED (plaintext)`);
              userSuccess = false;
            } else {
              const decrypted = decrypt(user.bankClabe);
              console.log(`   ✅ ${user.id}: CLABE decrypted (length: ${decrypted.length})`);
            }
          } catch (error) {
            console.error(`   ❌ ${user.id}: CLABE decryption failed:`, error);
            userSuccess = false;
          }
        }
        
        if (userSuccess) {
          stats.successful++;
        } else {
          stats.failed++;
        }
        
      } catch (error) {
        stats.failed++;
        console.error(`   ❌ ${user.id}: Verification failed:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ Error verifying user bank info:", error);
  }
  
  return stats;
}

async function runVerification() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          ENCRYPTION VERIFICATION TEST                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  
  if (!process.env.ENCRYPTION_KEY) {
    console.log("⚠️  WARNING: ENCRYPTION_KEY not set, using development key");
    console.log("");
  }
  
  const startTime = Date.now();
  
  try {
    const accessControlStats = await verifyAccessControls();
    const userStats = await verifyUserBankInfo();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                  VERIFICATION SUMMARY                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("📊 Access Controls:");
    console.log(`   Total tested:       ${accessControlStats.total}`);
    console.log(`   Successful:         ${accessControlStats.successful}`);
    console.log(`   Failed:             ${accessControlStats.failed}`);
    console.log("");
    console.log("📊 User Bank Information:");
    console.log(`   Total tested:       ${userStats.total}`);
    console.log(`   Successful:         ${userStats.successful}`);
    console.log(`   Failed:             ${userStats.failed}`);
    console.log("");
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log("");
    
    const totalTests = accessControlStats.total + userStats.total;
    const totalSuccess = accessControlStats.successful + userStats.successful;
    const totalFailed = accessControlStats.failed + userStats.failed;
    
    if (totalFailed === 0 && totalTests > 0) {
      console.log("✅ ALL TESTS PASSED");
      console.log("✅ Encryption/decryption is working correctly");
    } else if (totalTests === 0) {
      console.log("ℹ️  NO DATA TO TEST");
      console.log("   Database appears to be empty or has no encrypted data");
    } else {
      console.log("❌ SOME TESTS FAILED");
      console.log(`   ${totalFailed} out of ${totalTests} tests failed`);
      console.log("   Review the errors above");
    }
    
    console.log("");
    
    process.exit(totalFailed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED");
    console.error(error);
    process.exit(1);
  }
}

// Run verification
runVerification();
