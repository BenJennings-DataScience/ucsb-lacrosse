/**
 * Generates PNG icons for the PWA manifest using the @resvg/resvg-js package
 * (pure WASM, no native deps). Falls back to writing SVG files if unavailable.
 * Run: node scripts/gen-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/icons');
mkdirSync(OUT, { recursive: true });

const NAVY = '#003660';
const GOLD = '#FEBC11';

function drawIcon(size, maskable) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const pad = maskable ? size * 0.1 : 0;

  // Background
  ctx.fillStyle = NAVY;
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    const r = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Gold circle
  const cx = size / 2;
  const cy = size / 2;
  const circleR = size * 0.32 - pad;
  ctx.beginPath();
  ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();

  // "GL" text
  const fs = size * 0.22;
  ctx.fillStyle = NAVY;
  ctx.font = `900 ${fs}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GL', cx, cy + fs * 0.05);

  return canvas.toBuffer('image/png');
}

const sizes = [192, 512];
for (const size of sizes) {
  writeFileSync(path.join(OUT, `icon-${size}.png`), drawIcon(size, false));
  writeFileSync(path.join(OUT, `icon-maskable-${size}.png`), drawIcon(size, true));
  console.log(`✓ Generated ${size}px icons`);
}
console.log('Done — icons written to public/icons/');
