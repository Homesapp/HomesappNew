/**
 * Script para generar pagos automáticamente desde payment schedules activos
 * 
 * Este script:
 * 1. Busca todos los schedules activos
 * 2. Para cada schedule, verifica si ya existe un pago para el mes actual
 * 3. Si no existe, crea el pago automáticamente
 * 4. Opcionalmente envía notificaciones de recordatorio
 * 
 * Ejecutar mensualmente mediante cronjob:
 * npm run generate-scheduled-payments
 */

import { db } from "../db";
import {  
  externalPaymentSchedules, 
  externalPayments,
  externalRentalContracts,
  type InsertExternalPayment,
} from "../../shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

interface PaymentStats {
  schedulesProcessed: number;
  paymentsCreated: number;
  paymentsSkipped: number;
  errors: number;
}

/**
 * Genera pagos para el mes especificado desde todos los schedules activos
 */
async function generatePaymentsForMonth(targetMonth: Date): Promise<PaymentStats> {
  const stats: PaymentStats = {
    schedulesProcessed: 0,
    paymentsCreated: 0,
    paymentsSkipped: 0,
    errors: 0,
  };
  
  console.log(`\n📅 Generating payments for: ${targetMonth.toLocaleDateString()}`);
  
  try {
    // Get all active payment schedules
    const schedules = await db
      .select()
      .from(externalPaymentSchedules)
      .where(eq(externalPaymentSchedules.isActive, true));
    
    console.log(`   Found ${schedules.length} active payment schedules`);
    
    for (const schedule of schedules) {
      stats.schedulesProcessed++;
      
      try {
        // Get the contract to check if it's still active
        const [contract] = await db
          .select()
          .from(externalRentalContracts)
          .where(eq(externalRentalContracts.id, schedule.contractId));
        
        if (!contract) {
          console.log(`   ⏭️  Skipping schedule ${schedule.id}: Contract not found`);
          stats.paymentsSkipped++;
          continue;
        }
        
        // Check if contract is still active for this month
        const targetMonthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
        if (contract.status !== 'active' || contract.endDate < targetMonth) {
          console.log(`   ⏭️  Skipping schedule ${schedule.id}: Contract not active for this period`);
          stats.paymentsSkipped++;
          continue;
        }
        
        // Calculate due date for this month
        let dayOfMonth = schedule.dayOfMonth;
        const monthDays = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
        
        // Adjust if dayOfMonth exceeds days in month (e.g., 31 in February)
        if (dayOfMonth > monthDays) {
          dayOfMonth = monthDays;
        }
        
        const dueDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          dayOfMonth,
          12, // Noon
          0,
          0
        );
        
        // Check if payment already exists for this schedule and date
        const existingPayment = await db
          .select()
          .from(externalPayments)
          .where(
            and(
              eq(externalPayments.scheduleId, schedule.id),
              sql`DATE(${externalPayments.dueDate}) = DATE(${dueDate})`
            )
          )
          .limit(1);
        
        if (existingPayment.length > 0) {
          console.log(`   ⏭️  Payment already exists for schedule ${schedule.id} on ${dueDate.toLocaleDateString()}`);
          stats.paymentsSkipped++;
          continue;
        }
        
        // Create the payment
        const newPayment: InsertExternalPayment = {
          agencyId: schedule.agencyId,
          contractId: schedule.contractId,
          scheduleId: schedule.id,
          serviceType: schedule.serviceType,
          amount: schedule.amount,
          currency: schedule.currency,
          dueDate,
          status: 'pending',
          notes: `Auto-generated from payment schedule (${schedule.serviceType})`,
        };
        
        await db.insert(externalPayments).values(newPayment);
        
        stats.paymentsCreated++;
        console.log(`   ✅ Created payment for schedule ${schedule.id}: ${schedule.serviceType} - $${schedule.amount} due ${dueDate.toLocaleDateString()}`);
        
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing schedule ${schedule.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error fetching payment schedules:", error);
    throw error;
  }
  
  return stats;
}

/**
 * Main execution function
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          AUTOMATIC PAYMENT GENERATION FROM SCHEDULES          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  
  try {
    // Get target month from command line argument or use current month
    const args = process.argv.slice(2);
    let targetMonth: Date;
    
    if (args.length > 0) {
      // Format: YYYY-MM
      const [year, month] = args[0].split('-').map(Number);
      targetMonth = new Date(year, month - 1, 1);
      console.log(`\n📆 Using specified month: ${args[0]}`);
    } else {
      // Use current month
      const now = new Date();
      targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      console.log(`\n📆 Using current month: ${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`);
    }
    
    const stats = await generatePaymentsForMonth(targetMonth);
    
    console.log("\n" + "=".repeat(64));
    console.log("📊 GENERATION SUMMARY");
    console.log("=".repeat(64));
    console.log(`   Schedules Processed: ${stats.schedulesProcessed}`);
    console.log(`   Payments Created:    ${stats.paymentsCreated}`);
    console.log(`   Payments Skipped:    ${stats.paymentsSkipped}`);
    console.log(`   Errors:              ${stats.errors}`);
    console.log("=".repeat(64));
    
    if (stats.errors > 0) {
      console.log("\n⚠️  Some payments failed to generate. Please review errors above.");
      process.exit(1);
    } else if (stats.paymentsCreated === 0) {
      console.log("\n✅ No new payments needed. All schedules up to date!");
    } else {
      console.log(`\n✅ Successfully generated ${stats.paymentsCreated} new payment(s)!`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ Fatal error during payment generation:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { generatePaymentsForMonth };
