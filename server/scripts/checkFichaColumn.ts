import { getGoogleSheetsClient } from '../googleSheets';

async function checkFichaColumn() {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
    
    // Read column T (Ficha) values
    const valueResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Renta/Long Term'!A2:T10",
    });
    
    const rows = valueResponse.data.values || [];
    console.log('=== FICHA COLUMN VALUES ===\n');
    
    rows.forEach((row: string[], i: number) => {
      const id = row[0] || '';
      const condo = row[6] || '';
      const unit = row[7] || '';
      const ficha = row[19] || ''; // Column T (index 19)
      
      console.log(`Row ${i + 2}: ID=${id}, ${condo} ${unit}`);
      if (ficha) {
        console.log(`  Ficha value: ${ficha.substring(0, 200)}${ficha.length > 200 ? '...' : ''}`);
      } else {
        console.log('  Ficha: (empty)');
      }
      console.log('');
    });
    
    // Also check cell notes using the grid data
    console.log('\n=== CHECKING CELL NOTES (if any) ===\n');
    
    const gridResponse = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["'Renta/Long Term'!T2:T10"],
      fields: 'sheets.data.rowData.values(formattedValue,note)',
    });
    
    const rowData = gridResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];
    rowData.forEach((row: any, i: number) => {
      const cell = row.values?.[0];
      console.log(`Row ${i + 2}:`);
      console.log(`  Cell value: ${cell?.formattedValue || '(empty)'}`);
      if (cell?.note) {
        console.log(`  Cell NOTE: ${cell.note.substring(0, 200)}${cell.note.length > 200 ? '...' : ''}`);
      } else {
        console.log('  Cell note: (none)');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFichaColumn();
