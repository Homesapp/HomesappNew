const fs = require('fs');

// Leer el archivo
const data = fs.readFileSync('attached_assets/Pasted-Zona-Condominio-Aldea-Tulum-Aldea-Tulum-Kukulkan-Mistiq-Tulum-La-Veleta-Cacao-Aldea-Zama-Paramar-1759780412601_1759780412602.txt', 'utf8');

const lines = data.split('\n');
const coloniaCondominios = {};

// Procesar cada línea (saltando la primera que es encabezado)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Separar por tabs
  const parts = line.split('\t').filter(p => p.trim());
  if (parts.length !== 2) continue;
  
  const colonia = parts[0].trim();
  const condominio = parts[1].trim();
  
  if (!colonia || !condominio) continue;
  
  if (!coloniaCondominios[colonia]) {
    coloniaCondominios[colonia] = new Set();
  }
  coloniaCondominios[colonia].add(condominio);
}

// Convertir Sets a Arrays y ordenar
const resultado = {};
for (const [colonia, condominios] of Object.entries(coloniaCondominios)) {
  resultado[colonia] = Array.from(condominios).sort();
}

// Imprimir reporte organizado
console.log('='.repeat(80));
console.log('CONDOMINIOS ORGANIZADOS POR COLONIA');
console.log('='.repeat(80));
console.log();

const coloniasOrdenadas = Object.keys(resultado).sort();

for (const colonia of coloniasOrdenadas) {
  const condominios = resultado[colonia];
  console.log(`\n📍 ${colonia} (${condominios.length} condominios)`);
  console.log('-'.repeat(80));
  condominios.forEach((condo, idx) => {
    console.log(`   ${idx + 1}. ${condo}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log(`RESUMEN: ${coloniasOrdenadas.length} colonias, ${Object.values(resultado).reduce((sum, arr) => sum + arr.length, 0)} condominios únicos`);
console.log('='.repeat(80));

// Generar mapeo para SQL
console.log('\n\n=== MAPEO CONDOMINIO -> COLONIA ===\n');
const mapping = {};
for (const [colonia, condominios] of Object.entries(resultado)) {
  condominios.forEach(condo => {
    mapping[condo] = colonia;
  });
}

// Guardar el mapeo como JSON
fs.writeFileSync('condominium-colony-mapping.json', JSON.stringify(mapping, null, 2));
console.log('✅ Mapeo guardado en: condominium-colony-mapping.json');

