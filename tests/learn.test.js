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

test("hearersAt: 500 Hz hören alle vier Arten", () => {
  assert.deepEqual([...hearersAt(500)].sort(), ["hund", "insekt", "mensch", "vogel"]);
});

test("hearersAt: 19 kHz nur noch Mensch und Hund", () => {
  assert.deepEqual([...hearersAt(19000)].sort(), ["hund", "mensch"]);
});

test("hearersAt: 25 kHz nur der Hund", () => {
  assert.deepEqual([...hearersAt(25000)], ["hund"]);
});

test("hearersAt: 47 kHz hört niemand mehr", () => {
  assert.deepEqual([...hearersAt(47000)], []);
});

test("hearersAt: 30 Hz nur Mensch (Hunde beginnen erst bei 40 Hz)", () => {
  assert.deepEqual([...hearersAt(30)], ["mensch"]);
  // 100 Hz dagegen: Mensch UND Hund — beide Bänder decken das ab
  assert.deepEqual([...hearersAt(100)].sort(), ["hund", "mensch"]);
});
