import { getGoogleSheetsClient } from '../googleSheets';

async function readSheet() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
    
    // First get spreadsheet info to see all sheets
    const info = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    console.log('=== SPREADSHEET INFO ===');
    console.log('Title:', info.data.properties?.title);
    console.log('Sheets:');
    info.data.sheets?.forEach(sheet => {
      console.log('  -', sheet.properties?.title, '(sheetId:', sheet.properties?.sheetId, ')');
    });
    
    // Read first sheet header row to see columns
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:AZ1', // Get first row with more columns
    });
    
    console.log('\n=== HEADERS (Row 1) ===');
    const headers = headerResponse.data.values?.[0] || [];
    headers.forEach((h: string, i: number) => {
      const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + (i - 26));
      console.log(`  Column ${colLetter}: ${h}`);
    });
    
    // Read a sample of data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:AZ6', // Get first 5 data rows
    });
    
    console.log('\n=== SAMPLE DATA (Rows 2-6) ===');
    const rows = dataResponse.data.values || [];
    rows.forEach((row: string[], i: number) => {
      console.log(`\nRow ${i + 2}:`);
      row.forEach((cell: string, j: number) => {
        if (cell && cell.trim()) {
          const header = headers[j] || `Col${j}`;
          console.log(`  ${header}: ${cell.substring(0, 100)}${cell.length > 100 ? '...' : ''}`);
        }
      });
    });
    
    // Get total row count
    const allDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:A', // Just first column to count rows
    });
    console.log('\n=== TOTAL ROWS ===');
    console.log('Total rows:', allDataResponse.data.values?.length || 0);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

readSheet();
