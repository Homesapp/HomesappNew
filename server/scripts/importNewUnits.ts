import { getGoogleSheetsClient, parseTRHRow, TRHSheetRow } from '../googleSheets';
import { db } from '../db';
import { externalUnits, externalCondominiums, externalAgencies } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function importNewUnits() {
  console.log('🚀 Iniciando importación de unidades nuevas...\n');
  
  // Get TRH agency
  const [agency] = await db.select().from(externalAgencies).where(eq(externalAgencies.slug, 'tulum-rental-homes'));
  if (!agency) {
    console.error('❌ Agency Tulum Rental Homes not found');
    return;
  }
  console.log(`✅ Agency encontrada: ${agency.name} (ID: ${agency.id})\n`);
  
  // Get existing units with their sheet_row_ids
  const existingUnits = await db
    .select({ sheetRowId: externalUnits.sheetRowId })
    .from(externalUnits)
    .innerJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
    .where(eq(externalCondominiums.agencyId, agency.id));
  
  const existingSheetIds = new Set(existingUnits.map(u => u.sheetRowId).filter(Boolean));
  console.log(`📊 Unidades existentes con sheet_row_id: ${existingSheetIds.size}\n`);
  
  // Read Google Sheet
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Renta/Long Term'!A2:AF",
  });
  
  const rows = response.data.values || [];
  
  // Filter for new units
  const newRows = rows.filter(row => {
    const id = row[0];
    const disponible = row[4];
    return id && disponible === 'Disponible' && !existingSheetIds.has(id);
  });
  
  console.log(`📋 Unidades nuevas a importar: ${newRows.length}\n`);
  
  // Get all existing condominiums
  const existingCondos = await db
    .select({ id: externalCondominiums.id, name: externalCondominiums.name })
    .from(externalCondominiums)
    .where(eq(externalCondominiums.agencyId, agency.id));
  
  const condoMap = new Map(existingCondos.map(c => [c.name.toLowerCase().trim(), c.id]));
  
  let imported = 0;
  let errors = 0;
  let condosCreated = 0;
  
  for (const row of newRows) {
    try {
      const sheetRow: TRHSheetRow = {
        sheetRowId: row[0] || '',
        zone: row[5] || '',
        condominiumName: (row[6] || '').replace(/[()]/g, '').trim(),
        unitNumber: (row[7] || '').substring(0, 50), // Limit to 50 chars
        floor: row[8] || '',
        propertyType: row[9] || 'Departamento',
        bedrooms: row[10] || '',
        bathrooms: row[11] || '',
        price: row[13] || '',
        commissionType: row[14] || '',
        petFriendly: row[17] || '',
        allowsSublease: row[18] || '',
        virtualTourUrl: row[24] || '',
        googleMapsUrl: row[25] || '',
        photosDriveLink: row[26] || '',
        includesElectricity: row[27] || '',
        includesWater: row[28] || '',
        includesInternet: row[29] || '',
        includesHOA: row[30] || '',
        includesGas: row[31] || '',
      };
      
      const parsed = parseTRHRow(sheetRow);
      
      if (!parsed.condominiumName) {
        console.log(`⚠️ Saltando ID ${parsed.sheetRowId}: sin nombre de condominio`);
        continue;
      }
      
      // Find or create condominium
      let condoId = condoMap.get(parsed.condominiumName.toLowerCase().trim());
      
      if (!condoId) {
        // Create new condominium
        const [newCondo] = await db.insert(externalCondominiums).values({
          agencyId: agency.id,
          name: parsed.condominiumName,
          zone: parsed.zone || null,
          googleMapsUrl: parsed.googleMapsUrl || null,
          status: 'active',
        }).returning({ id: externalCondominiums.id });
        
        condoId = newCondo.id;
        condoMap.set(parsed.condominiumName.toLowerCase().trim(), condoId);
        condosCreated++;
        console.log(`🏢 Nuevo condominio creado: ${parsed.condominiumName}`);
      }
      
      // Create unit with agency_id
      await db.insert(externalUnits).values({
        agencyId: agency.id,  // Include agency_id
        condominiumId: condoId,
        unitNumber: parsed.unitNumber || `Unit-${parsed.sheetRowId}`,
        sheetRowId: parsed.sheetRowId,
        floor: parsed.floor || null,
        propertyType: parsed.propertyType,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        baseRentAmount: parsed.price ? parsed.price.toString() : null,
        petFriendly: parsed.petFriendly,
        allowsSublease: parsed.allowsSublease,
        virtualTourUrl: parsed.virtualTourUrl,
        googleMapsUrl: parsed.googleMapsUrl,
        commissionType: parsed.commissionType,
        includedServices: parsed.includedServices,
        status: 'available',
        listingType: 'rent_long',
      });
      
      imported++;
      console.log(`✅ Importada: ${parsed.condominiumName} - ${parsed.unitNumber} (ID: ${parsed.sheetRowId})`);
      
    } catch (error: any) {
      errors++;
      console.error(`❌ Error importando fila ${row[0]}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE IMPORTACIÓN:');
  console.log(`   ✅ Unidades importadas: ${imported}`);
  console.log(`   🏢 Condominios nuevos creados: ${condosCreated}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log('='.repeat(60));
}

importNewUnits().catch(console.error);
