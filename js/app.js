/* ============================================================
   App-Logik — UI-Verkabelung, Sicherheit, Timer
   ============================================================ */

const $ = id => document.getElementById(id);

/* ---------- Hilfsfunktionen ---------- */

function hzText(f) {
  return Math.round(f).toLocaleString("de-DE");   // z. B. "20 100"
}
function hzLabel(f) {                             // z. B. "20 kHz" / "440 Hz"
  if (f >= 1000) return (f / 1000).toFixed(f >= 10000 ? 1 : 2).replace(/\.?0+$/, "") + " kHz";
  return Math.round(f) + " Hz";
}
function fFromSlider(v) { return Math.round(20 * Math.pow(2400, v / 1000)); }   // 20 Hz – 48 kHz
function fToSlider(f)   { return Math.round(1000 * Math.log(f / 20) / Math.log(2400)); }

function audibleToHumans(f) { return f <= 18000; }

/* Tab-Titel für Fallen-Countdown (Restzeit + Suffix) */
function trapTitle(ms) {
  return fmtHMS(ms) + " – Falle";
}

/* Duett: Männchen singt ~1,25× höher als das Weibchen
   (Harmonic-Convergence-Band); Rückgabe [weiblich, männlich]. */
function duetFreqs(f) {
  return [f, Math.round(f * 1.25)];
}

/* ---------- Lern-Modus (reine Helfer) ---------- */

/* Sweep-Trajektorie: linear von f0 nach f1, t in [0,1], geklemmt. */
function sweepFreqAt(f0, f1, t) {
  const k = Math.max(0, Math.min(1, t));
  return Math.round(f0 + (f1 - f0) * k);
}

/* Wer kann die Frequenz gerade hören?
   Rückgabe: Array von Arten-Keys ("mensch", "hund", "vogel", "insekt"). */
function hearersAt(f) {
  const KEY = {
    "Mensch": "mensch",
    "Hund": "hund",
    "Vogel (Sittich)": "vogel",
    "Insekt (Mücke)": "insekt"
  };
  const out = [];
  for (const r of HEARING_RANGES) {
    if (f >= r.from && f <= r.to && KEY[r.label]) out.push(KEY[r.label]);
  }
  return out;
}

/* Lern-Demos: langsame Sweeps durch die Hörbereiche */
const LEARN_DEMOS = {
  mensch:  { f0: 20,    f1: 18000, dur: 6,  label: "Mensch" },
  hund:    { f0: 40,    f1: 45000, dur: 7,  label: "Hund" },
  vogel:   { f0: 200,   f1: 8500,  dur: 6,  label: "Vogel" },
  insekt:  { f0: 150,   f1: 800,   dur: 6,  label: "Mücke" },
  tour:    { f0: 20,    f1: 48000, dur: 14, label: "Hör-Tour" }
};
let learnTimer = null;          // Intervall der laufenden Demo

const HEARER_LABELS = {
  mensch: "🧑 du", hund: "🐕 Hund", vogel: "🦜 Vogel", insekt: "🦟 Mücke"
};

function learnComment(f) {
  const who = hearersAt(f);
  const names = who.map(k => HEARER_LABELS[k]).join(" · ");
  const silent = f > 18000 ? " 🤫 für dich gerade lautlos!" : "";
  return `🔊 ${hzLabel(f)} — hören: ${names || "niemand (über allen Bereichen)"}${silent}`;
}

function stopLearnDemo(silent) {
  if (learnTimer) { clearInterval(learnTimer); learnTimer = null; }
  document.querySelectorAll(".learn-btn").forEach(b => b.classList.remove("sel"));
  if (!silent) {
    Journal.stopActive();
    AudioEngine.stopAll();
    markPlaying(false);
    $("learnNote").classList.remove("learn-active");
    $("learnNote").textContent = "Demo beendet. Nächste?";
    renderJournal();
  }
}

