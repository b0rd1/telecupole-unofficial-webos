const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(toCrc);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPiemonteFlagPng(width, height) {
  // RGBA raw buffer: each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize);

  const BLUE = [0, 61, 165, 255];     // Azzurro Savoia (#003da5)
  const RED = [208, 16, 38, 255];     // Rosso (#d01026)
  const WHITE = [255, 255, 255, 255]; // Bianco (#ffffff)

  const borderThick = Math.max(3, Math.round(width * 0.08));
  const crossThick = Math.max(6, Math.round(width * 0.18));
  const halfCross = Math.floor(crossThick / 2);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  // Lambello geometry
  const barTop = Math.round(height * 0.19);
  const barBottom = Math.round(height * 0.28);
  const pendTop = barBottom;
  const pendBottom = Math.round(height * 0.42);
  const pendWidthHalf = Math.max(2, Math.round(crossThick * 0.28));

  const pLeft = Math.round(width * 0.24);
  const pCenter = cx;
  const pRight = width - pLeft;

  // Corner rounding radius
  const cornerR = Math.round(width * 0.15);

  function isCornerOutside(x, y) {
    let dx = 0, dy = 0;
    if (x < cornerR) dx = cornerR - x;
    else if (x >= width - cornerR) dx = x - (width - 1 - cornerR);
    if (y < cornerR) dy = cornerR - y;
    else if (y >= height - cornerR) dy = y - (height - 1 - cornerR);
    if (dx > 0 && dy > 0) {
      return (dx * dx + dy * dy) > (cornerR * cornerR);
    }
    return false;
  }

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      if (isCornerOutside(x, y)) {
        // Transparent corner
        raw[pxOffset] = 0;
        raw[pxOffset + 1] = 0;
        raw[pxOffset + 2] = 0;
        raw[pxOffset + 3] = 0;
        continue;
      }

      // Check if on outer blue border
      const onBorder = (x < borderThick || x >= width - borderThick || y < borderThick || y >= height - borderThick);

      if (onBorder) {
        raw[pxOffset] = BLUE[0];
        raw[pxOffset + 1] = BLUE[1];
        raw[pxOffset + 2] = BLUE[2];
        raw[pxOffset + 3] = BLUE[3];
        continue;
      }

      // Default field: Red
      let pixel = RED;

      // White cross
      const onVertCross = (Math.abs(x - cx) <= halfCross);
      const onHorizCross = (Math.abs(y - cy) <= halfCross);

      if (onVertCross || onHorizCross) {
        pixel = WHITE;
      }

      // Blue Lambel (Lambello)
      // Horizontal bar
      if (y >= barTop && y <= barBottom && x >= borderThick + 2 && x < width - borderThick - 2) {
        pixel = BLUE;
      }

      // Pendants (gocce)
      if (y > pendTop && y <= pendBottom) {
        // Trapezoidal shape / drop
        const progress = (y - pendTop) / (pendBottom - pendTop);
        const wAtY = pendWidthHalf + Math.round(progress * 1.5);
        if (Math.abs(x - pLeft) <= wAtY || Math.abs(x - pCenter) <= wAtY || Math.abs(x - pRight) <= wAtY) {
          pixel = BLUE;
        }
      }

      raw[pxOffset] = pixel[0];
      raw[pxOffset + 1] = pixel[1];
      raw[pxOffset + 2] = pixel[2];
      raw[pxOffset + 3] = pixel[3];
    }
  }

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const icon80 = createPiemonteFlagPng(80, 80);
const icon130 = createPiemonteFlagPng(130, 130);

// Save to telecupole-webos
fs.writeFileSync(path.join(__dirname, '../telecupole-webos/icon.png'), icon80);
fs.writeFileSync(path.join(__dirname, '../telecupole-webos/largeIcon.png'), icon130);

// Save to public folder
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'icon.png'), icon80);
fs.writeFileSync(path.join(publicDir, 'largeIcon.png'), icon130);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), icon80);

console.log('Successfully generated Piedmont flag icons: 80x80 and 130x130');
