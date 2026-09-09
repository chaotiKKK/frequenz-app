/* ============================================================
   Visualizer — 3 Canvas-Ansichten
   1) Spektrum (log-skaliert, farbcodiert nach Hörbereich)
   2) Oszilloskop (Wellenform)
   3) Hörbereichs-Diagramm mit wanderndem Marker
   ============================================================ */

const Visualizer = (() => {
  const F_MIN = 20, F_MAX = 48000;
  // Tafelwerk-Ästhetik: helle Platte, Tief-Tintengrün, Ochre/ Burgundy-Nadeln
  const PLATE = "#FBF8F0";
  const INK = "#1E3328";
  const INK_SOFT = "rgba(74, 93, 80, .85)";
  const GRID = "rgba(74, 93, 80, .16)";
  const NEEDLE = "#7A2E2E";   // Burgundy-Marker
  let spectrum, oscillo, ranges;
  let sctx, octx, rctx;
  let running = false;

  const logPos = f =>
    (Math.log10(Math.max(F_MIN, Math.min(F_MAX, f))) - Math.log10(F_MIN)) /
    (Math.log10(F_MAX) - Math.log10(F_MIN));

  function setupCanvas(cv) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 600;
    cv.width = w * dpr;
    cv.height = parseInt(cv.getAttribute("height"), 10) * dpr;
    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  function init() {
    spectrum = document.getElementById("spectrum");
    oscillo = document.getElementById("oscillo");
    ranges = document.getElementById("ranges");
    sctx = setupCanvas(spectrum);
    octx = setupCanvas(oscillo);
    rctx = setupCanvas(ranges);
    window.addEventListener("resize", () => {
      sctx = setupCanvas(spectrum);
      octx = setupCanvas(oscillo);
      rctx = setupCanvas(ranges);
    });
    running = true;
    requestAnimationFrame(loop);
  }

  function binColor(f) {
    for (const r of HEARING_RANGES) {
      if (f >= r.from && f <= r.to) return r.color;
    }
    return "#B9B29A";   // neutrale Tinte außerhalb aller Hörbereiche
  }

  /* ---------- 1) Spektrum ---------- */

  function drawSpectrum() {
    const W = spectrum.clientWidth, H = parseInt(spectrum.getAttribute("height"), 10);
    sctx.clearRect(0, 0, W, H);
    sctx.fillStyle = PLATE;
    sctx.fillRect(0, 0, W, H);

    const an = AudioEngine.getAnalyser();
    // Raster: Dekaden-Marken
    sctx.font = "10px Spline Sans Mono, monospace";
    for (const f of [50, 100, 500, 1000, 5000, 10000, 20000, 40000]) {
      const x = logPos(f) * W;
      sctx.strokeStyle = GRID;
      sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, H); sctx.stroke();
      sctx.fillStyle = INK_SOFT;
      sctx.fillText(f >= 1000 ? (f / 1000) + "k" : f, x + 3, H - 4);
    }

    if (!an) {
      sctx.fillStyle = INK_SOFT;
      sctx.font = "italic 12px " + getComputedStyle(document.body).fontFamily;
      sctx.fillText("Audio startet, sobald ein Ton gespielt wird …", 12, 22);
      return;
    }

    const N = an.frequencyBinCount;
    const data = new Uint8Array(N);
    an.getByteFrequencyData(data);
    const sr = AudioEngine.getCtx().sampleRate;
    const bars = Math.min(140, Math.floor(W / 5));

    for (let b = 0; b < bars; b++) {
      const f0 = F_MIN * Math.pow(F_MAX / F_MIN, b / bars);
      const f1 = F_MIN * Math.pow(F_MAX / F_MIN, (b + 1) / bars);
      const i0 = Math.floor(f0 / (sr / 2) * N);
      const i1 = Math.max(i0 + 1, Math.floor(f1 / (sr / 2) * N));
      let peak = 0;
      for (let i = i0; i < i1 && i < N; i++) peak = Math.max(peak, data[i]);
      const v = peak / 255;
      const x = (b / bars) * W;
      const bw = W / bars - 1.5;
      const bh = v * (H - 16);
      sctx.fillStyle = binColor((f0 + f1) / 2);
      sctx.globalAlpha = 0.5 + v * 0.5;
      sctx.fillRect(x, H - 12 - bh, bw, bh);
      sctx.globalAlpha = 1;
    }
  }

  /* ---------- 2) Oszilloskop ---------- */

  function drawOscillo() {
    const W = oscillo.clientWidth, H = parseInt(oscillo.getAttribute("height"), 10);
    octx.clearRect(0, 0, W, H);
    octx.fillStyle = PLATE;
    octx.fillRect(0, 0, W, H);

    const an = AudioEngine.getAnalyser();
    octx.strokeStyle = GRID;
    octx.beginPath(); octx.moveTo(0, H / 2); octx.lineTo(W, H / 2); octx.stroke();

    if (!an) return;
    const N = an.fftSize;
    const data = new Uint8Array(N);
    an.getByteTimeDomainData(data);

    octx.lineWidth = 2;
    octx.strokeStyle = INK;
    octx.beginPath();
    const step = W / N;
    for (let i = 0; i < N; i++) {
      const y = (data[i] / 255) * H;
      i === 0 ? octx.moveTo(0, y) : octx.lineTo(i * step, y);
    }
    octx.stroke();
  }

  /* ---------- 3) Hörbereiche + Marker ---------- */

  function drawRanges() {
    const W = ranges.clientWidth, H = parseInt(ranges.getAttribute("height"), 10);
    rctx.clearRect(0, 0, W, H);
    rctx.fillStyle = PLATE;
    rctx.fillRect(0, 0, W, H);

    const rowH = H / HEARING_RANGES.length;
    const sorted = [...HEARING_RANGES].sort((a, b) => a.from - b.from);

    sorted.forEach((r, idx) => {
      const y = idx * rowH;
      const x0 = logPos(r.from) * W;
      const x1 = logPos(Math.min(r.to, F_MAX)) * W;
      // Zeilengrund
      rctx.fillStyle = "rgba(30, 51, 40, .05)";
      rctx.fillRect(4, y + 8, W - 8, rowH - 16);
      // Hörbereich mit Schraffur-Anmutung (halbtransparente Fläche)
      rctx.fillStyle = r.color;
      rctx.globalAlpha = 0.8;
      rctx.fillRect(x0, y + 8, Math.max(4, x1 - x0), rowH - 16);
      rctx.globalAlpha = 1;
      // Tinten-Kontur
      rctx.strokeStyle = INK;
      rctx.lineWidth = 1;
      rctx.strokeRect(x0, y + 8, Math.max(4, x1 - x0), rowH - 16);
      // Label + Bereich
      rctx.font = "11px Spline Sans Mono, monospace";
      rctx.fillStyle = INK;
      const label = `${r.label}  ${r.from >= 1000 ? (r.from/1000) + "k" : r.from}\u2013${r.to >= 1000 ? (r.to/1000) + "k" : r.to} Hz`;
      rctx.fillText(label, Math.max(8, x0 + 4), y + rowH / 2 + 4);
    });

    // Marker: aktueller Ton (Burgundy-Nadel)
    const f = AudioEngine.getFreq();
    const mx = logPos(f) * W;
    rctx.strokeStyle = NEEDLE;
    rctx.lineWidth = 2;
    rctx.beginPath(); rctx.moveTo(mx, 2); rctx.lineTo(mx, H - 2); rctx.stroke();
    // Marker-Spitze
    rctx.fillStyle = NEEDLE;
    rctx.beginPath(); rctx.moveTo(mx - 4, 2); rctx.lineTo(mx + 4, 2); rctx.lineTo(mx, 10); rctx.closePath(); rctx.fill();

    // Hz-Skala unten
    rctx.font = "9.5px Spline Sans Mono, monospace";
    rctx.fillStyle = INK_SOFT;
    for (const f2 of [20, 100, 1000, 10000, 40000]) {
      const x = logPos(f2) * W;
      rctx.fillText(f2 >= 1000 ? (f2 / 1000) + "k" : f2, Math.min(W - 18, x + 2), H - 3);
    }
  }

  /* ---------- Loop ---------- */

  function loop() {
    if (!running) return;
    drawSpectrum();
    drawOscillo();
    drawRanges();
    requestAnimationFrame(loop);
  }

  return { init };
})();