function startLearnDemo(key) {
  if (AudioEngine.isLocked()) return;
  const d = LEARN_DEMOS[key];
  if (!d) return;
  stopLearnDemo(true);                       // evtl. laufende Demo/Regular-Wiedergabe beenden
  Journal.stopActive();
  AudioEngine.stopAll();
  if (trapHandle) { cancelTrap(); markPlaying(false); }

  AudioEngine.setWave("sine");
  AudioEngine.setVolume(+$("vol").value);
  if (!AudioEngine.play(d.f0, "constant")) return;
  Journal.startEntry({ target: "lernen", mode: "lernen", freq: d.f0, pattern: "demo" });
  markPlaying(true);

  document.querySelectorAll(".learn-btn").forEach(b =>
    b.classList.toggle("sel", b.dataset.demo === key));
  $("learnNote").classList.add("learn-active");

  const t0 = Date.now();
  learnTimer = setInterval(() => {
    if (!AudioEngine.isPlaying()) { stopLearnDemo(); return; }
    const t = (Date.now() - t0) / (d.dur * 1000);
    const f = sweepFreqAt(d.f0, d.f1, t);
    AudioEngine.setFreq(f);
    $("learnNote").textContent = learnComment(f);
    if (t >= 1) {
      AudioEngine.chime();
      stopLearnDemo();
      $("learnNote").textContent = `🎓 ${d.label}-Demo fertig — ${hzLabel(d.f1)} erreicht.`;
    }
  }, 120);
}

/* ---------- Zustand ---------- */

let curTarget = null;
let curMode = "repel";          // repel | enrich
let timerMin = 0;
let timerHandle = null;
let freqOverride = null;        // wenn Preset/Slider bewegt wurde

/* Fallen-Modus-Zustand */
let trapMin = 60;               // gewählte Fallen-Laufzeit in Minuten
let trapEnd = 0;                // Endzeitstempel des laufenden Countdowns
let trapHandle = null;          // setTimeout für Fallen-Ablauf
let trapTick = null;            // Countdown-Intervall
let wakeLock = null;            // Screen Wake Lock während des Fallenlaufs
const BASE_TITLE = "Frequenz-App — Töne für Tiere, Insekten & Pflanzen";

/* ---------- Wake Lock ---------- */

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
      $("wakeStatus").textContent = "🌙 Display wach gehalten (Wake Lock aktiv).";
    } else {
      $("wakeStatus").textContent = "Wake Lock von diesem Browser nicht unterstützt.";
    }
  } catch (e) {
    $("wakeStatus").textContent = "Wake Lock nicht verfügbar (" + e.name + ").";
  }
}

function releaseWakeLock() {
  try { wakeLock && wakeLock.release(); } catch (e) {}
  wakeLock = null;
  $("wakeStatus").textContent = "";
}

document.addEventListener("visibilitychange", () => {
  // Nach Tab-Rückkehr Wake Lock erneuern, solange die Falle läuft
  if (document.visibilityState === "visible" && trapHandle) requestWakeLock();
});

/* ---------- Kacheln aufbauen ---------- */

function buildTiles() {
  const wrap = $("targets");
  TARGETS.forEach(t => {
    const el = document.createElement("button");
    el.className = "tile";
    el.type = "button";
    el.dataset.target = t.id;
    el.innerHTML =
      `<span class="tile-icon">${t.icon}</span>` +
      `<span class="tile-name">${t.name}</span>` +
      `<span class="tile-sub">${t.sub}</span>`;
    el.addEventListener("click", () => selectTarget(t.id));
    wrap.appendChild(el);
  });
}

/* ---------- Ziel & Modus ---------- */

function selectTarget(id) {
  if (AudioEngine.isLocked()) return;
  const t = TARGETS.find(x => x.id === id);
  if (!t) return;
  // Laufende Falle abbrechen, wenn eine andere Kachel gewählt wird
  if (id !== "muecken" && trapHandle) {
    Journal.stopActive();
    AudioEngine.stopAll();
    markPlaying(false);
    cancelTrap();
    renderJournal();
  }
  curTarget = t;
  curMode = t.repel ? "repel" : "enrich";   // Materialien/Wohl-Kacheln starten im Enrich
  freqOverride = null;
  renderTarget();
}

function setMode(m) {
  if (!curTarget) return;
  curMode = m;
  freqOverride = null;
  renderTarget();
}

