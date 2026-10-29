import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(size) {
  const width = size;
  const height = size;
  const rawData = [];

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.22;

  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type 0
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius && dist >= innerRadius) {
        // Vibrant emerald/cyan to indigo meter arc
        const angle = Math.atan2(dy, dx); // -pi to pi
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        const r = Math.round(16 + 100 * normalizedAngle);
        const g = Math.round(185 - 50 * normalizedAngle);
        const b = Math.round(129 + 100 * normalizedAngle);
        rawData.push(r, g, b, 255);
      } else if (dist < innerRadius) {
        // Dark center dial with a bright needle/dot
        if (Math.abs(dx) <= size * 0.08 && dy >= -size * 0.18 && dy <= 0) {
          // pointer/indicator
          rawData.push(52, 211, 153, 255);
        } else {
          rawData.push(15, 23, 42, 240); // slate-900
        }
      } else {
        // Transparent outside
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = createPng(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
}
