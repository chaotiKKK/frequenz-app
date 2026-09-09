"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadAppScript } = require("./helpers/load.js");

const EngineLogic = loadAppScript(
  "js/engine-logic.js",
  {},
  "{ duetFreqs, sweepProfile, sweepFreqAt, chirpJitterFreq, chordFreqs, envelopeAmp }"
);

test("duetFreqs: Weibchen + Männchen bei 1,25×, ganzzahlig", () => {
  const [fW, fM] = EngineLogic.duetFreqs(480);
  assert.equal(fW, 480);
  assert.equal(fM, 600);              // 480 * 1.25 = 600
  const [w2, m2] = EngineLogic.duetFreqs(440);
  assert.equal(w2, 440);
  assert.equal(m2, 550);              // 440 * 1.25 = 550
});

test("duetFreqs: klemmt nicht am Nyquist, bleibt proportional", () => {
  const [fW, fM] = EngineLogic.duetFreqs(100);
  assert.deepEqual([fW, fM], [100, 125]);
});

test("sweepProfile: ±1,5 Oktav? Nein — ±50 % um die Ziel Frequenz, geklemmt", () => {
  const p = EngineLogic.sweepProfile(30000);
  assert.equal(p.f1, 45000);          // 30000 * 1.5, unter Klemme
  assert.ok(p.f0 > 40, "f0 über Hart-Untergrenze");
  assert.ok(p.f0 < p.f1, "aufsteigend");
  assert.equal(p.durUp, 1.5, "Aufwärts-Hälfte 1,5 s");
  assert.equal(p.durTotal, 3, "Gesamtzyklus 3 s");
});

test("sweepProfile: Untergrenze 40 Hz und Obergrenze 45 kHz werden geklemmt", () => {
  const low = EngineLogic.sweepProfile(40);
  assert.equal(low.f0, 40);           // 40/1.5 = 26,7 -> geklemmt auf 40
  const high = EngineLogic.sweepProfile(44000);
  assert.equal(high.f1, 45000);       // 44000*1.5 = 66000 -> geklemmt auf 45000
});

test("sweepFreqAt: Dreiecksbahn — Start, Spitze, Ende, Wrap", () => {
  const { f0, f1 } = EngineLogic.sweepProfile(900);   // f0=600, f1=1350
  assert.equal(EngineLogic.sweepFreqAt(f0, f1, 0), f0);
  assert.equal(EngineLogic.sweepFreqAt(f0, f1, 1.5), f1);   // Spitze bei halber Zeit
  assert.equal(EngineLogic.sweepFreqAt(f0, f1, 3), f0);     // voller Zyklus -> Start
  assert.equal(EngineLogic.sweepFreqAt(f0, f1, 4.5), f1);   // Zyklus + 1,5 s -> Spitze (Wrap)
  assert.equal(EngineLogic.sweepFreqAt(f0, f1, -3), f0);    // negativ wrapt genauso
  // Zwischenwert: linear, bei t=0.75 genau halbe Distanz
  const mid = EngineLogic.sweepFreqAt(f0, f1, 0.75);
  assert.ok(Math.abs(mid - (f0 + (f1 - f0) / 2)) < 0.0001, `Mitte ${mid}`);
});

test("chirpJitterFreq: bleibt im ±8-%-Band, deterministisch bei gegebenem random", () => {
  const base = 2000;
  assert.equal(EngineLogic.chirpJitterFreq(base, () => 0.5), base); // Mitte = exakt base
  const lo = EngineLogic.chirpJitterFreq(base, () => 0);
  const hi = EngineLogic.chirpJitterFreq(base, () => 0.999);
  assert.ok(lo >= base * 0.92 && lo < base, `untere Grenze ${lo}`);
  assert.ok(hi > base && hi <= base * 1.08, `obere Grenze ${hi}`);
});

test("chordFreqs: Dur-Dreiklang 1 / 1,25 / 1,5", () => {
  // Spread: vm-Realm-Array braucht hostseitige Kopie für deepEqual
  assert.deepEqual([...EngineLogic.chordFreqs(220)], [220, 275, 330]);
});

test("envelopeAmp: Klick-freie Hüllkurve — 0 am Anfang, Plateau, 0 am Ende", () => {
  const dur = 1;
  assert.equal(EngineLogic.envelopeAmp(0, dur), 0.0001);
  assert.equal(EngineLogic.envelopeAmp(dur, dur), 0.0001);
  assert.ok(EngineLogic.envelopeAmp(0.5, dur) > 0.89, "Plateau nahe 0.9");
  // Attack ist min(0.02, dur/4)
  assert.ok(EngineLogic.envelopeAmp(0.01, dur) > 0 && EngineLogic.envelopeAmp(0.01, dur) < 0.9);
});