function renderTarget() {
  const t = curTarget;
  document.querySelectorAll(".tile").forEach(el =>
    el.classList.toggle("sel", !!t && el.dataset.target === t.id));

  // Fallen-Sektion nur bei Mücken zeigen
  $("trapSection").classList.toggle("hidden", !t || t.id !== "muecken");

  // Ziel ohne Enrich-Modus (Fliegen) -> repel erzwingen;
  // Ziel ohne Repel (Materialien, Küken, Tomate) -> enrich erzwingen
  if (t && !t.enrich && curMode === "enrich") curMode = "repel";
  if (t && !t.repel && curMode === "repel") curMode = "enrich";

  $("panelTitle").textContent = t ? `${t.icon} ${t.name}` : "Ziel wählen";

  // Modus-Buttons
  document.querySelectorAll("#modeBtns button").forEach(b => {
    const has = t && (b.dataset.mode === "repel" ? t.repel : t.enrich);
    b.disabled = !t || !has;
    b.classList.toggle("sel", !!t && b.dataset.mode === curMode);
  });

  const badge = $("modeBadge");
  if (t) {
    const m = t[curMode];
    badge.textContent = m.label;
    badge.className = "badge " + (curMode === "repel" ? "rep" : "enr");
  } else {
    badge.classList.add("hidden");
    $("presetChips").innerHTML = "";
    $("infoBody").innerHTML = '<p class="hint">Erst eine Kachel wählen, dann hier Infos &amp; Studien-Hinweise.</p>';
    return;
  }

  const m = t[curMode];

  // Presets
  const chips = $("presetChips");
  chips.innerHTML = "";
  m.freqs.forEach(f => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = hzLabel(f);
    b.addEventListener("click", () => {
      freqOverride = f;
      $("freq").value = fToSlider(f);
      updateHzDisplay();
      if (AudioEngine.isPlaying()) AudioEngine.setFreq(f);
    });
    chips.appendChild(b);
  });

  // ersten Preset-Wert übernehmen, wenn kein Override
  if (freqOverride === null && m.freqs.length) {
    $("freq").value = fToSlider(m.freqs[0]);
  }
  updateHzDisplay();

  // Info-Box
  const i = t.info;
  $("infoBody").innerHTML =
    `<h3>👂 Hörbereich</h3><p>${i.hear}</p>` +
    `<h3>🧪 Fakten</h3><ul>${i.facts.map(x => `<li>${x}</li>`).join("")}</ul>` +
    (i.disc ? `<div class="disc">⚠️ ${i.disc}</div>` : "");
}

/* ---------- Frequenz-Anzeige ---------- */

function currentFrequency() {
  if (freqOverride !== null) return freqOverride;
  return fFromSlider(+$("freq").value);
}

function updateHzDisplay() {
  const f = currentFrequency();
  $("hzDisplay").textContent = hzText(f);
  const hum = audibleToHumans(f);
  $("hzNote").textContent = !curTarget ? "—" :
    hum
      ? `🎧 ${hzLabel(f)} — für Menschen hörbar (Grenze ~18 kHz, Handys oft schon bei 15 kHz Schluss).`
      : `🤫 ${hzLabel(f)} — Ultraschall: Menschen hören das nicht. Hunde/Katzen/Nager aber sehr wohl!`;
}

/* ---------- Wiedergabe ---------- */

function startPlaying() {
  if (AudioEngine.isLocked()) return;
  if (!curTarget) { flashPanelTitle(); return; }
  if (trapHandle) cancelTrap();   // laufende Falle abbrechen — eine Audio-Quelle zur Zeit
  stopLearnDemo(true);            // laufende Demo stoppen — keine Frequenz-Übernahme
  const f = currentFrequency();
  const pat = $("pattern").value;

  if (f > 18000 && $("chkConfirm").checked) {
    if (!confirm(
      `Ultraschall ${hzText(f)} Hz\n\n` +
      `Menschen hören diesen Ton nicht — Hunde, Katzen und Nager schon!\n` +
      `Bitte keine anwesenden Tiere dauerhaft beschallen.\n\nTrotzdem fortfahren?`
    )) return;
  }

  AudioEngine.setWave($("wave").value);
  AudioEngine.setVolume(+$("vol").value);
  const ok = AudioEngine.play(f, pat);
  if (ok) {
    Journal.startEntry({ target: curTarget.id, mode: curMode, freq: f, pattern: pat });
    markPlaying(true);
    armTimer();
  }
}

