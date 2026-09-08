"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadAppScript } = require("./helpers/load.js");

const app = loadAppScript("js/app.js", {
  TARGETS: [],
  AudioEngine: { isLocked: () => false, isPlaying: () => false }
}, "{ hzText, hzLabel, fFromSlider, fToSlider, audibleToHumans, fmtHMS, trapTitle, duetFreqs }");
const { hzText, hzLabel, fFromSlider, fToSlider, audibleToHumans, fmtHMS, trapTitle, duetFreqs } = app;

test("hzText formatiert Frequenzen mit deutschem Tausendertrennzeichen", () => {
  // de-DE nutzt den PUNKT als Tausendertrennzeichen (DIN 5008): "1.000"
  assert.equal(hzText(440), "440");
  assert.equal(hzText(999), "999");
  assert.equal(hzText(1000), "1.000");
  assert.equal(hzText(20075), "20.075");
  assert.equal(hzText(48000), "48.000");
});

test("hzLabel wählt automatisch Hz- oder kHz-Einheit", () => {
  assert.equal(hzLabel(440), "440 Hz");
  assert.equal(hzLabel(999), "999 Hz");
  assert.equal(hzLabel(1000), "1 kHz");
  assert.equal(hzLabel(1500), "1.5 kHz");
  assert.equal(hzLabel(20000), "20 kHz");
  assert.equal(hzLabel(48000), "48 kHz");
});

test("Slider-Mapping ist logarithmisch und kehrt sich innerhalb 0,5 % zurück", () => {
  // Ganzzahlige Slider-Schritte (1000 über 3,4 Dekaden) quantisieren mit
  // max. ~0,4 % (halber Schritt); Endpunkte sind exakt (siehe nächster Test).
  for (const f of [20, 110, 440, 1000, 4400, 20000, 48000]) {
    const back = fFromSlider(fToSlider(f));
    const err = Math.abs(back - f) / f;
    assert.ok(err < 0.005, `${f} Hz: Rundtrip-Abweichung ${ (err * 100).toFixed(3) } %`);
  }
});

test("Slider-Enden liefern exakt 20 Hz und 48 kHz", () => {
  assert.equal(fFromSlider(0), 20);
  assert.equal(fFromSlider(1000), 48000);
});

test("audibleToHumans grenzt bei 18 kHz", () => {
  assert.equal(audibleToHumans(440), true);
  assert.equal(audibleToHumans(18000), true);
  assert.equal(audibleToHumans(18001), false);
  assert.equal(audibleToHumans(40000), false);
});

test("fmtHMS formatiert Countdown mit Stundenauffüllung und Aufrundung", () => {
  assert.equal(fmtHMS(3600_000), "1:00:00");
  assert.equal(fmtHMS(3661_000), "1:01:01");
  assert.equal(fmtHMS(500), "0:00:01");        // aufrunden
  assert.equal(fmtHMS(-5), "0:00:00");         // nie negativ
});

test("trapTitle hängt Fallen-Suffix an die Restzeit", () => {
  assert.equal(trapTitle(3_661_000), "1:01:01 – Falle");
  assert.equal(trapTitle(59_500), "0:01:00 – Falle");
  assert.equal(trapTitle(-1), "0:00:00 – Falle");   // nie negativ
});

test("duetFreqs bildet das Männchen-Intervall 1,25× ab", () => {
  // [...spread]: vm-Realm liefert vm-Arrays — Vergleich über Host-Kopie
  assert.deepEqual([...duetFreqs(480)], [480, 600]);
  assert.deepEqual([...duetFreqs(400)], [400, 500]);
  const [a, b] = duetFreqs(555);
  assert.ok(a < b, "Basis zuerst, dann Männchenton");
  assert.equal(Math.round(b), Math.round(a * 1.25));
});
