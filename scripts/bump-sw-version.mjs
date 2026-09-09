#!/usr/bin/env node
/* Bumpt die Cache-Version in js/sw-config.js: v<N> -> v<N+1>.
   Wird vom Pre-Commit-Hook (.githooks/pre-commit) bei jedem Commit
   aufgerufen — installierte PWAs ziehen so immer den frischesten
   Cache-Stand. Optionaler Arg: Pfad zur sw-config (für Tests).
   Exit 1, wenn die VERSION-Zeile fehlt oder mehrfach vorkommt. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "js", "sw-config.js");
const file = process.argv[2] ?? defaultPath;

const src = fs.readFileSync(file, "utf8");
const matches = [...src.matchAll(/const VERSION = "v(\d+)";/g)];
if (matches.length !== 1) {
  console.error(`bump-sw-version: erwartet genau eine VERSION-Zeile, gefunden ${matches.length} in ${file}`);
  process.exit(1);
}
const next = Number(matches[0][1]) + 1;
const out = src.replace(/const VERSION = "v\d+";/, `const VERSION = "v${next}";`);
if (out === src) {
  console.error("bump-sw-version: Ersetzung schlug fehl");
  process.exit(1);
}
fs.writeFileSync(file, out);
console.log(`bump-sw-version: ${file} -> v${next}`);
