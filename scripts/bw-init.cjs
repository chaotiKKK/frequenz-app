"use strict";
/* Bubblewrap-Init-Treiber v3: Zeilenbasiertes Prompt-Matching.
   v2 scheiterte daran, dass inquirer bei Listenprompts die Auswahl NEU
   zeichnet und der Chunk-Ende-Text wechselte. v3 Extrahiert die LETZTE
   '? Frage:'-Zeile aus dem ANSI-geglaubten Text und matcht darauf —
   robust gegen Nachbau-Rendering. */
const { spawn } = require("child_process");
const fs = require("fs");

const LOG = "C:/freebuff/tonz/.freebuff/bwinit.log";
const out = fs.createWriteStream(LOG, { flags: "w" });

const p = spawn("bubblewrap", ["init", "--manifest", "https://chaotikkk.github.io/frequenz-app/manifest.webmanifest"], {
  shell: true,
  env: { ...process.env, JAVA_HOME: "C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot" },
  stdio: ["pipe", "pipe", "pipe"]
});

let all = "";
const answered = new Set();

p.stdout.on("data", d => {
  out.write(d);
  all += d.toString();
  if (all.length > 60000) all = all.slice(-30000);
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
  // letzte Zeile, die mit '? ' beginnt
  const lines = c.split("\n").filter(l => l.includes("? "));
  return lines.length ? lines[lines.length - 1].trim() : "";
}

function tryAnswer(c) {
  const q = lastPromptLine(c);
  if (!q) return;
  if (q.includes("install the Android SDK")) return send("y\n", "sdk");
  if (q.includes("agree to the Android SDK terms")) return send("y\n", "terms");
  if (/^Domain:/.test(q.replace(/^.*\? /, ""))) return send("\n", "domain");
  if (/^URL path:/.test(q.replace(/^.*\? /, ""))) return send("\n", "urlpath");
  if (/^Application name:/.test(q.replace(/^.*\? /, ""))) return send("Frequenz-App\n", "appname");
  if (/^Short name:/.test(q.replace(/^.*\? /, ""))) return send("Frequenz-App\n", "shortname");
  if (/^Application ID:/.test(q.replace(/^.*\? /, ""))) return send("\n", "appid");
  if (/^Starting version code/.test(q.replace(/^.*\? /, ""))) return send("\n", "versioncode");
  if (/^Display mode:/.test(q.replace(/^.*\? /, ""))) return send("\n", "display");
  if (/^Orientation:/.test(q.replace(/^.*\? /, ""))) return send("\n", "orientation");
  if (/^Icon URL:/.test(q.replace(/^.*\? /, ""))) return send("\n", "iconurl");
  if (/^Maskable icon URL:/.test(q.replace(/^.*\? /, ""))) return send("\n", "maskable");
  if (/^Path to the public/.test(q.replace(/^.*\? /, ""))) return send("\n", "signkey");
  if (/[Ww]hat color/.test(q) || /^Theme color/.test(q.replace(/^.*\? /, "")) || /^Background color/.test(q.replace(/^.*\? /, "")) || /^Status bar color/.test(q.replace(/^.*\? /, ""))) return send("\n", "colordefault:" + answered.size + ":" + q.slice(0, 25));
  if (/^Key store location/.test(q.replace(/^.*\? /, "")) || /^Key store path/.test(q.replace(/^.*\? /, ""))) return send("C:\\freebuff\\tonz\\android.keystore\n", "keystore");
  if (/^Key name/.test(q.replace(/^.*\? /, ""))) return send("upload\n", "keyname");
  if (/[Pp]assword/.test(q)) return send("frequenz-twa-2026\n", "pw:" + answered.size);
  if (/^Key alias/.test(q.replace(/^.*\? /, ""))) return send("upload\n", "keyalias");
  if (/^Full name/.test(q.replace(/^.*\? /, ""))) return send("Frequenz-App Feldinstrument\n", "fullname");
  if (/^First and Last names/.test(q.replace(/^.*\? /, ""))) return send("Frequenz-App Feldinstrument\n", "firstlast");
  if (/^Organizational unit/.test(q.replace(/^.*\? /, ""))) return send("Feldinstrument\n", "orgunit");
  if (/^Organization/.test(q.replace(/^.*\? /, ""))) return send("Frequenz-App\n", "org");
  if (/^(?:City|Locality)/.test(q.replace(/^.*\? /, ""))) return send("Berlin\n", "city");
  if (/^(?:State|Province)/.test(q.replace(/^.*\? /, ""))) return send("Berlin\n", "state");
  if (/^Country/.test(q.replace(/^.*\? /, ""))) return send("DE\n", "country");
  if (/Is this correct/.test(q)) return send("y\n", "correct:" + answered.size);
  if (/splash/i.test(q) && /image|URL/i.test(q)) return send("\n", "splashimg:" + answered.size);
  if (/\(Y\/n\)/.test(q) || /\(y\/N\)/.test(q)) return send("y\n", "genericyn:" + answered.size);
  // KEIN blindes generisches Enter mehr — das hat bei 'Key store location'
  // Single-Char-Antworten ('y') produziert, die die Mindestlänge knocken.
  log("UNBEKANnte Frage: " + q.slice(0, 80));
}

function log(s) { out.write("\n[TREIBER] " + s + "\n"); console.log("[T] " + s); }

const killer = setTimeout(() => { log("HARD-TIMEOUT"); p.kill("SIGKILL"); process.exit(0); }, 24 * 60 * 1000);
p.on("exit", c => {
  clearTimeout(killer);
  log("bubblewrap exit: " + c);
  out.end();
  process.exit(0);
});
