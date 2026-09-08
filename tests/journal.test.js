"use strict";
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadAppScript } = require("./helpers/load.js");

/* Memory-Store statt localStorage (Dependency Injection, kein Mocking nötig) */
function makeStore() {
  const data = new Map();
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k)
  };
}

/* TON: feste Zeitquelle, damit Dauern deterministisch sind */
function makeClock(start = 1_000_000) {
  let now = start;
  return {
    now: () => now,
    advance: ms => { now += ms; }
  };
}

function makeJournal(store, clock) {
  return loadAppScript("js/journal.js", {
    localStorage: store,
    performance: { now: () => clock.now() },
    Date,
    __now: () => clock.now()
  }, "({ Journal })").Journal;
}

beforeEach(() => {});

test("startEntry + stopActive erzeugt einen vollständigen Eintrag mit Dauer", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store,
    __now: () => clock.now()
  }, "({ Journal })");

  const t0 = 1_700_000_000_000;
  clock.now = () => t0;
  Journal.startEntry({ target: "hunde", mode: "repel", freq: 22000, pattern: "sweep" }, t0);
  clock.now = () => t0 + 65_000;               // 1:05 gespielt
  Journal.stopActive(t0 + 65_000);

  const entries = Journal.getEntries();
  assert.equal(entries.length, 1);
  const e = entries[0];
  assert.equal(e.target, "hunde");
  assert.equal(e.mode, "repel");
  assert.equal(e.freq, 22000);
  assert.equal(e.pattern, "sweep");
  assert.equal(e.durationMs, 65_000);
  assert.ok(e.startedAt === t0 || e.startedAt === new Date(t0).toISOString() || e.startedAt instanceof Date || typeof e.startedAt === "number",
    "startedAt sollte Zeitstempel sein");
});

test("Kurz playback unter 1 Sekunde wird verworfen", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store,
    __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;

  Journal.startEntry({ target: "tauben", mode: "repel", freq: 3000, pattern: "chirp" }, t0);
  Journal.stopActive(t0 + 400);                // 0,4 s -> weg
  assert.equal(Journal.getEntries().length, 0);

  Journal.startEntry({ target: "tauben", mode: "repel", freq: 3000, pattern: "chirp" }, t0);
  Journal.stopActive(t0 + 1000);               // exakt 1 s -> bleibt
  assert.equal(Journal.getEntries().length, 1);
});

test("stopActive ohne laufenden Eintrag ist ein No-op", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store,
    __now: () => clock.now()
  }, "({ Journal })");
  assert.doesNotThrow(() => Journal.stopActive(1_700_000_000_000));
  assert.equal(Journal.getEntries().length, 0);
});

test("neuer startEntry schließt den laufenden Eintrag automatisch ab", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store,
    __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;

  Journal.startEntry({ target: "hunde", mode: "repel", freq: 22000, pattern: "sweep" }, t0);
  Journal.startEntry({ target: "pflanzen", mode: "enrich", freq: 432, pattern: "chord" }, t0 + 30_000);
  const entries = Journal.getEntries();
  assert.equal(entries.length, 1, "erster Eintrag sollte durch zweiten Start abgeschlossen sein");
  assert.equal(entries[0].durationMs, 30_000);

  Journal.stopActive(t0 + 90_000);             // zweiten Eintrag beenden
  assert.equal(Journal.getEntries().length, 2);
  assert.equal(Journal.getEntries()[0].durationMs, 60_000);   // neuester zuerst
});

test("Journal speichert max. 200 Einträge, älteste fliegen zuerst", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store,
    __now: () => clock.now()
  }, "({ Journal })");
  let t = 1_700_000_000_000;
  for (let i = 0; i < 205; i++) {
    Journal.startEntry({ target: "tauben", mode: "repel", freq: 100 + i, pattern: "constant" }, t);
    t += 2000;
    Journal.stopActive(t);
    t += 1000;
  }
  const entries = Journal.getEntries();
  assert.equal(entries.length, 200);
  assert.equal(entries[0].freq, 304, "neuester (i=204) zuerst");       // 100+204
  assert.equal(entries[199].freq, 105, "ältester behaltener (i=5)");   // 100+5
});

