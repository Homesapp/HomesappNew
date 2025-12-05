import { getGoogleSheetsClient } from '../googleSheets';
import { db } from '../db';
import { externalUnits, externalCondominiums, externalAgencies } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

async function compareSheetWithDB() {
  console.log('🔍 Comparando Google Sheet con la base de datos...\n');
  
  // Get TRH agency ID
  const [agency] = await db.select().from(externalAgencies).where(eq(externalAgencies.slug, 'tulum-rental-homes'));
  if (!agency) {
    console.error('Agency Tulum Rental Homes not found');
    return;
  }
  
  // Get all existing units from database with their sheet_row_ids
  const existingUnits = await db
    .select({
      sheetRowId: externalUnits.sheetRowId,
      unitNumber: externalUnits.unitNumber,
      condoName: externalCondominiums.name,
    })
    .from(externalUnits)
    .innerJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
    .where(eq(externalCondominiums.agencyId, agency.id));
  
  console.log(`📊 Unidades existentes en DB: ${existingUnits.length}`);
  
  // Create a Set of existing sheet_row_ids for quick lookup
  const existingSheetIds = new Set(existingUnits.map(u => u.sheetRowId).filter(Boolean));
  console.log(`📋 Unidades con sheet_row_id: ${existingSheetIds.size}\n`);
  
  // Read Google Sheet
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Renta/Long Term'!A2:AF",
  });
  
  const rows = response.data.values || [];
  console.log(`📄 Filas en Google Sheet: ${rows.length}\n`);
  
  // Filter for new units (not in database) that are "Disponible"
  const newUnits = rows.filter(row => {
    const id = row[0];
    const disponible = row[4];
    // Only include if: has an ID, is Disponible, and NOT in our database
    return id && disponible === 'Disponible' && !existingSheetIds.has(id);
  }).map(row => ({
    id: row[0],
    zona: row[5],
    condominio: (row[6] || '').replace(/[()]/g, '').trim(),
    unidad: row[7],
    piso: row[8],
    tipo: row[9],
    recamaras: row[10],
    banos: row[11],
    precio6: row[12],
    precio12: row[13],
    comision: row[14],
    petFriendly: row[17],
    subarriendo: row[18],
    tour: row[24],
    ubicacion: row[25],
    drive: row[26],
  }));
  
  console.log(`\n✨ UNIDADES NUEVAS DISPONIBLES (${newUnits.length}):`);
  console.log('='.repeat(60));
  
  // Group by condominium
  const grouped: Record<string, typeof newUnits> = {};
  newUnits.forEach(u => {
    const condo = u.condominio || 'Sin Condominio';
    if (!grouped[condo]) grouped[condo] = [];
    grouped[condo].push(u);
  });
  
  // Sort condominiums alphabetically
  const sortedCondos = Object.keys(grouped).sort();
  
  sortedCondos.forEach(condo => {
    const units = grouped[condo];
    console.log(`\n📍 ${condo} (${units.length} unidades nuevas):`);
    units.forEach(u => {
      const hasDrive = u.drive && u.drive.startsWith('http') ? '📸' : '  ';
      console.log(`   ${hasDrive} ID:${u.id} | ${u.unidad} | ${u.tipo} | ${u.recamaras}rec ${u.banos}baños | ${u.precio12}`);
    });
  });
  
  // Summary
  const withPhotos = newUnits.filter(u => u.drive && u.drive.startsWith('http'));
  const uniqueCondos = [...new Set(newUnits.map(u => u.condominio))];
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN:');
  console.log(`   • Total unidades nuevas: ${newUnits.length}`);
  console.log(`   • Condominios involucrados: ${uniqueCondos.length}`);
  console.log(`   • Unidades con fotos en Drive: ${withPhotos.length}`);
  
  // Check for new condominiums (not yet in DB)
  const existingCondos = await db
    .select({ name: externalCondominiums.name })
    .from(externalCondominiums)
    .where(eq(externalCondominiums.agencyId, agency.id));
  
  const existingCondoNames = new Set(existingCondos.map(c => c.name.toLowerCase().trim()));
  const newCondoNames = uniqueCondos.filter(name => !existingCondoNames.has(name.toLowerCase().trim()));
  
  if (newCondoNames.length > 0) {
    console.log(`\n🏢 CONDOMINIOS NUEVOS (${newCondoNames.length}):`);
    newCondoNames.sort().forEach(name => {
      const unitsCount = grouped[name]?.length || 0;
      console.log(`   • ${name} (${unitsCount} unidades)`);
    });
  }
}

compareSheetWithDB().catch(console.error);
