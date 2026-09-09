"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { loadAppScript } = require("./helpers/load.js");

const ROOT = path.join(__dirname, "..");

/* ---------- Manifest ---------- */

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.webmanifest"), "utf8"));

test("Manifest: Name, Standalone, Farben, Startseite", () => {
  assert.ok(manifest.name, "name fehlt");
  assert.ok(manifest.short_name, "short_name fehlt");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.theme_color, "#F2EDDF");
  assert.equal(manifest.background_color, "#F2EDDF");
  assert.equal(manifest.lang, "de");
});

test("Manifest: Icons 192 + 512, jeweils purpose any und maskable", () => {
  const sizes = new Set(manifest.icons.map(i => i.sizes));
  assert.ok(sizes.has("192x192"), "192x192 fehlt");
  assert.ok(sizes.has("512x512"), "512x512 fehlt");
  const purposes = new Set(manifest.icons.flatMap(i => i.purpose.split(" ")));
  assert.ok(purposes.has("any"), "purpose 'any' fehlt");
  assert.ok(purposes.has("maskable"), "purpose 'maskable' fehlt");
  for (const icon of manifest.icons) {
    assert.equal(icon.src.startsWith("icons/"), true, `Icon-Pfad nicht lokal: ${icon.src}`);
    assert.ok(fs.existsSync(path.join(ROOT, icon.src)), `Icon-Datei fehlt: ${icon.src}`);
  }
});

/* ---------- Icons: valide PNGs mit korrekten Maßen ---------- */

function pngSize(buf) {
  // PNG-Signatur(8) + IHDR-Länge(4) + "IHDR"(4) + Breite(4) + Höhe(4)
  assert.deepEqual([...buf.slice(0, 8)], [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], "PNG-Signatur fehlt");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test("Icon-Dateien sind valide PNGs mit den deklarierten Maßen", () => {
  for (const icon of manifest.icons) {
    const buf = fs.readFileSync(path.join(ROOT, icon.src));
    const { w, h } = pngSize(buf);
    const want = parseInt(icon.sizes, 10);
    assert.equal(w, want, `${icon.src}: Breite ${w} != ${want}`);
    assert.equal(h, want, `${icon.src}: Höhe ${h} != ${want}`);
    // IDAT-Daten müssen dekomprimierbar sein (echte Bilddaten, kein Müll)
    const idat = pngIdatLength(buf) > 0;
    assert.ok(idat, `${icon.src}: keine IDAT-Daten`);
  }
});

function pngIdatLength(buf) {
  let off = 8, idat = 0;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IDAT") idat += len;
    off += 12 + len;                       // Länge + Typ + Daten + CRC
    if (type === "IEND") break;
  }
  return idat;
}

test("Icon-Pixel: Papier-Grund + Ochre-Welle sind wirklich im Bild", () => {
  const buf = fs.readFileSync(path.join(ROOT, "icons/icon-512.png"));
  const px = inflateIcon(buf);
  // Mitte-Links (Fläche) sollte dem Tafelwerk-Papier #F2EDDF nahekommen
  const mid = pixelAt(px, 20, 256, 512);
  assert.ok(Math.abs(mid.r - 242) < 20 && Math.abs(mid.g - 237) < 20 && Math.abs(mid.b - 223) < 20,
    `Hintergrundfarbe falsch: ${JSON.stringify(mid)}`);
  // Irgendwo muss ein ochrefarbener Pixel (#C79A3B) existieren (die Welle)
  let amber = false;
  for (let y = 0; y < 512 && !amber; y += 4) {
    for (let x = 0; x < 512 && !amber; x += 4) {
      const p = pixelAt(px, x, y, 512);
      if (Math.abs(p.r - 199) < 25 && Math.abs(p.g - 154) < 25 && Math.abs(p.b - 59) < 25) amber = true;
    }
  }
  assert.ok(amber, "kein ochrefarbener Wellen-Pixel gefunden");
});

/* Minimaler PNG-Reader für unsere eigenen Dateien (RGB 8bit, Filter 0). */
function pngChunks(buf) {
  const chunks = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    chunks.push({ type, data: buf.slice(off + 8, off + 8 + len) });
    off += 12 + len;
    if (type === "IEND") break;
  }
  return chunks;
}
function inflateIcon(buf) {
  const chunks = pngChunks(buf);
  const idat = Buffer.concat(chunks.filter(c => c.type === "IDAT").map(c => c.data));
  const raw = zlib.inflateSync(idat);
  const ihdr = chunks.find(c => c.type === "IHDR").data;
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  const bpp = 3;                                    // RGB
  const stride = w * bpp + 1;
  // Un-Filter (nur Filter 0/1/2 — unsere Dateien nutzen diese)
  const out = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * stride];
    for (let x = 0; x < w * bpp; x++) {
      const cur = raw[y * stride + 1 + x];
      const left = x >= bpp ? out[y * w * bpp + x - bpp] : 0;
      const up = y > 0 ? out[(y - 1) * w * bpp + x] : 0;
      let v = cur;
      if (filter === 1) v = cur + left;
      else if (filter === 2) v = cur + up;
      else if (filter === 3) v = cur + ((left + up) >> 1);
      else if (filter !== 0) throw new Error("Filter " + filter + " nicht unterstützt");
      out[y * w * bpp + x] = v & 0xFF;
    }
  }
  return { data: out, w, h, bpp };
}
function pixelAt(px, x, y, size) {
  const i = (y * px.w + x) * px.bpp;
  return { r: px.data[i], g: px.data[i + 1], b: px.data[i + 2] };
}

