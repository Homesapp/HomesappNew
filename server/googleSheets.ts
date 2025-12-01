import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface SheetUnitRow {
  unitNumber: string;
  condominiumName?: string;
  rentPurpose?: string;
  floorNumber?: string;
  bedrooms?: string;
  bathrooms?: string;
  size?: string;
  rentAmount?: string;
  depositAmount?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  notes?: string;
}

export async function readUnitsFromSheet(spreadsheetId: string, range: string = 'Sheet1!A2:M'): Promise<SheetUnitRow[]> {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    unitNumber: row[0] || '',
    condominiumName: row[1] || '',
    rentPurpose: row[2] || 'long_term',
    floorNumber: row[3] || '',
    bedrooms: row[4] || '',
    bathrooms: row[5] || '',
    size: row[6] || '',
    rentAmount: row[7] || '',
    depositAmount: row[8] || '',
    ownerName: row[9] || '',
    ownerEmail: row[10] || '',
    ownerPhone: row[11] || '',
    notes: row[12] || '',
  }));
}

export async function getSpreadsheetInfo(spreadsheetId: string) {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return {
    title: response.data.properties?.title,
    sheets: response.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
    })),
  };
}

// TRH Sheet structure for long-term rentals
export interface TRHSheetRow {
  sheetRowId: string;       // Column A: ID
  zone: string;             // Column F: Zona
  condominiumName: string;  // Column G: Condominio
  unitNumber: string;       // Column H: Unidad
  floor: string;            // Column I: Piso
  propertyType: string;     // Column J: Tipo
  bedrooms: string;         // Column K: Recámaras
  bathrooms: string;        // Column L: Baños
  price: string;            // Column N: 12 meses (precio base)
  commissionType: string;   // Column O: Comision (Completa, Referido 10%)
  petFriendly: string;      // Column R: PetF
  allowsSublease: string;   // Column S: Subarriendo
  virtualTourUrl: string;   // Column Y: Tour Virtual
  googleMapsUrl: string;    // Column Z: Ubicacion
  photosDriveLink: string;  // Column AA: Drive
  includesElectricity: string; // Column AB: Luz
  includesWater: string;    // Column AC: Agua
  includesInternet: string; // Column AD: Internet
  includesHOA: string;      // Column AE: HOA
  includesGas: string;      // Column AF: Gas
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

export async function readTRHUnitsFromSheet(
  spreadsheetId: string, 
  sheetName: string = 'Renta/Long Term',
  startRow: number = 2,
  limit?: number
): Promise<TRHSheetRow[]> {
  const sheets = await getGoogleSheetsClient();
  
  const endRow = limit ? startRow + limit - 1 : '';
  const range = `'${sheetName}'!A${startRow}:AF${endRow}`;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];
  
  return rows.map(row => ({
    sheetRowId: row[0] || '',         // A: ID
    zone: row[5] || '',               // F: Zona
    condominiumName: row[6] || '',    // G: Condominio
    unitNumber: row[7] || '',         // H: Unidad
    floor: row[8] || '',              // I: Piso
    propertyType: row[9] || '',       // J: Tipo
    bedrooms: row[10] || '',          // K: Recámaras
    bathrooms: row[11] || '',         // L: Baños
    price: row[13] || '',             // N: 12 meses (skip column M which is 6 months)
    commissionType: row[14] || '',    // O: Comision
    petFriendly: row[17] || '',       // R: PetF
    allowsSublease: row[18] || '',    // S: Subarriendo
    virtualTourUrl: row[24] || '',    // Y: Tour Virtual
    googleMapsUrl: row[25] || '',     // Z: Ubicacion
    photosDriveLink: row[26] || '',   // AA: Drive
    includesElectricity: row[27] || '', // AB: Luz
    includesWater: row[28] || '',     // AC: Agua
    includesInternet: row[29] || '',  // AD: Internet
    includesHOA: row[30] || '',       // AE: HOA
    includesGas: row[31] || '',       // AF: Gas
  }));
}

export interface ParsedTRHUnit {
  sheetRowId: string;
  zone: string;
  condominiumName: string;
  unitNumber: string;
  floor: 'planta_baja' | 'primer_piso' | 'segundo_piso' | 'tercer_piso' | 'penthouse' | null;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  commissionType: 'completa' | 'referido';
  petFriendly: boolean;
  allowsSublease: boolean;
  virtualTourUrl: string | null;
  googleMapsUrl: string | null;
  photosDriveLink: string | null;
  includedServices: {
    water: boolean;
    electricity: boolean;
    internet: boolean;
    gas: boolean;
  };
}

