"use strict";
/* ============================================================
   Icon-Generator — reines Node (zlib), keine Abhängigkeiten.
   Zeichnet: Nacht-Grund, Flechten-Äquatorlinie, Bernstein-Sinuswelle,
   vier artencodierte Punkte. Ausgabe: 192/512 + maskable Varianten.
   ============================================================ */
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

/* ---------- CRC32 für PNG-Chunks ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

/* ---------- PNG-Encoder (RGB 8bit) ---------- */
function encodePNG(w, h, rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // Bit-Tiefe
  ihdr[9] = 2;   // Farbtyp RGB
  const stride = w * 3;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;             // Filter 0
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- Zeichnung ---------- */
const NIGHT = [242, 237, 223];   // #F2EDDF — Tafelwerk-Papier
const LICHEN = [110, 135, 87];   // #6E8757 — Tintengrün-Achse
const AMBER = [199, 154, 59];    // #C79A3B — Ochre-Welle
const DUSK = [122, 46, 46];      // #7A2E2E — Burgundy
const MOTH = [74, 93, 80];       // #4A5D50 — Ink-Soft
const PAPER = [242, 237, 223];   // #F2EDDF

function drawIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 3);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 3;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
  };
  // Grund
  for (let i = 0; i < size * size; i++) {
    buf[i * 3] = NIGHT[0]; buf[i * 3 + 1] = NIGHT[1]; buf[i * 3 + 2] = NIGHT[2];
  }
  // Maskable: Inhalt auf 72 % Safe-Zone skalieren (Mitte)
  const s = maskable ? 0.72 : 1.0;
  const cx = size / 2, cy = size / 2;
  const toX = x => Math.round(cx + (x - size / 2) * s);
  const toY = y => Math.round(cy + (y - size / 2) * s);

  // Flechten-Äquatorlinie (Hörspektrum-Achse)
  const eq = Math.round(size * 0.62);
  for (let x = 0; x < size; x++) {
    const yy = toY(eq);
    if (yy >= 0 && yy < size) set(x, yy, LICHEN);
  }

  // Bernstein-Sinuswelle
  const amp = size * 0.09 * s;
  const mid = toY(size * 0.5);
  for (let x = Math.round(size * 0.06); x < size * 0.94; x++) {
    const srcX = x;
    const y = mid + Math.round(Math.sin((srcX / size) * Math.PI * 4) * amp);
    const dx = toX(x);
    set(dx, y, AMBER);
    set(dx, y + 1, AMBER);            // 2 px dick
  }

  // Vier artencodierte Punkte entlang der Achse
  const dotR = Math.max(3, Math.round(size * 0.018));
  const cols = [LICHEN, AMBER, DUSK, MOTH];
  cols.forEach((c, i) => {
    const px = toX(Math.round(size * (0.22 + i * 0.19)));
    const py = toY(eq - Math.round(size * 0.055));
    for (let dy = -dotR; dy <= dotR; dy++) {
      for (let dx = -dotR; dx <= dotR; dx++) {
        if (dx * dx + dy * dy <= dotR * dotR) set(px + dx, py + dy, c);
      }
    }
  });

  // Maskable: Vollflächiger Hintergrund bleibt Nacht; kleinen Papier-Rahmen andeuten
  if (maskable) {
    const m = Math.round(size * 0.06);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x < m || y < m || x >= size - m || y >= size - m) {
          // Rand dunkler absetzen
          const i = (y * size + x) * 3;
          buf[i] = Math.max(0, NIGHT[0] - 6);
          buf[i + 1] = Math.max(0, NIGHT[1] - 8);
          buf[i + 2] = Math.max(0, NIGHT[2] - 6);
        }
      }
    }
  }
  return buf;
}

/* ---------- Ausgabe ---------- */
const outDir = path.join(__dirname, "..", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), encodePNG(size, size, drawIcon(size, false)));
  fs.writeFileSync(path.join(outDir, `icon-${size}-maskable.png`), encodePNG(size, size, drawIcon(size, true)));
}
console.log("Icons geschrieben:", fs.readdirSync(outDir).join(", "));
