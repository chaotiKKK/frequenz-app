"use strict";
/* Lädt Browser-Skripte (die document/window erwarten) in eine vm-Sandbox,
   damit die reinen Funktionen in node:test lauffähig sind.

   Wichtig: Top-level `const`/`let` landen NICHT auf dem Kontext-Objekt.
   Deshalb nimmt loadAppScript einen Export-Ausdruck entgegen, der im
   selben Kontext (gemeinsame lexikalische Umgebung) ausgewertet wird. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function makeDomStub() {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      style: {},
      dataset: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {},
      appendChild() {}
    })
  };
}

function loadAppScript(relPath, extraGlobals = {}, exportExpr = null) {
  return loadAppScripts([relPath], extraGlobals, exportExpr);
}

/* Lädt mehrere Skripte in EINEM Kontext (z. B. targets.js + app.js),
   damit spätere Skripte die Globals der früheren sehen. */
function loadAppScripts(relPaths, extraGlobals = {}, exportExpr = null) {
  const dom = makeDomStub();
  const ctx = vm.createContext({
    document: dom,
    window: { addEventListener() {} },
    console,
    Math,
    Date,
    URL,                      // Browser-Global, z. B. für URL-Klassifikation
    ...extraGlobals
  });
  let first = "", last = "";
  relPaths.forEach((relPath, i) => {
    const source = fs.readFileSync(path.join(__dirname, "..", "..", relPath), "utf8");
    if (i === 0) first = relPath;
    last = relPath;
    vm.runInContext(source, ctx, { filename: relPath });
  });
  if (exportExpr) {
    vm.runInContext(`globalThis.__exports__ = (${exportExpr});`, ctx, { filename: last + "#exports" });
    return ctx.__exports__;
  }
  return ctx;
}

module.exports = { loadAppScript, loadAppScripts, makeDomStub };
