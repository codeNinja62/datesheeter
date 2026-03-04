import html2canvas from 'html2canvas';

/**
 * Capture the given DOM element as a PNG image and trigger a download.
 * Adds 40px white padding on all four sides.
 *
 * Fix notes:
 *   - Directly capture the displayed HTML element and add padding.
 *   - Ensure the image is centered by creating a larger canvas with padding.
 */
export async function exportToImage(element, filename = 'my-datesheet.png') {
  if (!element) return;

  // Give the browser a tick to finish any pending layout/paint.
  await new Promise((r) => requestAnimationFrame(r));

  const sourceCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  // Calculate padding (40px logical × scale 2 = 80px device pixels each side)
  const padding = 80;
  const paddedCanvas = document.createElement('canvas');
  paddedCanvas.width = sourceCanvas.width + padding * 2;
  paddedCanvas.height = sourceCanvas.height + padding * 2;

  const ctx = paddedCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
  ctx.drawImage(sourceCanvas, padding, padding);

  // Trigger download
  const link = document.createElement('a');
  link.download = filename;
  link.href = paddedCanvas.toDataURL('image/png');
  link.click();
}