function stopPlaying() {
  Journal.stopActive();
  AudioEngine.stopAll();
  markPlaying(false);
  stopTimer();
  stopLearnDemo(true);
  releaseWakeLock();
  document.title = BASE_TITLE;
  if (trapHandle) {
    cancelTrap();
    $("trapStatus").textContent = "Falle manuell gestoppt.";
  }
  renderJournal();
}

/* ---------- Fallen-Modus ---------- */

function fmtHMS(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function startTrap(min) {
  if (AudioEngine.isLocked()) return;
  if (!curTarget || curTarget.id !== "muecken") return;

  const f = currentFrequency();
  if (f < 300 || f > 700) {
    // außerhalb des Lock-Bereichs: auf 480 Hz (Mid-Band) zurückfallen
    freqOverride = 480;
    $("freq").value = fToSlider(480);
    updateHzDisplay();
  }

  AudioEngine.setWave("sine");
  AudioEngine.setVolume(+$("vol").value);
  stopLearnDemo(true);              // laufende Demo stoppen — keine Frequenz-Übernahme
  const duet = $("chkDuet").checked;
  const started = duet
    ? AudioEngine.playDuet(currentFrequency())
    : AudioEngine.play(currentFrequency(), "constant");
  if (!started) return;

  Journal.startEntry({ target: "muecken", mode: "trap", freq: currentFrequency(), pattern: duet ? "duet" : "constant" });
  $("trapCatchCount").textContent = "0";   // Zähler pro Lauf zurücksetzen
  markPlaying(true);
  requestWakeLock();
  stopTimer();                      // normalen Auto-Stopp aussetzen
  $("timerInfo").textContent = "— Fallen-Modus aktiv (eigener Countdown)";

  cancelTrap();                     // evtl. laufenden Countdown entfernen
  trapEnd = Date.now() + min * 60000;
  trapHandle = setTimeout(() => {
    Journal.stopActive();
    AudioEngine.stopAll();
    markPlaying(false);
    trapHandle = null;
    clearInterval(trapTick);
    AudioEngine.chime();                  // kurzer End-Piep
    releaseWakeLock();
    document.title = BASE_TITLE;
    $("trapCount").classList.add("done");
    $("trapStatus").textContent = "⏹️ Falle beendet — Laufzeit abgelaufen.";
    renderJournal();
  }, min * 60000);
  trapTick = setInterval(() => {
    if (!AudioEngine.isPlaying() && !trapHandle) { clearInterval(trapTick); return; }
    const left = trapEnd - Date.now();
    $("trapCount").textContent = fmtHMS(left);
    document.title = trapTitle(left);     // Restzeit auch im Tab sichtbar
  }, 500);
  $("trapCount").classList.remove("done");
  $("trapStatus").textContent = `🦟 Falle läuft — ${hzLabel(currentFrequency())}, Laufzeit ${min >= 60 ? (min/60) + " h" : min + " min"}.`;
}

function cancelTrap() {
  if (trapHandle) { clearTimeout(trapHandle); trapHandle = null; }
  if (trapTick) { clearInterval(trapTick); trapTick = null; }
  const c = $("trapCount");
  c.classList.remove("done");
  c.textContent = fmtHMS(trapMin * 60000);
  $("trapStatus").textContent = "Falle bereit — Laufzeit wählen und starten.";
}

function markPlaying(on) {
  document.querySelectorAll(".tile").forEach(el =>
    el.classList.toggle("playing", on && curTarget && el.dataset.target === curTarget.id));
  $("btnPlay").classList.toggle("on", on);
  $("btnPlay").textContent = on ? "▶ läuft …" : "▶ Ton starten";
}

function flashPanelTitle() {
  const el = $("panelTitle");
  el.style.color = "var(--warn)";
  setTimeout(() => { el.style.color = ""; }, 900);
}

/* ---------- Auto-Stopp-Timer ---------- */

function stopTimer() {
  if (timerHandle) { clearTimeout(timerHandle); timerHandle = null; }
  $("timerInfo").textContent = timerMin
    ? "Timer läuft nicht (Ton gestoppt)"
    : "Kein Auto-Stopp aktiv";
}

function armTimer() {
  if (timerHandle) { clearTimeout(timerHandle); timerHandle = null; }
  if (!timerMin) { $("timerInfo").textContent = "Kein Auto-Stopp aktiv"; return; }
  const end = Date.now() + timerMin * 60000;
  timerHandle = setTimeout(() => {
    stopPlaying();
    $("timerInfo").textContent = "⏹️ Auto-Stopp ausgelöst";
  }, timerMin * 60000);
  const tick = setInterval(() => {
    const left = end - Date.now();
    if (left <= 0 || !AudioEngine.isPlaying()) { clearInterval(tick); return; }
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    $("timerInfo").textContent = `⏳ Auto-Stopp in ${m}:${String(s).padStart(2, "0")} min`;
  }, 500);
}

/* ---------- Sound-Journal (UI) ---------- */

const MODE_LABELS = {
  repel: "Abwehren", enrich: "Bereichern", trap: "Fallen-Modus"
};

function renderJournal() {
  const entries = Journal.getEntries();
  $("journalCount").textContent = entries.length + " Einträge";
  $("journalEmpty").classList.toggle("hidden", entries.length > 0);
  $("journalWrap").classList.toggle("hidden", entries.length === 0);
  renderJournalStats();
  const body = $("journalBody");
  body.innerHTML = "";
  const max = 50;               // Tabelle zeigt die 50 neuesten; CSV alles
  for (const e of entries.slice(0, max)) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td class="j-time">${journalTime(e.startedAt)}</td>` +
      `<td>${journalIcon(e.target)} ${e.target}</td>` +
      `<td>${MODE_LABELS[e.mode] || e.mode}</td>` +
      `<td class="j-hz">${hzLabel(e.freq)}</td>` +
      `<td>${journalPattern(e.pattern)}</td>` +
      `<td class="j-hz">${fmtHMS(e.durationMs)}</td>`;
    body.appendChild(tr);
  }
}

function renderJournalStats() {
  const s = Journal.stats();
  const box = $("journalStats");
  const empty = Journal.getEntries().length === 0;
  box.classList.toggle("hidden", empty);
  if (empty) return;
  $("statTotal").textContent = fmtHMS(s.totalMs);
  const t = TARGETS.find(x => x.id === s.topTarget);
  $("statTopTarget").textContent = t ? `${t.icon} ${t.name}` : "—";
  $("statTopFreq").textContent = (s.topFreq !== null) ? hzLabel(s.topFreq) : "—";
  const bars = $("statBars");
  bars.innerHTML = "";
  const maxC = Math.max(1, ...s.catchesPerDay.map(d => d.catches));
  for (const d of s.catchesPerDay) {
    const wrap = document.createElement("span");
    wrap.className = "stat-bar";
    const num = document.createElement("span");
    num.className = "stat-bar-num";
    num.textContent = d.catches || "";
    const fill = document.createElement("span");
    fill.className = "stat-bar-fill";
    fill.style.height = Math.round((d.catches / maxC) * 30) + "px";  // max 30 px Balken
    const label = document.createElement("span");
    label.className = "stat-bar-label";
    label.textContent = d.date.slice(0, -1);                          // "09.09" statt "09.09."
    wrap.append(num, fill, label);
    bars.appendChild(wrap);
  }
}

function journalTime(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}. ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function journalIcon(targetId) {
  const t = TARGETS.find(x => x.id === targetId);
  return t ? t.icon : "🎵";
}

function journalPattern(p) {
  return { constant: "Dauerton", sweep: "Sweep", chirp: "Chirps", chord: "Akkord" }[p] || p;
}

function exportJournalCsv() {
  const csv = Journal.toCSV();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  a.href = URL.createObjectURL(blob);
  a.download = `frequenz-journal-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function clearJournalWithConfirm() {
  if (!confirm("Alle Journal-Einträge löschen?")) return;
  Journal.clear();
  renderJournal();
}

/* ---------- Not-Aus ---------- */

function triggerEstop() {
  Journal.stopActive();
  AudioEngine.emergencyStop();
  markPlaying(false);
  stopTimer();
  stopLearnDemo(true);            // Demo-Intervall SOFORT räumen (nicht erst beim nächsten Tick)
  releaseWakeLock();
  document.title = BASE_TITLE;
  cancelTrap();                   // auch den Fallen-Countdown räumen
  $("lockBanner").classList.remove("hidden");
  renderJournal();
}

function unlockApp() {
  AudioEngine.unlock();
  $("lockBanner").classList.add("hidden");
}

/* ---------- Events ---------- */

function wire() {
  buildTiles();

  $("btnPlay").addEventListener("click", startPlaying);
  $("btnStop").addEventListener("click", stopPlaying);
  $("btnEstop").addEventListener("click", triggerEstop);
  $("btnUnlock").addEventListener("click", unlockApp);

  // Repel/Enrich-Buttons
  document.querySelectorAll("#modeBtns button").forEach(b =>
    b.addEventListener("click", () => setMode(b.dataset.mode)));

  $("freq").addEventListener("input", () => {
    freqOverride = null;
    updateHzDisplay();
    if (AudioEngine.isPlaying()) AudioEngine.setFreq(currentFrequency());
  });
  $("vol").addEventListener("input", e => {
    AudioEngine.setVolume(+e.target.value);
    $("volWarn").hidden = +e.target.value < 80;
  });
  $("wave").addEventListener("change", e => AudioEngine.setWave(e.target.value));
  $("pattern").addEventListener("change", () => {
    if (AudioEngine.isPlaying()) startPlaying();
  });

  $("timerChips").addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    document.querySelectorAll("#timerChips .chip").forEach(c => c.classList.remove("sel"));
    b.classList.add("sel");
    timerMin = +b.dataset.min;
    if (AudioEngine.isPlaying()) armTimer(); else stopTimer();
  });

  // --- Fallen-Modus ---
  $("btnTrapStart").addEventListener("click", () => startTrap(trapMin));
  $("btnTrapStop").addEventListener("click", stopPlaying);
  $("btnTrapCatch").addEventListener("click", () => {
    const n = Journal.addCatch();
    if (n !== null) $("trapCatchCount").textContent = String(n);
  });
  $("trapChips").addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    document.querySelectorAll("#trapChips .chip").forEach(c => c.classList.remove("sel"));
    b.classList.add("sel");
    trapMin = +b.dataset.min;
    if (trapHandle) {
      cancelTrap();               // Ton kurz neu starten — sauber & einfach
      startTrap(trapMin);
    } else {
      $("trapCount").textContent = fmtHMS(trapMin * 60000);
    }
  });

  document.querySelectorAll(".learn-btn").forEach(b =>
    b.addEventListener("click", () => startLearnDemo(b.dataset.demo)));

  wireInstallChip();
  registerServiceWorker();

  $("btnJournalCsv").addEventListener("click", exportJournalCsv);
  $("btnJournalClear").addEventListener("click", clearJournalWithConfirm);

  // Tastatur: ESC = Not-Aus, Leertaste = Start
  document.addEventListener("keydown", e => {
    if (e.code === "Escape") triggerEstop();
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      startPlaying();
    }
  });
}

/* ---------- PWA: Installation & Service Worker ---------- */

let deferredInstallPrompt = null;

function wireInstallChip() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    $("btnInstall").classList.remove("hidden");
  });
  $("btnInstall").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("btnInstall").classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => {
    $("btnInstall").classList.add("hidden");
  });
}

function registerServiceWorker() {
  if (!SW_CACHE.shouldRegisterSW(window.location)) return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(err => {
    console.warn("Service Worker nicht registriert:", err.message);
  });
}

/* ---------- Start ---------- */

document.addEventListener("DOMContentLoaded", () => {
  AudioEngine.unlock();   // App startet entsperrt — Sperre gilt erst nach Not-Aus
  wire();
  cancelTrap();           // Fallen-Countdown initial anzeigen
  renderJournal();        // gespeicherte Einträge anzeigen
  updateHzDisplay();
  Visualizer.init();
});
