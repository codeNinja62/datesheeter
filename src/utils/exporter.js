import html2canvas from 'html2canvas';

/**
 * Capture the given DOM element as a PNG image and trigger a download.
 * Adds 40px white padding on all four sides.
 *
 * Fix notes:
 *   - Do NOT use scrollIntoView before capture (it mutates scroll state that
 *     html2canvas then reads incorrectly).
 *   - Pass scrollX:0 / scrollY:0 so html2canvas captures the element in its
 *     own coordinate space rather than applying an offset based on the current
 *     window scroll position (the old negative values were incorrect).
 *   - windowWidth/windowHeight are set generously so an overflow:auto parent
 *     cannot clip a wide table.
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
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  // Composite onto a padded canvas (40px logical × scale 2 = 80px device pixels each side)
  const pad = 80;
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
