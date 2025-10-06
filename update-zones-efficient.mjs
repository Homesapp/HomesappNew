import { readFileSync, writeFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Leer el mapeo
const mapping = JSON.parse(readFileSync('condominium-colony-mapping.json', 'utf8'));

console.log('📊 Obteniendo condominios de la base de datos...\n');

// Obtener todos los condominios
const condominiums = await sql`SELECT id, name, zone FROM condominiums`;

console.log(`✅ ${condominiums.length} condominios encontrados en la base de datos\n`);

// Crear un mapa normalizado para mejor matching
const normalizedMapping = {};
for (const [name, zone] of Object.entries(mapping)) {
  const normalized = name.toLowerCase().trim();
  normalizedMapping[normalized] = { original: name, zone };
}

const updates = [];
const notInMapping = [];

for (const condo of condominiums) {
  const normalizedName = condo.name.toLowerCase().trim();
  
  if (normalizedMapping[normalizedName]) {
    const match = normalizedMapping[normalizedName];
    updates.push({
      id: condo.id,
      name: condo.name,
      currentZone: condo.zone,
      newZone: match.zone
    });
  } else {
    notInMapping.push(condo.name);
  }
}

console.log(`🔍 Análisis:`);
console.log(`   ✅ Coincidencias encontradas: ${updates.length}`);
console.log(`   ⚠️  No encontrados en mapeo: ${notInMapping.length}\n`);

if (notInMapping.length > 0 && notInMapping.length <= 20) {
  console.log('📝 Condominios sin mapeo:');
  notInMapping.forEach(name => console.log(`   - ${name}`));
  console.log();
}

// Guardar reporte
const report = {
  timestamp: new Date().toISOString(),
  total: condominiums.length,
  toUpdate: updates.length,
  notInMapping: notInMapping.length,
  updates,
  notInMappingList: notInMapping
};

writeFileSync('update-report.json', JSON.stringify(report, null, 2));
console.log('📄 Reporte guardado en: update-report.json\n');

// Realizar las actualizaciones
console.log('🔄 Actualizando zonas...\n');

let updated = 0;
let skipped = 0;

for (const update of updates) {
  try {
    // Solo actualizar si la zona ha cambiado
    if (update.currentZone === update.newZone) {
      skipped++;
      continue;
    }
    
    await sql`
      UPDATE condominiums 
      SET zone = ${update.newZone}, 
          updated_at = NOW()
      WHERE id = ${update.id}
    `;
    
    updated++;
    console.log(`✅ ${update.name} → ${update.newZone}`);
  } catch (error) {
    console.error(`❌ Error actualizando ${update.name}:`, error.message);
  }
}

console.log('\n' + '='.repeat(80));
console.log(`📊 RESUMEN FINAL:`);
console.log(`   ✅ Actualizados: ${updated}`);
console.log(`   ⏭️  Sin cambios: ${skipped}`);
console.log(`   ⚠️  No encontrados en mapeo: ${notInMapping.length}`);
console.log('='.repeat(80));

process.exit(0);
