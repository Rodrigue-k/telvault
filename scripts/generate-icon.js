/**
 * generate-icon.js
 * Generates a multi-resolution Windows .ico file from assets/icon.png
 * using sharp (already in the project) — no extra dependencies needed.
 *
 * The ICO format used here embeds PNG chunks directly (supported by
 * Windows Vista+ and all modern NSIS installers).
 *
 * Usage: node scripts/generate-icon.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'assets', 'icon.png');
const OUTPUT = path.join(ROOT, 'assets', 'icon.ico');

// Sizes required for a complete Windows icon (NSIS + taskbar + Explorer)
const SIZES = [16, 24, 32, 48, 64, 128, 256];

/**
 * Builds a .ico binary from an array of PNG buffers.
 * Each entry in `images` must be: { size: number, data: Buffer }
 * The ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(images) {
  const count = images.length;

  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // Reserved, must be 0
  header.writeUInt16LE(1, 2);      // Type: 1 = ICO
  header.writeUInt16LE(count, 4);  // Number of images

  // Directory entries: 16 bytes each
  const directoryEntries = [];
  const imageDataChunks = [];

  // Image data starts after header (6) + directory (16 * count)
  let imageDataOffset = 6 + 16 * count;

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    // Width & height: 0 means 256 in the ICO spec
    entry.writeUInt8(size >= 256 ? 0 : size, 0);   // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1);   // Height
    entry.writeUInt8(0, 2);                          // Color count (0 = no palette)
    entry.writeUInt8(0, 3);                          // Reserved
    entry.writeUInt16LE(1, 4);                       // Color planes
    entry.writeUInt16LE(32, 6);                      // Bits per pixel (32-bit RGBA)
    entry.writeUInt32LE(data.length, 8);             // Size of image data
    entry.writeUInt32LE(imageDataOffset, 12);        // Offset to image data

    directoryEntries.push(entry);
    imageDataChunks.push(data);
    imageDataOffset += data.length;
  }

  return Buffer.concat([header, ...directoryEntries, ...imageDataChunks]);
}

async function main() {
  console.log(`\n🎨 Generating icon.ico from: ${INPUT}`);

  if (!fs.existsSync(INPUT)) {
    console.error('❌ Source file not found:', INPUT);
    process.exit(1);
  }

  const images = [];
  for (const size of SIZES) {
    process.stdout.write(`  → Resizing to ${size}×${size}px… `);
    const data = await sharp(INPUT)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();
    images.push({ size, data });
    console.log('✓');
  }

  const icoBuf = buildIco(images);
  fs.writeFileSync(OUTPUT, icoBuf);

  const sizeKb = (icoBuf.length / 1024).toFixed(1);
  console.log(`\n✅ Done! Written to: ${OUTPUT} (${sizeKb} KB)`);
  console.log(`   Embedded sizes: ${SIZES.join(', ')}px\n`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
