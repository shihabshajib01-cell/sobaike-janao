const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAND_DIR = path.join(process.cwd(), 'public', 'brand');
if (!fs.existsSync(BRAND_DIR)) {
  fs.mkdirSync(BRAND_DIR, { recursive: true });
}

const TEAL = '#0F828C';
const TEAL_WAVE = '#20A3AF';

// Helper to create vector SVG for the Sobaike Janao Mark
function createMarkSvg(options = {}) {
  const {
    width = 512,
    height = 512,
    fgColor = TEAL,
    waveColor = TEAL_WAVE,
    bgColor = 'none',
    scale = 1,
    offsetX = 0,
    offsetY = 0,
  } = options;

  const bgRect = bgColor !== 'none' ? `<rect width="${width}" height="${height}" fill="${bgColor}" />` : '';

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${bgRect}
    <g transform="translate(${256 + offsetX}, ${256 + offsetY}) scale(${scale}) translate(-256, -256)">
      <!-- Signal / Broadcast Waves at Top-Right -->
      <path
        d="M 330 190 A 55 55 0 0 1 385 245"
        stroke="${waveColor}"
        stroke-width="20"
        stroke-linecap="round"
        fill="none"
      />
      <path
        d="M 342 145 A 105 105 0 0 1 447 250"
        stroke="${waveColor}"
        stroke-width="20"
        stroke-linecap="round"
        fill="none"
      />

      <!-- Main Speech Bubble / Chat Body -->
      <path
        d="
          M 210 175
          C 285 175 345 220 345 285
          C 345 320 325 350 295 370
          C 280 380 260 388 235 390
          L 190 425
          L 205 385
          C 160 375 130 335 130 285
          C 130 220 165 175 210 175
          Z
        "
        fill="none"
        stroke="${fgColor}"
        stroke-width="24"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Inside Stylized Character Glyph (Letter / Hook / Smile) -->
      <!-- Top Horizontal Bar -->
      <path
        d="M 195 255 L 285 255"
        stroke="${fgColor}"
        stroke-width="22"
        stroke-linecap="round"
        fill="none"
      />
      <!-- U-curve / Bowl -->
      <path
        d="
          M 215 255
          C 215 315 265 315 265 255
        "
        stroke="${fgColor}"
        stroke-width="22"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </g>
  </svg>
  `;
}

// Full Wordmark SVG (Light & Dark)
function createFullWordmarkSvg(options = {}) {
  const {
    width = 1200,
    height = 400,
    isDark = false,
  } = options;

  const fgColor = TEAL;
  const waveColor = TEAL_WAVE;
  const textPrimary = isDark ? '#FFFFFF' : '#171923';
  const textSecondary = isDark ? '#A0AEC0' : '#4A5568';

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Brand Mark -->
    <g transform="translate(-10, 0)">
      <g transform="translate(180, 200) scale(0.72) translate(-256, -256)">
        <!-- Signal / Broadcast Waves -->
        <path
          d="M 330 190 A 55 55 0 0 1 385 245"
          stroke="${waveColor}"
          stroke-width="22"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 342 145 A 105 105 0 0 1 447 250"
          stroke="${waveColor}"
          stroke-width="22"
          stroke-linecap="round"
          fill="none"
        />

        <!-- Main Speech Bubble -->
        <path
          d="
            M 210 175
            C 285 175 345 220 345 285
            C 345 320 325 350 295 370
            C 280 380 260 388 235 390
            L 190 425
            L 205 385
            C 160 375 130 335 130 285
            C 130 220 165 175 210 175
            Z
          "
          fill="none"
          stroke="${fgColor}"
          stroke-width="26"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Inner Glyph -->
        <path
          d="M 195 255 L 285 255"
          stroke="${fgColor}"
          stroke-width="24"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="
            M 215 255
            C 215 315 265 315 265 255
          "
          stroke="${fgColor}"
          stroke-width="24"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </g>

      <!-- Bengali & English Typography -->
      <!-- Bangla Text -->
      <text
        x="370"
        y="215"
        font-family="'Noto Sans Bengali', system-ui, -apple-system, sans-serif"
        font-size="108"
        font-weight="700"
        fill="${textPrimary}"
        letter-spacing="-1.5"
      >সবাইকে জানাও</text>

      <!-- English Subtitle Text -->
      <text
        x="375"
        y="290"
        font-family="'Poppins', 'Noto Sans Bengali', system-ui, sans-serif"
        font-size="52"
        font-weight="500"
        fill="${textSecondary}"
        letter-spacing="0.5"
      >Sobaike Janao</text>
    </g>
  </svg>
  `;
}

