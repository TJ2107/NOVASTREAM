import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height) {
  // Simple PNG encoder in pure Node
  // Create RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.45;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Gradient background from violet (#7c3aed) to cyan (#06b6d4)
      const t = (x + y) / (width + height);
      let red = Math.round(124 * (1 - t) + 6 * t);
      let green = Math.round(58 * (1 - t) + 182 * t);
      let blue = Math.round(237 * (1 - t) + 212 * t);
      let alpha = 255;

      // Inside a rounded TV box screen
      const margin = width * 0.12;
      const isScreen = (x >= margin && x <= width - margin && y >= margin && y <= height - margin);
      
      // Play triangle in the center
      const inTriangle = (
        x >= cx - width * 0.12 &&
        x <= cx + width * 0.18 &&
        Math.abs(y - cy) <= (x - (cx - width * 0.12)) * 0.7
      );

      if (inTriangle) {
        red = 255;
        green = 255;
        blue = 255;
      } else if (isScreen) {
        // Dark screen with slight glass sheen
        red = Math.round(15 + 20 * (1 - y / height));
        green = Math.round(15 + 25 * (1 - y / height));
        blue = Math.round(45 + 40 * (1 - y / height));
      }

      buffer[idx] = red;
      buffer[idx + 1] = green;
      buffer[idx + 2] = blue;
      buffer[idx + 3] = alpha;
    }
  }

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);

    // CRC
    const crc = crc32(chunk.subarray(4, 8 + len));
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
  }

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0; // Filter None
    buffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[n] = c;
}

// Generate files
fs.writeFileSync('./public/icon-192.png', createPng(192, 192));
fs.writeFileSync('./public/icon-512.png', createPng(512, 512));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180));
console.log('Generated PNG icons successfully');
