import { google } from 'googleapis';
import { db } from '../server/db';
import { externalUnits, externalCondominiums } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const SPREADSHEET_ID = "1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4";
const SHEET_NAME = "Renta/Long Term";
const AGENCY_ID = "6c2c26c5-a268-4451-ae67-8ee56e89b87f";

interface TRHSheetRow {
  sheetRowId: string;
  zone: string;
  condominiumName: string;
  unitNumber: string;
  floor: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  price: string;
  commissionType: string;
  petFriendly: string;
  allowsSublease: string;
  virtualTourUrl: string;
  googleMapsUrl: string;
  photosDriveLink: string;
  includesElectricity: string;
  includesWater: string;
  includesInternet: string;
  includesHOA: string;
  includesGas: string;
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr.trim() === '') return null;
  const cleaned = priceStr.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseFloor(floorStr: string): 'planta_baja' | 'primer_piso' | 'segundo_piso' | 'tercer_piso' | 'penthouse' | null {
  if (!floorStr) return null;
  const lower = floorStr.toLowerCase().trim();
  if (lower.includes('planta baja') || lower.includes('pb') || lower.includes('ground')) return 'planta_baja';
  if (lower.includes('primer') || lower.includes('1er') || lower.includes('first')) return 'primer_piso';
  if (lower.includes('segundo') || lower.includes('2do') || lower.includes('second')) return 'segundo_piso';
  if (lower.includes('tercer') || lower.includes('3er') || lower.includes('third')) return 'tercer_piso';
  if (lower.includes('penthouse') || lower.includes('ph') || lower.includes('ático')) return 'penthouse';
  return null;
}

function parseCommissionType(commStr: string): 'completa' | 'referido' {
  if (!commStr) return 'completa';
  const lower = commStr.toLowerCase().trim();
  if (lower.includes('referido') || lower.includes('referal') || lower.includes('10%') || lower.includes('20%')) return 'referido';
  return 'completa';
}

function parseBooleanField(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === 'si' || lower === 'sí' || lower === 'yes' || lower === '1';
}

function parsePetFriendly(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'si' || lower === 'sí' || lower === 'yes' || lower === 'true';
}

function parseAllowsSublease(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  if (lower.includes('no acepta') || lower.includes('no')) return false;
  if (lower.includes('acepta') || lower.includes('si') || lower.includes('sí')) return true;
  return false;
}

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function readTRHUnitsFromSheet(startRow: number = 2, limit?: number): Promise<TRHSheetRow[]> {
  const accessToken = await getAccessToken();
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  const endRow = limit ? startRow + limit - 1 : '';
  const range = `'${SHEET_NAME}'!A${startRow}:AF${endRow}`;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    sheetRowId: row[0] || '',
    zone: row[5] || '',
    condominiumName: row[6] || '',
    unitNumber: row[7] || '',
    floor: row[8] || '',
    propertyType: row[9] || '',
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
  }));
}

