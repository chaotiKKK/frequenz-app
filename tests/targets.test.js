"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadAppScript } = require("./helpers/load.js");

const { TARGETS, HEARING_RANGES } = loadAppScript("js/targets.js", {}, "{ TARGETS, HEARING_RANGES }");

const F_MIN = 20, F_MAX = 48000;

test("jedes Ziel hat id, icon, name, sub und info", () => {
  for (const t of TARGETS) {
    assert.ok(t.id && typeof t.id === "string", `id fehlt bei ${JSON.stringify(t).slice(0, 40)}`);
    assert.ok(t.icon, `${t.id}: icon fehlt`);
    assert.ok(t.name, `${t.id}: name fehlt`);
    assert.ok(t.sub, `${t.id}: sub fehlt`);
    assert.ok(t.info && t.info.hear && Array.isArray(t.info.facts), `${t.id}: info unvollständig`);
  }
});

test("alle Preset-Frequenzen liegen im erzeugbaren Bereich 20 Hz – 48 kHz", () => {
  for (const t of TARGETS) {
    for (const mode of ["repel", "enrich"]) {
      const m = t[mode];
      if (!m) continue;
      assert.ok(Array.isArray(m.freqs) && m.freqs.length > 0, `${t.id}.${mode}: keine Frequenzen`);
      for (const f of m.freqs) {
        assert.ok(f >= F_MIN && f <= F_MAX, `${t.id}.${mode}: ${f} Hz außerhalb des Bereichs`);
      }
    }
  }
});

test("Stechmücken haben einen Anlock-Modus (Bereichern), Fliegen nicht", () => {
  const muecken = TARGETS.find(t => t.id === "muecken");
  assert.ok(muecken, "Ziel muecken fehlt");
  assert.ok(muecken.enrich, "muecken: enrich-Modus fehlt");
  assert.ok(muecken.enrich.label.includes("Anlocken"), "muecken: Anlock-Label fehlt");

  const fliegen = TARGETS.find(t => t.id === "fliegen");
  assert.ok(fliegen, "Ziel fliegen fehlt");
  assert.equal(fliegen.enrich, null, "fliegen: enrich sollte null sein");
});

test("jedes Ziel mit beiden Modi hat für jeden Modus einen desc-Text", () => {
  for (const t of TARGETS) {
    for (const mode of ["repel", "enrich"]) {
      if (t[mode]) assert.ok(t[mode].desc, `${t.id}.${mode}: desc fehlt`);
    }
  }
});

test("Hörbereiche: vier Arten, plausible Grenzen, Farben gesetzt", () => {
  assert.equal(HEARING_RANGES.length, 4, "vier Hörbereiche erwartet");
  for (const r of HEARING_RANGES) {
    assert.ok(r.label, "label fehlt");
    assert.ok(r.color && /^#[0-9A-Fa-f]{6}$/.test(r.color), `Farbe fehlt/ungültig bei ${r.label}`);
    assert.ok(r.from < r.to, `from >= to bei ${r.label}`);
    assert.ok(r.from >= F_MIN / 10 && r.to <= F_MAX, `${r.label}: Grenzen unplausibel`);
  }
});

test("Mensch-Hörbereich deckt hörbare Presets ab, Mücken-Band enthält den Lockton", () => {
  const mensch = HEARING_RANGES.find(r => r.label === "Mensch");
  assert.ok(mensch, "Mensch-Band fehlt");
  assert.ok(mensch.from <= 20 && mensch.to >= 18000, "Mensch-Band deckt 20 Hz – 18 kHz nicht ab");

  const insekt = HEARING_RANGES.find(r => r.label.startsWith("Insekt"));
  assert.ok(insekt, "Insekt-Band fehlt");
  // Weibchen-Flugton 400–600 Hz muss im Mücken-Band liegen (Anlock-Modus)
  assert.ok(insekt.from <= 400 && insekt.to >= 600, "Mücken-Band enthält den Lockton nicht");
});
