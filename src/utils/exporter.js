import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Export the current filtered rows to a clean .xlsx file.
 */
export function exportToExcel(rows, filename = 'my-datesheet.xlsx') {
  const header = ['Date', 'Day', 'Time', 'Course Code'];
  const data = rows.map((r) => [r.date, r.day, r.slot, r.courseCode]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // Auto-size columns
  ws['!cols'] = header.map((_, i) => ({
    wch: Math.max(
      header[i].length,
      ...data.map((row) => String(row[i] || '').length)
    ) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datesheet');
  XLSX.writeFile(wb, filename);
}

/**
 * Capture the given DOM element as a PNG image and trigger a download.
 */
export async function exportToImage(element, filename = 'my-datesheet.png') {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2, // high-res
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
