/* ============================================================
   Sound-Journal — protokolliert jede Wiedergabe
   Reine Logik (testbar): Zeit wird injiziert (Parameter oder __now),
   Speicher via localStorage (in Tests: injizierter Store).
   ============================================================ */

const Journal = (() => {
  const KEY = "frequenz-journal";
  const CAP = 200;               // max. Einträge, älteste fliegen zuerst
  const MIN_MS = 1000;           // kürzere Wiedergaben werden verworfen

  // Zeitquelle: Tests injizieren __now, im Browser gilt Date.now()
  const nowFn = (typeof __now === "function") ? __now : (() => Date.now());

  let active = null;             // { target, mode, freq, pattern, startedAt }

  function load() {
    try {
      const raw = (typeof localStorage !== "undefined") ? localStorage.getItem(KEY) : null;
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function save(entries) {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) { /* Speicher voll etc. */ }
  }

  function finishEntry(when) {
    if (!active) return;
    const durationMs = when - active.startedAt;
    if (durationMs >= MIN_MS) {
      const entries = load();
      entries.unshift({ ...active, durationMs, catches: active.catches || 0 });
      save(entries.slice(0, CAP));
    }
    active = null;
  }

  /* ---------- Öffentliche API ---------- */

  function startEntry(info, when) {
    finishEntry((when !== undefined) ? when : nowFn());
    active = {
      target: String(info.target ?? ""),
      mode: String(info.mode ?? ""),
      freq: Number(info.freq) || 0,
      pattern: String(info.pattern ?? ""),
      startedAt: (when !== undefined) ? when : nowFn()
    };
  }

  function stopActive(when) {
    finishEntry((when !== undefined) ? when : nowFn());
  }

  /* Fangzähler: zählt auf dem aktiven Eintrag (z. B. Fallen-Modus).
     Rückgabe: neue Fangzahl — oder null, wenn nichts läuft. */
  function addCatch() {
    if (!active) return null;
    active.catches = (active.catches || 0) + 1;
    return active.catches;
  }

  function getEntries() {
    return load();               // neueste zuerst (unshift)
  }

  function clear() {
    active = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  /* ---------- Statistik (pure, testbar) ---------- */

  function pad2s(n) { return String(n).padStart(2, "0"); }

  function dayKey(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;   // ortsfester Kalendertag
  }

  /* Letzte 7 Kalendertage inkl. "heute" (nowMs). Tage ohne Fänge = 0. */
  function catchesLast7Days(entries, nowMs) {
    const byDay = new Map();
    for (const e of entries) {
      if (!e.catches) continue;
      const k = dayKey(e.startedAt);
      byDay.set(k, (byDay.get(k) || 0) + (e.catches || 0));
    }
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const ms = nowMs - i * 86_400_000;
      const d = new Date(ms);
      const k = dayKey(ms);
      out.push({ date: `${pad2s(d.getDate())}.${pad2s(d.getMonth() + 1)}.`, catches: byDay.get(k) || 0 });
    }
    return out;
  }

  function stats(nowMs) {
    const entries = load();
    let totalMs = 0;
    const targetCount = new Map();
    const freqCount = new Map();
    for (const e of entries) {
      totalMs += e.durationMs || 0;
      targetCount.set(e.target, (targetCount.get(e.target) || 0) + 1);
      freqCount.set(e.freq, (freqCount.get(e.freq) || 0) + 1);
    }
    // Häufigster gewinnt; Gleichstand: Map erhält Einfügereihenfolge,
    // und Einträge liegen neueste-zuerst im Array -> der neuere Wert gewinnt.
    let topTarget = null, topFreq = null, topCatchMode = null;
    for (const [k, v] of targetCount) if (v === Math.max(...targetCount.values())) { topTarget = k; break; }
    for (const [k, v] of freqCount) if (v === Math.max(...freqCount.values())) { topFreq = k; break; }
    if (entries.length === 0) { topTarget = null; topFreq = null; }

    // Effektivster Modus: Fänge pro Wiedergabemodus summieren.
    // Gleichstand wie oben: neuere Einträge liegen zuerst.
    const modeCatches = new Map();
    for (const e of entries) {
      const c = e.catches || 0;
      if (c > 0) modeCatches.set(e.mode, (modeCatches.get(e.mode) || 0) + c);
    }
    for (const [k, v] of modeCatches) if (v === Math.max(...modeCatches.values())) { topCatchMode = k; break; }

    return { totalMs, topTarget, topFreq, topCatchMode, catchesPerDay: catchesLast7Days(entries, (nowMs !== undefined) ? nowMs : nowFn()) };
  }

  /* ---------- CSV ---------- */

  function csvCell(v) {
    const s = String(v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function pad2(n) { return String(n).padStart(2, "0"); }

  function fmtDateTime(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
           `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function fmtDur(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h}:${pad2(m)}:${pad2(sec)}`;
  }

  function toCSV() {
    const rows = ["Startzeit;Ziel;Modus;Frequenz (Hz);Wiedergabeart;Dauer;Gefangen"];
    for (const e of getEntries()) {
      rows.push([
        csvCell(fmtDateTime(e.startedAt)),
        csvCell(e.target),
        csvCell(e.mode),
        csvCell(e.freq),
        csvCell(e.pattern),
        csvCell(fmtDur(e.durationMs)),
        csvCell(e.catches ?? 0)
      ].join(";"));
    }
    return "\uFEFF" + rows.join("\r\n");
  }

  return { startEntry, stopActive, addCatch, getEntries, clear, toCSV, stats };
})();
