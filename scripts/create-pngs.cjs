const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// Simple PNG encoder in pure Node without external deps
function createPNG(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a] 0-255
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a !== undefined ? a : 255;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace: None

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = calcCRC(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function calcCRC(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate icon 80x80
const icon80 = createPNG(80, 80, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Rounded icon with Telecupole colors (Italian TV blue & golden dome accent)
  if (dist > 38) return [0, 0, 0, 0];
  if (dist > 36) return [220, 38, 38, 255]; // Red border accent

  // Inner gradient
  const grad = y / h;
  const r = Math.round(15 + grad * 10);
  const g = Math.round(23 + grad * 15);
  const b = Math.round(42 + grad * 30);

  // Cupola (dome) shape hint
  const inDome = (y > 22 && y < 58 && Math.abs(dx) < (30 - (y < 40 ? Math.pow(40 - y, 1.2) : 0)));
  if (inDome) {
    return [245, 158, 11, 255]; // Golden dome
  }

  return [r, g, b, 255];
});

// Generate icon 130x130
const icon130 = createPNG(130, 130, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 62) return [0, 0, 0, 0];
  if (dist > 59) return [220, 38, 38, 255]; // Red border

  const grad = y / h;
  const r = Math.round(15 + grad * 10);
  const g = Math.round(23 + grad * 15);
  const b = Math.round(42 + grad * 30);

  const inDome = (y > 35 && y < 95 && Math.abs(dx) < (50 - (y < 65 ? Math.pow(65 - y, 1.2) : 0)));
  if (inDome) {
    return [245, 158, 11, 255];
  }

  return [r, g, b, 255];
});

// Generate splash 1920x1080 (pure black with subtle center badge)
// Using a fast sub-sampled resolution or pure 1920x1080
// To keep file size small and fast: pure black 1920x1080 with subtle logo
console.log('Generating 1920x1080 splash...');
const splash = createPNG(1920, 1080, (x, y, w, h) => {
  // Pure #000000 as strictly requested for zero flicker
  // With a small elegant center icon
  const cx = 960;
  const cy = 540;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 40) {
    return [20, 20, 20, 255];
  }
  return [0, 0, 0, 255];
});

const outDir = path.join(__dirname, '../telecupole-webos');
fs.writeFileSync(path.join(outDir, 'icon.png'), icon80);
fs.writeFileSync(path.join(outDir, 'largeIcon.png'), icon130);
fs.writeFileSync(path.join(outDir, 'splash.png'), splash);

// Also copy to public/ so the web preview can display them
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'icon.png'), icon80);
fs.writeFileSync(path.join(publicDir, 'largeIcon.png'), icon130);

console.log('Icons generated successfully!');