export function parseTRHRow(row: TRHSheetRow): ParsedTRHUnit {
  return {
    sheetRowId: row.sheetRowId,
    zone: row.zone.replace(/[()]/g, '').trim(),
    condominiumName: row.condominiumName.replace(/[()]/g, '').trim(),
    unitNumber: row.unitNumber.trim(),
    floor: parseFloor(row.floor),
    propertyType: row.propertyType || 'Departamento',
    bedrooms: row.bedrooms ? parseInt(row.bedrooms, 10) || null : null,
    bathrooms: row.bathrooms ? parseFloat(row.bathrooms) || null : null,
    price: parsePrice(row.price),
    commissionType: parseCommissionType(row.commissionType),
    petFriendly: parsePetFriendly(row.petFriendly),
    allowsSublease: parseAllowsSublease(row.allowsSublease),
    virtualTourUrl: row.virtualTourUrl && !row.virtualTourUrl.toLowerCase().includes('falta') ? row.virtualTourUrl : null,
    googleMapsUrl: row.googleMapsUrl || null,
    photosDriveLink: row.photosDriveLink || null,
    includedServices: {
      water: parseBooleanField(row.includesWater),
      electricity: parseBooleanField(row.includesElectricity),
      internet: parseBooleanField(row.includesInternet),
      gas: parseBooleanField(row.includesGas),
    },
  };
}

export async function getTRHSheetStats(spreadsheetId: string, sheetName: string = 'Renta/Long Term') {
  const sheets = await getGoogleSheetsClient();
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A:A`,
  });
  
  const totalRows = (response.data.values?.length || 1) - 1; // Minus header row
  
  return {
    totalRows,
    sheetName,
  };
}

// Read cell notes from Google Sheets
export interface CellNoteData {
  rowIndex: number;
  sheetRowId: string;
  condominiumName: string;
  unitNumber: string;
  note: string | null;
}

export async function readCellNotesFromSheet(
  spreadsheetId: string, 
  sheetName: string = 'Renta/Long Term',
  notesColumn: string = 'T', // Column where notes are stored
  startRow: number = 2,
  endRow?: number
): Promise<CellNoteData[]> {
  const sheets = await getGoogleSheetsClient();
  
  // First get the sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });
  
  const sheet = spreadsheet.data.sheets?.find(
    s => s.properties?.title === sheetName
  );
  
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  const sheetId = sheet.properties.sheetId;
  
  // Get cell values and notes for the required columns
  // A = ID, G = Condominium, H = Unit, T = Notes column (or specified)
  const noteColIndex = notesColumn.charCodeAt(0) - 'A'.charCodeAt(0);
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`'${sheetName}'!A${startRow}:${notesColumn}${endRow || ''}`],
    fields: 'sheets.data.rowData.values(formattedValue,note)',
  });
  
  const rowData = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  return rowData.map((row, index) => {
    const values = row.values || [];
    return {
      rowIndex: startRow + index,
      sheetRowId: values[0]?.formattedValue || '',        // Column A: ID
      condominiumName: values[6]?.formattedValue || '',   // Column G: Condominio
      unitNumber: values[7]?.formattedValue || '',        // Column H: Unidad
      note: values[noteColIndex]?.note || null,           // Notes column: cell note
    };
  }).filter(row => row.sheetRowId); // Filter out empty rows
}

// Parse ficha text to extract Google Maps URL
export function extractGoogleMapsUrlFromFicha(fichaText: string): string | null {
  if (!fichaText) return null;
  
  // Look for "Ubicación:" or "Ubicacion:" followed by a URL
  const ubicacionMatch = fichaText.match(/Ubicaci[oó]n:\s*(https?:\/\/[^\s\n]+)/i);
  if (ubicacionMatch) {
    return ubicacionMatch[1].trim();
  }
  
  // Also try to find any Google Maps URL in the text
  const mapsMatch = fichaText.match(/(https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps|maps\.google\.com)[^\s\n]+)/i);
  if (mapsMatch) {
    return mapsMatch[1].trim();
  }
  
  return null;
}

// Extract TRH ID from ficha
export function extractTRHIdFromFicha(fichaText: string): string | null {
  if (!fichaText) return null;
  
  const trhMatch = fichaText.match(/TRH\s*ID\s*[:\s]*(\d+)/i);
  if (trhMatch) {
    return trhMatch[1];
  }
  
  return null;
}
