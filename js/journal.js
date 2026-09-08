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

  return { startEntry, stopActive, addCatch, getEntries, clear, toCSV };
})();
