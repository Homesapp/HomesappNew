import { db } from "../db";
import { externalUnits } from "@shared/schema";
import { 
  getGoogleSheetsClient,
  extractGoogleMapsUrlFromFicha,
  extractTRHIdFromFicha
} from "../googleSheets";
import { parseGoogleMapsUrlWithResolve } from "../googleMapsParser";
import { eq, isNull, or } from "drizzle-orm";

const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
const SHEET_NAME = 'Renta/Long Term';

interface FichaData {
  rowIndex: number;
  sheetRowId: string;
  condominiumName: string;
  unitNumber: string;
  note: string | null;
}

async function readAllFichasFromSheet(): Promise<FichaData[]> {
  const sheets = await getGoogleSheetsClient();
  
  // Get cell notes from column T along with ID, Condominio, Unidad
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [`'${SHEET_NAME}'!A2:T`],
    fields: 'sheets.data.rowData.values(formattedValue,note)',
  });
  
  const rowData = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  return rowData.map((row: any, index: number) => {
    const values = row.values || [];
    return {
      rowIndex: index + 2,
      sheetRowId: values[0]?.formattedValue || '',        // Column A: ID
      condominiumName: values[6]?.formattedValue || '',   // Column G: Condominio
      unitNumber: values[7]?.formattedValue || '',        // Column H: Unidad
      note: values[19]?.note || null,                     // Column T: Ficha (cell note)
    };
  }).filter((row: FichaData) => row.sheetRowId);
}

async function importFichaLocations() {
  console.log("Starting ficha locations import...");
  
  // Read all fichas from the sheet
  console.log("Reading fichas from Google Sheet...");
  
  let fichas: FichaData[];
  try {
    fichas = await readAllFichasFromSheet();
  } catch (error) {
    console.error("Error reading fichas:", error);
    return;
  }
  
  console.log(`Found ${fichas.length} rows with data`);
  
  // Filter to only rows with notes containing URLs
  const fichasWithNotes = fichas.filter(row => row.note);
  console.log(`${fichasWithNotes.length} rows have cell notes (fichas)`);
  
  // Extract Google Maps URLs from fichas
  const fichasWithUrls = fichasWithNotes.map(row => ({
    ...row,
    googleMapsUrl: extractGoogleMapsUrlFromFicha(row.note!),
    trhId: extractTRHIdFromFicha(row.note!),
  })).filter(row => row.googleMapsUrl);
  
  console.log(`${fichasWithUrls.length} fichas contain Google Maps URLs`);
  
  // Get units missing coordinates
  const unitsMissingCoords = await db
    .select({
      id: externalUnits.id,
      unitNumber: externalUnits.unitNumber,
      sheetRowId: externalUnits.sheetRowId,
      condominiumId: externalUnits.condominiumId,
    })
    .from(externalUnits)
    .where(
      or(
        isNull(externalUnits.latitude),
        isNull(externalUnits.longitude)
      )
    );
  
  console.log(`${unitsMissingCoords.length} units are missing coordinates`);
  
  // Create lookup by sheetRowId
  const unitsBySheetRowId = new Map<string, typeof unitsMissingCoords[0]>();
  for (const unit of unitsMissingCoords) {
    if (unit.sheetRowId) {
      unitsBySheetRowId.set(unit.sheetRowId, unit);
    }
  }
  
  let updated = 0;
  let errors = 0;
  let notFound = 0;
  let alreadyHasCoords = 0;
  
  for (const ficha of fichasWithUrls) {
    // Try to find matching unit by sheetRowId first
    let unit = unitsBySheetRowId.get(ficha.sheetRowId);
    
    if (!unit) {
      // Unit already has coordinates or doesn't exist
      alreadyHasCoords++;
      continue;
    }
    
    // Parse the Google Maps URL
    try {
      const result = await parseGoogleMapsUrlWithResolve(ficha.googleMapsUrl!);
      
      if (result.success && result.data) {
        await db
          .update(externalUnits)
          .set({
            latitude: String(result.data.latitude),
            longitude: String(result.data.longitude),
            locationConfidence: 'ficha',
            googleMapsUrl: ficha.googleMapsUrl,
          })
          .where(eq(externalUnits.id, unit.id));
        
        console.log(`Updated ${ficha.condominiumName} ${ficha.unitNumber}: (${result.data.latitude}, ${result.data.longitude})`);
        updated++;
      } else {
        console.log(`Failed to parse URL for ${ficha.condominiumName} ${ficha.unitNumber}: ${result.error}`);
        errors++;
      }
    } catch (error) {
      console.error(`Error processing ${ficha.condominiumName} ${ficha.unitNumber}:`, error);
      errors++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("\n=== Summary ===");
  console.log(`Total fichas with URLs: ${fichasWithUrls.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Already have coordinates: ${alreadyHasCoords}`);
  console.log(`Errors: ${errors}`);
}

// First, let's preview what we'd find
async function previewFichas() {
  console.log("Previewing fichas from Google Sheet...");
  
  let fichas: FichaData[];
  try {
    fichas = await readAllFichasFromSheet();
  } catch (error) {
    console.error("Error reading fichas:", error);
    return;
  }
  
  console.log(`\nFound ${fichas.length} total rows`);
  
  const withNotes = fichas.filter(f => f.note);
  console.log(`${withNotes.length} rows have fichas (cell notes)`);
  
  let withUrls = 0;
  for (const row of withNotes.slice(0, 20)) {
    const url = extractGoogleMapsUrlFromFicha(row.note!);
    const trhId = extractTRHIdFromFicha(row.note!);
    if (url) withUrls++;
    console.log(`\nRow ${row.sheetRowId}: ${row.condominiumName} ${row.unitNumber}`);
    console.log(`  TRH ID: ${trhId || 'not found'}`);
    console.log(`  URL: ${url || 'NOT FOUND'}`);
  }
  
  // Count all URLs
  const allWithUrls = withNotes.filter(f => extractGoogleMapsUrlFromFicha(f.note!));
  console.log(`\n=== TOTAL: ${allWithUrls.length} fichas have Google Maps URLs ===`);
}

// Run preview first
const args = process.argv.slice(2);
if (args.includes('--import')) {
  importFichaLocations()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
} else {
  previewFichas()
    .then(() => {
      console.log("\nRun with --import to actually import the locations");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}