// Generate simple ICO file header and directory for 16, 32, 48 PNGs
function buildIcoBuffer(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Offset of image data
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(b => b.buffer)]);
}

async function generateAll() {
  console.log('Generating Brand Assets in:', BRAND_DIR);

  // 1. Standalone Marks (Transparent Background)
  const markSizes = [512, 256, 128, 64];
  for (const size of markSizes) {
    const svg = createMarkSvg({ width: size, height: size });
    const outPath = path.join(BRAND_DIR, `sobaike-janao-mark-${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Created: sobaike-janao-mark-${size}.png`);
  }

  // 2. Favicons (16, 32, 48)
  const favSizes = [16, 32, 48];
  const favPngBuffers = [];
  for (const size of favSizes) {
    const svg = createMarkSvg({ width: size, height: size });
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = path.join(BRAND_DIR, `favicon-${size}x${size}.png`);
    fs.writeFileSync(outPath, buffer);
    favPngBuffers.push({ width: size, height: size, buffer });
    console.log(`Created: favicon-${size}x${size}.png`);
  }

  // 3. favicon.ico
  const icoBuffer = buildIcoBuffer(favPngBuffers);
  fs.writeFileSync(path.join(BRAND_DIR, 'favicon.ico'), icoBuffer);
  console.log('Created: favicon.ico');

  // 4. Apple Touch Icon (180x180)
  const appleSvg = createMarkSvg({
    width: 180,
    height: 180,
    scale: 0.9,
    bgColor: 'none',
  });
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(BRAND_DIR, 'apple-touch-icon.png'));
  console.log('Created: apple-touch-icon.png');

  // 5. Web App Icons (192, 512)
  for (const size of [192, 512]) {
    const svg = createMarkSvg({
      width: size,
      height: size,
      scale: 0.9,
      bgColor: 'none',
    });
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(BRAND_DIR, `icon-${size}x${size}.png`));
    console.log(`Created: icon-${size}x${size}.png`);
  }

  // 6. Maskable Icon (512x512 with solid Teal #0F828C background, white mark, safe zone scale ~0.65)
  const maskableSvg = createMarkSvg({
    width: 512,
    height: 512,
    fgColor: '#FFFFFF',
    waveColor: '#E0F7FA',
    bgColor: TEAL,
    scale: 0.65,
  });
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(path.join(BRAND_DIR, 'icon-maskable-512x512.png'));
  console.log('Created: icon-maskable-512x512.png');

  // 7. Full Wordmark Logos (Light and Dark)
  const lightLogoSvg = createFullWordmarkSvg({ width: 1200, height: 400, isDark: false });
  await sharp(Buffer.from(lightLogoSvg))
    .png()
    .toFile(path.join(BRAND_DIR, 'sobaike-janao-logo-light.png'));
  console.log('Created: sobaike-janao-logo-light.png');

  const darkLogoSvg = createFullWordmarkSvg({ width: 1200, height: 400, isDark: true });
  await sharp(Buffer.from(darkLogoSvg))
    .png()
    .toFile(path.join(BRAND_DIR, 'sobaike-janao-logo-dark.png'));
  console.log('Created: sobaike-janao-logo-dark.png');

  console.log('All brand assets successfully generated!');
}

generateAll().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
