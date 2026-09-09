"use strict";
/* Bubblewrap-Build-Treiber: beantwortet die Passwort-Prompts (Keystore).
   Same line-based matching as bw-init v3. */
const { spawn } = require("child_process");
const fs = require("fs");

const LOG = "C:/freebuff/tonz/.freebuff/bwbuild.log";
const out = fs.createWriteStream(LOG, { flags: "w" });

const p = spawn("bubblewrap", ["build"], {
  shell: true,
  env: { ...process.env, JAVA_HOME: "C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot" },
  stdio: ["pipe", "pipe", "pipe"]
});

let all = "";
const answered = new Set();

p.stdout.on("data", d => {
  out.write(d);
  all += d.toString();
  if (all.length > 80000) all = all.slice(-40000);
  const clean = all.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
  tryAnswer(clean);
});
p.stderr.on("data", d => out.write(d));

function send(text, label) {
  if (answered.has(label)) return;
  answered.add(label);
  setTimeout(() => { p.stdin.write(text); log(label); }, 600);
}

function lastPromptLine(c) {
  const lines = c.split("\n").filter(l => l.includes("? "));
  return lines.length ? lines[lines.length - 1].trim() : "";
}

function tryAnswer(c) {
  const q = lastPromptLine(c);
  if (!q) return;
  if (/Accept\? \(y\/N\)/.test(q)) return send("y\n", "license-accept");
  if (/apply them to the[\s\S]*project before building/.test(q) || /project before building\? \(Y\/n\)/.test(q)) return send("y\n", "apply-manifest");
  if (/[Pp]assword/.test(q)) return send("frequenz-twa-2026\n", "pw:" + answered.size);
  log("UNBEKANNT: " + q.slice(0, 80));
}

function log(s) { out.write("\n[TREIBER] " + s + "\n"); console.log("[T] " + s); }

const killer = setTimeout(() => { log("HARD-TIMEOUT"); p.kill("SIGKILL"); process.exit(0); }, 25 * 60 * 1000);
p.on("exit", c => {
  clearTimeout(killer);
  log("bubblewrap build exit: " + c);
  out.end();
  process.exit(0);
});