test("Persistenz: Einträge überleben ein neues Journal-Objekt (Reload-Simulation)", () => {
  const clock = makeClock();
  const store = makeStore();
  const t0 = 1_700_000_000_000;
  {
    const { Journal } = loadAppScript("js/journal.js", {
      localStorage: store, __now: () => clock.now()
    }, "({ Journal })");
    Journal.startEntry({ target: "muecken", mode: "enrich", freq: 480, pattern: "constant" }, t0);
    Journal.stopActive(t0 + 5000);
  }
  {   // "Reload": frisches Modul, gleicher Store
    const { Journal } = loadAppScript("js/journal.js", {
      localStorage: store, __now: () => clock.now()
    }, "({ Journal })");
    const entries = Journal.getEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].target, "muecken");
    assert.equal(entries[0].freq, 480);
  }
});

test("clear entfernt alles (auch im Store)", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;
  Journal.startEntry({ target: "hunde", mode: "repel", freq: 22000, pattern: "sweep" }, t0);
  Journal.stopActive(t0 + 5000);
  assert.equal(Journal.getEntries().length, 1);
  Journal.clear();
  assert.equal(Journal.getEntries().length, 0);

  const { Journal: J2 } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  assert.equal(J2.getEntries().length, 0, "auch nach Reload leer");
});

test("addCatch zählt auf dem aktiven Eintrag und landet im CSV", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;
  Journal.startEntry({ target: "muecken", mode: "trap", freq: 480, pattern: "constant" }, t0);
  assert.equal(Journal.addCatch(), 1);
  assert.equal(Journal.addCatch(), 2);
  assert.equal(Journal.addCatch(), 3);
  Journal.stopActive(t0 + 60_000);
  const e = Journal.getEntries()[0];
  assert.equal(e.catches, 3, "Eintrag sollte 3 Fänge enthalten");
  const cells = Journal.toCSV().split(/\r?\n/).filter(Boolean)[1].split(";");
  assert.equal(cells[6], "3", "CSV-Spalte 'Gefangen' sollte 3 enthalten");
});

test("addCatch ohne aktiven Eintrag liefert null (No-op)", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  assert.equal(Journal.addCatch(), null);
  assert.equal(Journal.getEntries().length, 0);
});

test("toCSV: Kopfzeile, Semikolon, BOM, Dauer als hh:mm:ss", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;   // Di., 14.11.2023 22:13:20 UTC
  Journal.startEntry({ target: "hunde", mode: "repel", freq: 22000, pattern: "sweep" }, t0);
  Journal.stopActive(t0 + 3661_000);            // 1:01:01

  const csv = Journal.toCSV();
  assert.ok(csv.startsWith("\uFEFF"), "UTF-8-BOM fehlt");
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  assert.equal(lines[0], "Startzeit;Ziel;Modus;Frequenz (Hz);Wiedergabeart;Dauer;Gefangen");
  const cells = lines[1].split(";");
  assert.equal(cells.length, 7);
  assert.ok(cells[0].length >= 16, "Startzeit sollte Datum+Uhrzeit enthalten");
  assert.equal(cells[1], "hunde");
  assert.equal(cells[2], "repel");
  assert.equal(cells[3], "22000");
  assert.equal(cells[4], "sweep");
  assert.equal(cells[5], "1:01:01");
  assert.equal(cells[6], "0", "ohne Fänge sollte 'Gefangen' 0 sein");
});

test("toCSV maskiert Semikolons in Feldwerten", () => {
  const clock = makeClock();
  const store = makeStore();
  const { Journal } = loadAppScript("js/journal.js", {
    localStorage: store, __now: () => clock.now()
  }, "({ Journal })");
  const t0 = 1_700_000_000_000;
  Journal.startEntry({ target: "ei;sel", mode: "repel", freq: 100, pattern: "constant" }, t0);
  Journal.stopActive(t0 + 2000);
  const line = Journal.toCSV().split(/\r?\n/).filter(Boolean)[1];
  assert.ok(line.includes('"ei;sel"'), "Semikolon-Feld sollte in Anführungszeichen stehen");
});
