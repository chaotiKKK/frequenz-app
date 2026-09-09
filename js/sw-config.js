/* ============================================================
   Service-Worker-Konfiguration — von Seite UND Sw geteilt
   (Seite: Registrierungs-Schutz · SW: importScripts + Strategien)
   ============================================================ */

const SW_CACHE = (() => {
  const VERSION = "v5";
  const NAME = "frequenz-app-" + VERSION;

  const precache = [
    "index.html",
    "style.css",
    "manifest.webmanifest",
    "js/sw-config.js",
    "js/engine-logic.js",
    "js/targets.js",
    "js/journal.js",
    "js/audio-engine.js",
    "js/visualizer.js",
    "js/app.js",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-192-maskable.png",
    "icons/icon-512-maskable.png"
  ];

  const offlineUrl = "index.html";

  /* Fetch-Strategie je URL:
     font  → network-first mit Cache-Fallback (Google Fonts)
     shell → stale-while-revalidate (App-Dateien)
     bypass→ gar nicht anfassen (z. B. zukünftige APIs) */
  function strategyFor(url) {
    try {
      const u = new URL(url);
      if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") return "font";
      const p = u.pathname.replace(/^\/+/, "");
      if (p === "" || precache.includes(p)) return "shell";
      return "bypass";
    } catch (e) {
      return "bypass";
    }
  }

  /* Registrierung nur dort, wo Service Worker dauerhaft sinnvoll sind:
     https-Ja, aber nicht localhost/127.0.0.1 (Entwicklung soll frische
     Dateien sehen, keine Cache-Fallen), kein http, kein file:. */
  function shouldRegisterSW(location) {
    if (!location) return false;
    const proto = String(location.protocol || "").replace(":", "");
    if (proto !== "https") return false;
    const host = String(location.hostname || "");
    return host !== "localhost" && host !== "127.0.0.1";
  }

  return { VERSION, NAME, precache, offlineUrl, strategyFor, shouldRegisterSW };
})();
