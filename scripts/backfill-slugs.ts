/**
 * Backfill Slugs Script
 * 
 * Adds slugs to existing external_agencies and external_units that don't have them.
 * Run with: npx tsx scripts/backfill-slugs.ts
 */

import { db } from "../server/db";
import { externalAgencies, externalUnits, externalCondominiums } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function generatePropertySlug(condoName: string, unitNumber: string): string {
  const condoSlug = generateSlug(condoName);
  const unitSlug = generateSlug(unitNumber);
  return `${condoSlug}-${unitSlug}`;
}

async function backfillSlugs() {
  console.log("🔧 Starting slug backfill...\n");

  try {
    // 1. Backfill agency slugs
    console.log("📦 Backfilling agency slugs...");
    const agenciesWithoutSlugs = await db.select()
      .from(externalAgencies)
      .where(isNull(externalAgencies.slug));
    
    console.log(`   Found ${agenciesWithoutSlugs.length} agencies without slugs`);
    
    for (const agency of agenciesWithoutSlugs) {
      let baseSlug = generateSlug(agency.name);
      let uniqueSlug = baseSlug;
      let suffix = 1;
      
      // Ensure uniqueness
      while (true) {
        const existing = await db.select({ id: externalAgencies.id })
          .from(externalAgencies)
          .where(eq(externalAgencies.slug, uniqueSlug))
          .limit(1);
        if (existing.length === 0) break;
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }
      
      await db.update(externalAgencies)
        .set({ slug: uniqueSlug })
        .where(eq(externalAgencies.id, agency.id));
      
      console.log(`   ✓ ${agency.name} → ${uniqueSlug}`);
    }
    
    // 2. Backfill unit slugs
    console.log("\n🏠 Backfilling unit slugs...");
    const unitsWithoutSlugs = await db.select({
      unit: externalUnits,
      condo: externalCondominiums,
    })
      .from(externalUnits)
      .leftJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
      .where(isNull(externalUnits.slug));
    
    console.log(`   Found ${unitsWithoutSlugs.length} units without slugs`);
    
    for (const { unit, condo } of unitsWithoutSlugs) {
      let baseSlug: string;
      
      if (condo?.name) {
        baseSlug = generatePropertySlug(condo.name, unit.unitNumber);
      } else if (unit.title) {
        baseSlug = generateSlug(unit.title);
      } else {
        baseSlug = generateSlug(unit.unitNumber);
      }
      
      let uniqueSlug = baseSlug;
      let suffix = 1;
      
      // Ensure uniqueness
      while (true) {
        const existing = await db.select({ id: externalUnits.id })
          .from(externalUnits)
          .where(eq(externalUnits.slug, uniqueSlug))
          .limit(1);
        if (existing.length === 0) break;
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }
      
      await db.update(externalUnits)
        .set({ slug: uniqueSlug })
        .where(eq(externalUnits.id, unit.id));
      
      const displayName = condo?.name 
        ? `${condo.name} - ${unit.unitNumber}`
        : unit.title || unit.unitNumber;
      console.log(`   ✓ ${displayName} → ${uniqueSlug}`);
    }
    
    console.log("\n✅ Slug backfill completed successfully!");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

backfillSlugs();
