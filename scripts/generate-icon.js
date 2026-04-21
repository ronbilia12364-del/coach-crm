#!/usr/bin/env node
const fs = require("fs");
const zlib = require("zlib");

const SIZE = 192;
const R = 34, G = 197, B = 94; // green-500

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function mkChunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

const raw = Buffer.allocUnsafe(SIZE * (1 + SIZE * 3));
for (let y = 0; y < SIZE; y++) {
  const b = y * (1 + SIZE * 3);
  raw[b] = 0;
  for (let x = 0; x < SIZE; x++) {
    raw[b + 1 + x * 3] = R;
    raw[b + 2 + x * 3] = G;
    raw[b + 3 + x * 3] = B;
  }
}

const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const compressed = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  mkChunk("IHDR", ihdr),
  mkChunk("IDAT", compressed),
  mkChunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync("public/icon-192.png", png);
console.log("Created public/icon-192.png (" + png.length + " bytes)");
