/* ============================================================
   Audio-Engine — Web Audio API
   Sinus/Sweep/Chirps/Akkord + Not-Aus-Sperre
   ============================================================ */

const AudioEngine = (() => {
  let ctx = null;
  let master = null;        // GainNode -> destination
  let analyser = null;      // für Visualizer
  let playing = false;
  let locked = true;        // startet gesperrt (Not-Aus-Mentalität)

  // Aktuelle Wiedergabe-Ressourcen
  let voices = [];          // alle aktiven OscillatorNodes
  let gains = [];           // zugehörige GainNodes
  let patternTimers = [];   // setInterval/setTimeout-Handles
  let currentFreq = 440;
  let currentWave = "sine";
  let currentPattern = "constant";

  /* ---------- Grundgerüst ---------- */

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio nicht unterstützt");
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.6;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;
      master.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setVolume(v) {           // v: 0..100
    if (master) master.gain.setTargetAtTime(v / 100, ctx.currentTime, 0.02);
  }

  function setWave(w) { currentWave = w; }
  function getFreq() { return currentFreq; }
  function setFreq(f) { currentFreq = f; }   // Live-Änderung für laufende Dauerton/Chirp/Akkord-Voices

  /* ---------- Voice-Erzeugung ---------- */

  function makeVoice(freq, when, dur) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = currentWave;
    osc.frequency.setValueAtTime(freq, when);
    // sanfte Attack/Release gegen Klick-Geräusche
    const attack = Math.min(0.02, dur / 4);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.9, when + attack);
    g.gain.setValueAtTime(0.9, when + dur - 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g); g.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
    voices.push(osc); gains.push(g);
    osc.onended = () => {
      voices = voices.filter(v => v !== osc);
      gains = gains.filter(x => x !== g);
    };
    return osc;
  }

  /* ---------- Patterns ---------- */

  function stopPatternTimers() {
    patternTimers.forEach(t => { clearInterval(t); clearTimeout(t); });
    patternTimers = [];
  }

  function startConstant() {
    makeVoice(currentFreq, ctx.currentTime, 1);
    // Endlos: Voice nach 1 s neu erzeugen (kein endloser Loop-Osc nötig)
    const t = setInterval(() => {
      if (!playing) return;
      makeVoice(currentFreq, ctx.currentTime, 1.05);
    }, 1000);
    patternTimers.push(t);
  }

  function startSweep() {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = currentWave;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.05);
    g.gain.setValueAtTime(0.9, ctx.currentTime + 2.95);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3);
    osc.connect(g); g.connect(master);
    osc.start();
    voices.push(osc); gains.push(g);
    osc.onended = () => {
      voices = voices.filter(v => v !== osc);
      gains = gains.filter(x => x !== g);
    };

    const f0 = Math.max(40, currentFreq / 1.5);
    const f1 = Math.min(45000, currentFreq * 1.5);
    osc.frequency.setValueAtTime(f0, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(f1, ctx.currentTime + 1.5);
    osc.frequency.linearRampToValueAtTime(f0, ctx.currentTime + 3);

    // Frequenz für Visualizer mitführen
    const t = setInterval(() => {
      if (!playing || !voices.includes(osc)) return;
      const el = (ctx.currentTime - (osc._t0 || (osc._t0 = ctx.currentTime))) % 3;
      currentFreq = el < 1.5
        ? f0 + (f1 - f0) * (el / 1.5)
        : f1 - (f1 - f0) * ((el - 1.5) / 1.5);
    }, 80);
    patternTimers.push(t);

    // nahtlos weiterlaufen lassen
    const loop = setInterval(() => {
      if (playing && !voices.includes(osc)) startSweep();
    }, 3100);
    patternTimers.push(loop, t);
  }

  function startChirp() {
    makeVoice(currentFreq, ctx.currentTime, 0.09);
    const t = setInterval(() => {
      if (!playing) return;
      const jitter = currentFreq * (0.92 + Math.random() * 0.16);
      makeVoice(jitter, ctx.currentTime, 0.07 + Math.random() * 0.06);
    }, 240);
    patternTimers.push(t);
  }

  function startChord() {
    const ratios = [1, 1.25, 1.5];   // Dur-Terz + Quinte
    ratios.forEach((r, i) => {
      makeVoice(currentFreq * r, ctx.currentTime + i * 0.03, 1.2);
    });
    const t = setInterval(() => {
      if (!playing) return;
      ratios.forEach((r, i) => {
        makeVoice(currentFreq * r, ctx.currentTime + i * 0.03, 1.25);
      });
    }, 1250);
    patternTimers.push(t);
  }

  /* Duett: zwei Dauerton-Voices gleichzeitig (Weibchen + Männchen 1,25×) */
  function playDuet(freq) {
    if (locked) return false;
    ensureCtx();
    stopAll(true);
    currentFreq = freq;
    playing = true;
    const [fW, fM] = [freq, Math.round(freq * 1.25)];
    makeVoice(fW, ctx.currentTime, 1);
    makeVoice(fM, ctx.currentTime, 1);
    const t = setInterval(() => {
      if (!playing) return;
      makeVoice(fW, ctx.currentTime, 1.05);
      makeVoice(fM, ctx.currentTime, 1.05);
    }, 1000);
    patternTimers.push(t);
    return true;
  }

  /* Kurzer Doppel-Piep (z. B. Fallen-Ablauf) — unabhängig vom playing-Zustand */
  function chime() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [[660, 0], [880, 0.15]].forEach(([f, off]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + off);
      g.gain.setValueAtTime(0.0001, t + off);
      g.gain.exponentialRampToValueAtTime(0.5, t + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.14);
      osc.connect(g); g.connect(master);
      osc.start(t + off); osc.stop(t + off + 0.16);
    });
  }

  /* ---------- Öffentliche API ---------- */

  function play(freq, pattern) {
    if (locked) return false;
    ensureCtx();
    stopAll(true);
    currentFreq = freq;
    currentPattern = pattern;
    playing = true;
    if (pattern === "sweep") startSweep();
    else if (pattern === "chirp") startChirp();
    else if (pattern === "chord") startChord();
    else startConstant();
    return true;
  }

  function stopAll(soft) {
    playing = false;
    stopPatternTimers();
    voices.forEach(v => { try { v.stop(); } catch (e) {} });
    voices = []; gains = [];
    if (!soft && ctx && master) {
      // kurzer Fade gegen Klicken
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      setTimeout(() => {
        if (master && !playing) {
          master.gain.setValueAtTime(master.gain.value === 0 ? (document.getElementById("vol") ? document.getElementById("vol").value / 100 : 0.6) : master.gain.value, ctx.currentTime);
        }
      }, 60);
    }
  }

  /* ---------- Not-Aus ---------- */

  function emergencyStop() {
    stopAll();
    if (ctx) {
      master.gain.setValueAtTime(0, ctx.currentTime);
      try { ctx.suspend(); } catch (e) {}
    }
    locked = true;
  }

  function unlock() {
    ensureCtx();
    locked = false;
    return true;
  }

  function isLocked() { return locked; }
  function isPlaying() { return playing; }

  function getAnalyser() { return analyser; }
  function getCtx() { return ctx; }

  return { play, playDuet, chime, stopAll, emergencyStop, unlock, isLocked, isPlaying,
           setVolume, setWave, getFreq, setFreq, getAnalyser, getCtx, ensureCtx };
})();
