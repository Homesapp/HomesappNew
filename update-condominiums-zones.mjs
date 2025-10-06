import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Leer el mapeo
const mapping = JSON.parse(readFileSync('condominium-colony-mapping.json', 'utf8'));

console.log('🔄 Actualizando zonas de condominios...\n');

let updated = 0;
let notFound = 0;
let errors = 0;

for (const [condominio, colonia] of Object.entries(mapping)) {
  try {
    const result = await sql`
      UPDATE condominiums 
      SET zone = ${colonia}, 
          updated_at = NOW()
      WHERE name = ${condominio}
    `;
    
    if (result.count > 0) {
      updated++;
      console.log(`✅ ${condominio} → ${colonia}`);
    } else {
      notFound++;
      console.log(`⚠️  NO ENCONTRADO: ${condominio}`);
    }
  } catch (error) {
    errors++;
    console.error(`❌ ERROR actualizando ${condominio}:`, error.message);
  }
}

console.log('\n' + '='.repeat(80));
console.log(`📊 RESUMEN:`);
console.log(`   ✅ Actualizados: ${updated}`);
console.log(`   ⚠️  No encontrados: ${notFound}`);
console.log(`   ❌ Errores: ${errors}`);
console.log('='.repeat(80));

process.exit(0);
