/* ============================================================
   Engine-Logik — reine Funktionen, ohne Web-Audio/DOM
   Von audio-engine.js importiert (Adapter-Muster): Die Engine
   führt Web-Audio-API-Aufrufe aus, hier steht nur Mathematik.
   Alles deterministisch bis auf chirpJitterFreq, das random
   injiziert bekommt (Dependency Injection, testbar ohne Mocks).
   ============================================================ */

/* Duett: Weibchen-Flugton + Männchen beim realen Intervall 1,25×
   (Harmonic Convergence der Stechmücken). Ganzzahlig gerundet. */
function duetFreqs(freq) {
  return [freq, Math.round(freq * 1.25)];
}

/* Sweep-Band: ±50 % um die Zielfrequenz, geklemmt an
   [40 Hz … 45 kHz] — dieselben Grenzen wie bisher in startSweep. */
const SWEEP_MIN = 40;
const SWEEP_MAX = 45000;
const SWEEP_HALF = 1.5;   // Faktor nach oben/unten
const SWEEP_UP = 1.5;     // Sekunden aufwärts
const SWEEP_DOWN = 1.5;   // Sekunden abwärts

function sweepProfile(freq) {
  const f1 = Math.min(SWEEP_MAX, freq * SWEEP_HALF);
  const f0 = Math.max(SWEEP_MIN, freq / SWEEP_HALF);
  return { f0, f1, durUp: SWEEP_UP, durTotal: SWEEP_UP + SWEEP_DOWN };
}

/* Dreiecksbahn: 0…durUp linear f0→f1, danach linear zurück.
   Klemmt außerhalb des Zyklus auf die Ränder. */
function sweepFreqAt(f0, f1, t) {
  const up = SWEEP_UP;
  const total = SWEEP_UP + SWEEP_DOWN;
  const el = ((t % total) + total) % total;      // immer in [0, total)
  if (el <= up) {
    const k = up === 0 ? 1 : el / up;
    return f0 + (f1 - f0) * k;
  }
  const k = (el - up) / (total - up);
  return f1 - (f1 - f0) * k;
}

/* Chirp-Jitter ±8 % um die Basisfrequenz; rng injizierbar. */
function chirpJitterFreq(base, rng = Math.random) {
  const r = rng();
  return base * (0.92 + r * 0.16);
}

/* Akkord-Intervalle: Grundton + Dur-Terz + Quinte (wie bisher). */
const CHORD_RATIOS = [1, 1.25, 1.5];

function chordFreqs(freq) {
  return CHORD_RATIOS.map(r => freq * r);
}

/* Hüllkurve als Funktion (statt verstreuter exponentialRamp-Werte):
   sanfter Attack min(0.02 s, dur/4), Plateau 0.9, Release 0.02 s.
   Liefert den Gain-Wert zur relativen Zeit t innerhalb von dur. */
const ENV_PEAK = 0.9;
const ENV_FLOOR = 0.0001;
const ENV_RELEASE = 0.02;

function envelopeAmp(t, dur) {
  if (dur <= 0) return ENV_FLOOR;
  const attack = Math.min(0.02, dur / 4);
  if (t <= 0) return ENV_FLOOR;
  if (t >= dur) return ENV_FLOOR;
  if (t < attack) {
    // exponentieller Anstieg 0.0001 -> 0.9 über die Attack-Zeit
    const k = t / attack;
    return ENV_FLOOR * Math.pow(ENV_PEAK / ENV_FLOOR, k);
  }
  if (t > dur - ENV_RELEASE) {
    // exponentieller Abfall 0.9 -> 0.0001 über die Release-Zeit
    const k = (t - (dur - ENV_RELEASE)) / ENV_RELEASE;
    return ENV_PEAK * Math.pow(ENV_FLOOR / ENV_PEAK, k);
  }
  return ENV_PEAK;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { duetFreqs, sweepProfile, sweepFreqAt, chirpJitterFreq, chordFreqs, envelopeAmp };
} else if (typeof window !== "undefined") {
  window.EngineLogic = { duetFreqs, sweepProfile, sweepFreqAt, chirpJitterFreq, chordFreqs, envelopeAmp };
}