async function main() {
  console.log("Starting Google Sheets import...");
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`Sheet: ${SHEET_NAME}`);
  console.log(`Agency ID: ${AGENCY_ID}`);
  
  const batchSize = 200;
  let startRow = 2;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  const condominiumMap: Record<string, string> = {};
  
  while (true) {
    console.log(`\nProcessing rows ${startRow} to ${startRow + batchSize - 1}...`);
    
    const rawRows = await readTRHUnitsFromSheet(startRow, batchSize);
    
    if (rawRows.length === 0) {
      console.log("No more rows to process.");
      break;
    }
    
    const validUnits = rawRows.filter(u => u.unitNumber && u.condominiumName);
    console.log(`Found ${validUnits.length} valid units in this batch.`);
    
    for (const unit of validUnits) {
      try {
        const condoName = unit.condominiumName.replace(/[()]/g, '').trim();
        
        if (!condominiumMap[condoName]) {
          const existingCondos = await db.select()
            .from(externalCondominiums)
            .where(and(
              eq(externalCondominiums.agencyId, AGENCY_ID),
              sql`LOWER(${externalCondominiums.name}) = LOWER(${condoName})`
            ))
            .limit(1);
          
          if (existingCondos.length > 0) {
            condominiumMap[condoName] = existingCondos[0].id;
          } else {
            const [newCondo] = await db.insert(externalCondominiums)
              .values({
                agencyId: AGENCY_ID,
                name: condoName,
                zone: unit.zone.replace(/[()]/g, '').trim(),
              })
              .returning();
            condominiumMap[condoName] = newCondo.id;
            console.log(`  Created condominium: ${condoName}`);
          }
        }
        
        const condominiumId = condominiumMap[condoName];
        const price = parsePrice(unit.price);
        
        // First try to find by sheetRowId, then by condominium + unit number
        let existingUnit = unit.sheetRowId 
          ? await db.select()
              .from(externalUnits)
              .where(and(
                eq(externalUnits.agencyId, AGENCY_ID),
                eq(externalUnits.sheetRowId, unit.sheetRowId)
              ))
              .limit(1)
          : [];
        
        // If not found by sheetRowId, try by condominium + unit number
        if (existingUnit.length === 0) {
          existingUnit = await db.select()
            .from(externalUnits)
            .where(and(
              eq(externalUnits.condominiumId, condominiumId),
              eq(externalUnits.unitNumber, unit.unitNumber.trim())
            ))
            .limit(1);
        }
        
        const includedServices = {
          water: parseBooleanField(unit.includesWater),
          electricity: parseBooleanField(unit.includesElectricity),
          internet: parseBooleanField(unit.includesInternet),
          gas: parseBooleanField(unit.includesGas),
        };
        
        if (existingUnit.length > 0) {
          await db.update(externalUnits)
            .set({
              condominiumId,
              unitNumber: unit.unitNumber.trim(),
              zone: unit.zone.replace(/[()]/g, '').trim(),
              propertyType: unit.propertyType || 'Departamento',
              floor: parseFloor(unit.floor),
              bedrooms: unit.bedrooms ? parseInt(unit.bedrooms, 10) || null : null,
              bathrooms: unit.bathrooms ? String(parseFloat(unit.bathrooms) || null) : null,
              price: price ? String(price) : null,
              commissionType: parseCommissionType(unit.commissionType),
              petFriendly: parsePetFriendly(unit.petFriendly),
              allowsSublease: parseAllowsSublease(unit.allowsSublease),
              virtualTourUrl: unit.virtualTourUrl && !unit.virtualTourUrl.toLowerCase().includes('falta') ? unit.virtualTourUrl : null,
              googleMapsUrl: unit.googleMapsUrl || null,
              photosDriveLink: unit.photosDriveLink || null,
              includedServices,
              sheetRowId: unit.sheetRowId || existingUnit[0].sheetRowId,
              syncedFromSheet: true,
              lastSheetSync: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(externalUnits.id, existingUnit[0].id));
          totalUpdated++;
        } else {
          await db.insert(externalUnits)
            .values({
              agencyId: AGENCY_ID,
              condominiumId,
              unitNumber: unit.unitNumber.trim(),
              zone: unit.zone.replace(/[()]/g, '').trim(),
              propertyType: unit.propertyType || 'Departamento',
              floor: parseFloor(unit.floor),
              bedrooms: unit.bedrooms ? parseInt(unit.bedrooms, 10) || null : null,
              bathrooms: unit.bathrooms ? String(parseFloat(unit.bathrooms) || null) : null,
              price: price ? String(price) : null,
              commissionType: parseCommissionType(unit.commissionType),
              petFriendly: parsePetFriendly(unit.petFriendly),
              allowsSublease: parseAllowsSublease(unit.allowsSublease),
              virtualTourUrl: unit.virtualTourUrl && !unit.virtualTourUrl.toLowerCase().includes('falta') ? unit.virtualTourUrl : null,
              googleMapsUrl: unit.googleMapsUrl || null,
              photosDriveLink: unit.photosDriveLink || null,
              includedServices,
              sheetRowId: unit.sheetRowId,
              syncedFromSheet: true,
              lastSheetSync: new Date(),
              minimumTerm: '6 meses',
              maximumTerm: '5 años',
            });
          totalImported++;
        }
      } catch (err: any) {
        console.error(`  Error processing row ${unit.sheetRowId}: ${err.message}`);
        totalErrors++;
      }
    }
    
    console.log(`  Batch complete. Total: ${totalImported} imported, ${totalUpdated} updated, ${totalErrors} errors`);
    
    startRow += batchSize;
    
    if (rawRows.length < batchSize) {
      break;
    }
  }
  
  console.log("\n========================================");
  console.log("IMPORT COMPLETE");
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log("========================================");
}

main().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
