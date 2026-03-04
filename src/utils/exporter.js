import { toPng } from 'html-to-image';

/**
 * Capture the given DOM element as a pixel-perfect PNG and trigger a download.
 *
 * Uses html-to-image (SVG foreignObject technique) so the browser's own
 * rendering engine produces the image — the result is visually identical to
 * what is shown on screen.
 *
 * A 40 logical-pixel (80 device-pixel at 2× scale) white border is added on
 * all four sides before download.
 */
export async function exportToImage(element, filename = 'my-datesheet.png') {
  if (!element) return;

  // Wait for any pending paint to finish.
  await new Promise((r) => requestAnimationFrame(r));

  // Mark the element so CSS can apply export-only rules (e.g. white-space: nowrap)
  // before we read the scroll dimensions and hand off to html-to-image.
  element.setAttribute('data-exporting', '');
  // Wait one more frame so the attribute's CSS takes effect and layout recalculates.
  await new Promise((r) => requestAnimationFrame(r));

  // Render at 2× for crispness on high-DPI screens.
  const SCALE = 2;

  // Capture dimensions AFTER nowrap is applied so nothing is clipped.
  const captureWidth  = element.scrollWidth;
  const captureHeight = element.scrollHeight;

  let dataUrl;
  try {
    dataUrl = await toPng(element, {
      pixelRatio: SCALE,
      backgroundColor: '#ffffff',
      width: captureWidth,
      height: captureHeight,
      style: { overflow: 'visible' },
    });
  } finally {
    // Always remove the attribute, even if toPng throws.
    element.removeAttribute('data-exporting');
  }

  // Load the captured image so we can read its pixel dimensions.
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  // Composite onto a larger canvas with 40 logical-px (= 80 device-px) padding.
  const pad = 40 * SCALE;
  const canvas = document.createElement('canvas');
  canvas.width  = img.naturalWidth  + pad * 2;
  canvas.height = img.naturalHeight + pad * 2;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, pad, pad);

  // Trigger the file download.
  // The anchor must be in the DOM before .click() is called — Firefox silently
  // ignores clicks on detached elements.
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
