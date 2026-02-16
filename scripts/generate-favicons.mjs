/**
 * Generate static favicon files for ManaBalk.nl
 * Run with: node scripts/generate-favicons.mjs
 *
 * Uses the @napi-rs/canvas package to render the favicon at multiple sizes.
 * If @napi-rs/canvas is not available, falls back to SVG-only generation.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// SVG template
function createFaviconSVG(size, borderRadius) {
  const fontSize = Math.round(size * 0.58);
  const br = borderRadius || Math.round(size * 0.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${br}" fill="url(#bg)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="900" font-style="italic">M</text>
</svg>`;
}

// Create ICO file from PNG buffer (BMP-based ICO format)
function createICO(pngBuffers) {
  // ICO header: 6 bytes
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = numImages * dirEntrySize;

  let dataOffset = headerSize + dirSize;
  const entries = [];

  for (const { buffer, size } of pngBuffers) {
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      offset: dataOffset,
      size: buffer.length,
    });
    dataOffset += buffer.length;
  }

  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);

  // Header
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: ICO
  ico.writeUInt16LE(numImages, 4); // Number of images

  // Directory entries
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const offset = headerSize + i * dirEntrySize;
    ico.writeUInt8(e.width, offset);      // Width
    ico.writeUInt8(e.height, offset + 1);  // Height
    ico.writeUInt8(0, offset + 2);         // Color palette
    ico.writeUInt8(0, offset + 3);         // Reserved
    ico.writeUInt16LE(1, offset + 4);      // Color planes
    ico.writeUInt16LE(32, offset + 6);     // Bits per pixel
    ico.writeUInt32LE(e.size, offset + 8);  // Image data size
    ico.writeUInt32LE(e.offset, offset + 12); // Offset to image data
  }

  // Image data
  for (let i = 0; i < pngBuffers.length; i++) {
    pngBuffers[i].buffer.copy(ico, entries[i].offset);
  }

  return ico;
}

async function main() {
  // Always create the main SVG favicon
  const svgContent = createFaviconSVG(512, 80);
  writeFileSync(join(publicDir, 'favicon.svg'), svgContent);
  console.log('✓ favicon.svg (512x512)');

  // Try to use sharp for PNG generation
  let sharp;
  try {
    sharp = (await import('sharp')).default;
    console.log('✓ sharp found, generating PNG files...');
  } catch {
    console.log('⚠ sharp not found, installing...');
    const { execSync } = await import('child_process');
    try {
      execSync('npm install sharp --save-dev', {
        cwd: join(__dirname, '..'),
        stdio: 'pipe'
      });
      sharp = (await import('sharp')).default;
      console.log('✓ sharp installed successfully');
    } catch (e) {
      console.error('✗ Could not install sharp. SVG favicon only.');
      console.log('  Run: npm install sharp --save-dev');
      return;
    }
  }

  // Generate PNGs from SVG at each required size
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' },
  ];

  const icoBuffers = [];

  for (const { size, name } of sizes) {
    const br = size === 180 ? Math.round(size * 0.22) : Math.round(size * 0.16);
    const svg = createFaviconSVG(size, br);
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(join(publicDir, name), pngBuffer);
    console.log(`✓ ${name} (${size}x${size})`);

    // Collect 16x16 and 32x32 for ICO
    if (size === 16 || size === 32 || size === 48) {
      icoBuffers.push({ buffer: pngBuffer, size });
    }
  }

  // Generate ICO file (contains 16, 32, 48 px PNGs)
  const icoBuffer = createICO(icoBuffers);
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ favicon.ico (16x16, 32x32, 48x48)');

  // Generate OG Image (1200x630) - dark background with ManaBalk branding
  const ogWidth = 1200;
  const ogHeight = 630;
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ogWidth}" height="${ogHeight}">
  <defs>
    <linearGradient id="ogbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b0f19"/>
      <stop offset="100%" style="stop-color:#111827"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2563eb"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${ogWidth}" height="${ogHeight}" fill="url(#ogbg)"/>
  <rect x="0" y="0" width="${ogWidth}" height="6" fill="url(#accent)"/>
  <rect x="80" y="200" width="120" height="120" rx="20" fill="url(#accent)"/>
  <text x="140" y="277" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="70" font-weight="900" font-style="italic">M</text>
  <text x="230" y="250" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="900" dominant-baseline="middle">ManaBalk.nl</text>
  <text x="80" y="380" fill="#9ca3af" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="400">Gaming Nieuws, Reviews &amp; Tech</text>
  <text x="80" y="440" fill="#6b7280" font-family="Arial,Helvetica,sans-serif" font-size="24">De snelste gaming nieuwssite van Nederland</text>
  <rect x="80" y="${ogHeight - 60}" width="200" height="3" fill="url(#accent)" rx="1"/>
</svg>`;

  const ogBuffer = await sharp(Buffer.from(ogSvg))
    .jpeg({ quality: 90 })
    .toBuffer();
  writeFileSync(join(publicDir, 'og-image.jpg'), ogBuffer);
  console.log(`✓ og-image.jpg (${ogWidth}x${ogHeight})`);

  console.log('\n✅ All favicon and OG image files generated successfully!');
}

main().catch(console.error);
