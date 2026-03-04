import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

/**
 * Export the current filtered rows to a clean .xlsx file.
 */
export function exportToExcel(rows, filename = 'my-datesheet.xlsx') {
  const header = ['Time', 'Date', 'Day', 'Subject'];
  const data = rows.map((r) => [r.slot, r.date, r.day, r.courseName]);
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
 * Adds 40px white padding on all four sides.
 */
export async function exportToImage(element, filename = 'my-datesheet.png') {
  if (!element) return;

  // Capture the element as-is at high resolution
  const sourceCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Draw onto a new canvas with 40px (×2 for scale) padding on all sides
  const pad = 80; // 40px * scale(2)
  const padded = document.createElement('canvas');
  padded.width = sourceCanvas.width + pad * 2;
  padded.height = sourceCanvas.height + pad * 2;

  const ctx = padded.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, padded.width, padded.height);
  ctx.drawImage(sourceCanvas, pad, pad);

  const link = document.createElement('a');
  link.download = filename;
  link.href = padded.toDataURL('image/png');
  link.click();
}
