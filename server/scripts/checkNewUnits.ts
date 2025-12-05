import { getGoogleSheetsClient } from '../googleSheets';

async function checkNewUnits() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
  
  // Read all data including the Homesapp column (B)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Renta/Long Term'!A2:AF",
  });
  
  const rows = response.data.values || [];
  
  // Filter for units where Homesapp = FALSE and Disponible = "Disponible"
  const newUnits = rows.filter(row => {
    const homesapp = row[1];  // Column B: Homesapp
    const disponible = row[4]; // Column E: Disponible
    return homesapp === 'FALSE' && disponible === 'Disponible';
  }).map(row => ({
    id: row[0],
    condominio: row[6],
    unidad: row[7],
    piso: row[8],
    tipo: row[9],
    recamaras: row[10],
    banos: row[11],
    precio12: row[13],
    drive: row[26],
    zona: row[5],
  }));
  
  console.log(`=== UNIDADES NUEVAS PENDIENTES (${newUnits.length}) ===\n`);
  
  // Group by condominium
  const grouped: Record<string, typeof newUnits> = {};
  newUnits.forEach(u => {
    const condo = u.condominio || 'Sin Condominio';
    if (!grouped[condo]) grouped[condo] = [];
    grouped[condo].push(u);
  });
  
  Object.entries(grouped).forEach(([condo, units]) => {
    console.log(`\n📍 ${condo} (${units.length} unidades):`);
    units.forEach(u => {
      console.log(`   - ID: ${u.id} | ${u.unidad} | ${u.tipo} | ${u.recamaras}rec ${u.banos}baños | $${u.precio12}`);
      if (u.drive) console.log(`     📸 Drive: ${u.drive.substring(0, 60)}...`);
    });
  });
  
  // Count unique condominiums
  const uniqueCondos = [...new Set(newUnits.map(u => u.condominio))];
  console.log(`\n=== RESUMEN ===`);
  console.log(`Total unidades nuevas: ${newUnits.length}`);
  console.log(`Condominios involucrados: ${uniqueCondos.length}`);
  console.log(`Unidades con fotos en Drive: ${newUnits.filter(u => u.drive).length}`);
}

checkNewUnits().catch(console.error);
