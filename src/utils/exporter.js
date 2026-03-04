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

  // Render at 2× for crispness on high-DPI screens.
  const SCALE = 2;

  // toPng returns a data-URL of the element rendered at SCALE × native size.
  const dataUrl = await toPng(element, {
    pixelRatio: SCALE,
    backgroundColor: '#ffffff',
    // Ensure the full element is captured even if a parent clips its overflow.
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: {
      overflow: 'visible',
    },
  });

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
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
