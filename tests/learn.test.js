"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadAppScripts } = require("./helpers/load.js");

/* Lädt targets.js + app.js im SELBEN vm-Kontext, damit app.js die
   HEARING_RANGES sieht — Grundlage für hearersAt(). */
const ctx = loadAppScripts(["js/targets.js", "js/app.js"], {
  AudioEngine: { isLocked: () => false, isPlaying: () => false },
  Journal: { startEntry() {}, stopActive() {} }
}, "{ sweepFreqAt, hearersAt }");

const { sweepFreqAt, hearersAt } = ctx;

test("sweepFreqAt: lineare Trajektorie von f0 nach f1", () => {
  assert.equal(sweepFreqAt(20, 18000, 0), 20);
  assert.equal(sweepFreqAt(20, 18000, 0.5), 9010);
  assert.equal(sweepFreqAt(20, 18000, 1), 18000);
});

test("sweepFreqAt: klemmt außerhalb [0,1] und rundet ganzzahlig", () => {
  assert.equal(sweepFreqAt(20, 18000, -0.5), 20);
  assert.equal(sweepFreqAt(20, 18000, 1.5), 18000);
  assert.equal(Number.isInteger(sweepFreqAt(20, 18000, 0.25)), true);
});

test("hearersAt: 500 Hz hören sechs Arten (nur die Fruchtfliege ist raus — ihr Band endet bei 280 Hz)", () => {
  assert.deepEqual([...hearersAt(500)].sort(), ["hund", "insekt", "katze", "mensch", "ratte", "vogel"]);
});

test("hearersAt: 19 kHz — Vogel und Mücke sind raus, Ratte bleibt drin", () => {
  assert.deepEqual([...hearersAt(19000)].sort(), ["hund", "katze", "mensch", "ratte"]);
});

test("hearersAt: 25 kHz nur Hund, Katze und Ratte", () => {
  assert.deepEqual([...hearersAt(25000)].sort(), ["hund", "katze", "ratte"]);
});

test("hearersAt: 47 kHz nur noch Katze und Ratte (Hund endet bei 45 kHz) — über der Spiel-Grenze stumm", () => {
  assert.deepEqual([...hearersAt(47000)].sort(), ["katze", "ratte"]);
});

test("hearersAt: 51 kHz nur noch Ratte und Katze (USV-Region)", () => {
  assert.deepEqual([...hearersAt(51000)].sort(), ["katze", "ratte"]);
});

test("hearersAt: 30 Hz nur Mensch (Hunde/Katzen beginnen bei 40/48 Hz)", () => {
  assert.deepEqual([...hearersAt(30)], ["mensch"]);
  // 100 Hz dagegen: fast alle — Fruchtfliege, Mensch, Hund, Katze
  assert.deepEqual([...hearersAt(100)].sort(), ["fliege", "hund", "katze", "mensch"]);
});

test("hearersAt: 150 Hz — Balz-Puls: Fruchtfliege hört, Mücke noch nicht (Bänder getrennt)", () => {
  assert.deepEqual([...hearersAt(150)].sort(), ["fliege", "hund", "katze", "mensch"]);
  assert.deepEqual([...hearersAt(320)].sort(), ["hund", "insekt", "katze", "mensch", "ratte", "vogel"]);
});