/* ---------- SW-Konfiguration: Precache deckt index.html-Referenzen ---------- */

test("Precache-Liste deckt jede lokale Referenz aus index.html ab", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const url = m[1];
    if (/^(https?:)?\/\//.test(url)) continue;        // externe CDN-URLs
    if (url.startsWith("data:")) continue;
    refs.add(url.replace(/^\.\//, ""));
  }
  const cfg = loadAppScript("js/sw-config.js", {}, "SW_CACHE");
  const precached = new Set([...cfg.precache, cfg.offlineUrl]);
  for (const r of refs) {
    assert.ok(precached.has(r), `index.html referenziert '${r}', aber Precache nicht`);
  }
  // Und die Kern-Dateien sind explizit drin:
  for (const must of ["index.html", "style.css", "js/app.js", "js/audio-engine.js",
                      "js/journal.js", "js/sw-config.js", "manifest.webmanifest"]) {
    assert.ok(precached.has(must), `Kerndatei '${must}' fehlt im Precache`);
  }
});

/* ---------- Cache-Version: Format + Auto-Bump-Skript ---------- */

test("Cache-Version hat gültiges Format v<N>", () => {
  const cfg = loadAppScript("js/sw-config.js", {}, "SW_CACHE");
  assert.match(cfg.VERSION, /^v\d+$/, "VERSION sollte v<Zahl> sein");
});

test("Bump-Skript: v3 -> v4, idempotent bei erneutem Lauf (v5), Fehler bei fehlender Zeile", () => {
  const os = require("node:os");
  const { execFileSync } = require("node:child_process");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "swbump-"));
  const target = path.join(tmp, "sw-config.js");
  const src = fs.readFileSync(path.join(ROOT, "js", "sw-config.js"), "utf8");
  // Simuliere v3-Stand, egal was aktuell drinsteht
  fs.writeFileSync(target, src.replace(/const VERSION = "v\d+";/, 'const VERSION = "v3";'));
  const script = path.join(ROOT, "scripts", "bump-sw-version.mjs");
  const run = () => execFileSync(process.execPath, [script, target], { encoding: "utf8" });
  run();
  assert.match(fs.readFileSync(target, "utf8"), /const VERSION = "v4";/, "erster Bump: v3 -> v4");
  run();
  assert.match(fs.readFileSync(target, "utf8"), /const VERSION = "v5";/, "zweiter Bump: v4 -> v5");
  // Fehlerfall: Datei ohne VERSION lässt das Skript mit Code != 0 scheitern
  const bad = path.join(tmp, "bad.js");
  fs.writeFileSync(bad, "const X = 1;");
  assert.throws(() => execFileSync(process.execPath, [script, bad], { stdio: "pipe" }));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("SW-Strategien: Fonts network-first, Shell stale-while-revalidate, Rest bypass", () => {
  const cfg = loadAppScript("js/sw-config.js", {}, "SW_CACHE");
  assert.equal(cfg.strategyFor("https://fonts.gstatic.com/s/fraunces/x.woff2"), "font");
  assert.equal(cfg.strategyFor("https://fonts.googleapis.com/css2?family=X"), "font");
  assert.equal(cfg.strategyFor(locationLike("style.css")), "shell");
  assert.equal(cfg.strategyFor(locationLike("js/app.js")), "shell");
  assert.equal(cfg.strategyFor(locationLike("icons/icon-192.png")), "shell");
  assert.equal(cfg.strategyFor(locationLike("api/data")), "bypass");
});

function locationLike(rel) { return "https://example.com/" + rel; }

/* ---------- Registrierungs-Schutz: nur https, nicht localhost ---------- */

test("shouldRegisterSW: https ja, localhost/nein/file ja-nicht, http-Host nein", () => {
  const ctx = loadAppScript("js/sw-config.js", {}, "{ shouldRegisterSW: SW_CACHE.shouldRegisterSW }");
  const f = ctx.shouldRegisterSW;
  const mk = (proto, host) => ({ protocol: proto + ":", hostname: host });

  assert.equal(f(mk("https", "example.com")), true);
  assert.equal(f(mk("https", "example.github.io")), true);
  assert.equal(f(mk("https", "localhost")), false);
  assert.equal(f(mk("https", "127.0.0.1")), false);
  assert.equal(f(mk("http", "example.com")), false);
  assert.equal(f(mk("file", "irgendwas")), false);
});
