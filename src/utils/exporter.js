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

  // Build an off-screen padded wrapper
  const pad = 40;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    background: #ffffff;
    padding: ${pad}px;
    display: inline-block;
  `;
  wrapper.appendChild(element.cloneNode(true));
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    document.body.removeChild(wrapper);
  }
}
}
