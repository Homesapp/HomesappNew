import { db } from "./db";
import { properties, condominiums, condominiumUnits } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateProperties() {
  console.log("📋 Actualizando propiedades con condominios y unidades...\n");

  // Get all properties
  const allProperties = await db.select().from(properties);
  console.log(`Total de propiedades: ${allProperties.length}\n`);

  // Get all condominiums with their units
  const allCondominiums = await db
    .select()
    .from(condominiums)
    .orderBy(condominiums.name);

  const condominiumsWithUnits = await Promise.all(
    allCondominiums.map(async (condo) => {
      const units = await db
        .select()
        .from(condominiumUnits)
        .where(eq(condominiumUnits.condominiumId, condo.id))
        .limit(10);
      return {
        condo,
        units,
      };
    })
  );

  // Filter condominiums that have units
  const condosWithUnits = condominiumsWithUnits.filter((c) => c.units.length > 0);
  console.log(`Condominios con unidades disponibles: ${condosWithUnits.length}\n`);

  let updated = 0;
  let index = 0;

  for (const property of allProperties) {
    // Skip if already has condominium and unit
    if (property.condominiumId && property.unitNumber) {
      console.log(`✓ Propiedad ${property.id} ya tiene condominio y unidad`);
      continue;
    }

    // Get a condominium and unit (cycling through the list)
    const condoData = condosWithUnits[index % condosWithUnits.length];
    const unit = condoData.units[Math.floor(Math.random() * condoData.units.length)];

    await db
      .update(properties)
      .set({
        condominiumId: condoData.condo.id,
        condoName: condoData.condo.name,
        unitNumber: unit.unitNumber,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, property.id));

    console.log(
      `✅ Propiedad ${property.id} actualizada: ${condoData.condo.name} - ${unit.unitNumber}`
    );
    updated++;
    index++;
  }

  console.log(`\n✅ Actualización completada:`);
  console.log(`   📊 Propiedades actualizadas: ${updated}`);
  console.log(`   📊 Propiedades sin cambios: ${allProperties.length - updated}`);
}

// Execute
updateProperties()
  .then(() => {
    console.log("\n🎉 Script ejecutado exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error durante la actualización:", error);
    process.exit(1);
  });
