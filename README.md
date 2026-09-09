# 🎵 Frequenz-App

Web-App, die per Web-Audio-API Töne für Tiere, Insekten und Pflanzen erzeugt —
abwehrend **und** bereichernd, mit großem **Not-Aus-Knopf** und Live-Visualisierung.

## Starten

**Online:** <https://chaotikkk.github.io/frequenz-app/> — installierbar als PWA
(siehe unten).

Lokal: einfach `index.html` im Browser öffnen (Doppelklick) — kein Build, keine Installation.
Für Ultraschall-Töne gilt: Handys/Laptops haben eingebaute Lautsprecher, die oberhalb
von ~15–18 kHz physikalisch kaum noch etwas erzeugen. Für 20–44 kHz braucht es
Ultraschall-Lautsprecher; die App zeigt den Bereich trotzdem korrekt an.

## Bedienung

1. **Ziel-Kachel wählen** — 14 Ziele:
   - **Lebewesen**: Tauben, Sittiche, Hunde, 🐱 Katze, 🐀 Ratte, 🐝 Wespen, 🐞 Hornisse, Stechmücken, Fliegen, 🪳 Schaben, 🛏️ Wanzen, 🐤 Küken, Pflanzen, 🌾 Tomate
     (Schaben/Wanzen: Ultraschall laut Studien wirkungslos — nur als ehrliches Experiment)
   - **Materialien** (Resonanz-Experimente, kein Repel): 🍷 Glas & Porzellan, 🔔 Metall & Werkzeug, 🪵 Holz & Diffusor
2. **Modus**: 🛡 Abwehren oder 💚 Bereichern (bei Mücken: „Anlocken (Falle)") — Kacheln ohne Abwehr starten im Bereichern
3. **Frequenz**: Preset-Chips antippen oder Slider frei bewegen (20 Hz – 52 kHz, log)
4. **▶ Ton starten** — Wiedergabeart wählbar: Dauerton, Sweep, Chirps, Akkord
5. **Auto-Stopp**: 15/30/60 min oder Aus

## 🦟 Mückenfallen-Modus

Bei der **Stechmücken**-Kachel erscheint eine eigene Sektion: Sie spielt den
**Weibchen-Flugton (400–600 Hz)** als Dauerton — genau der Ton, auf den
Mücken-Männchen reagieren. Kombiniert mit einem Ventilator (Klebefolie/Netz)
wird daraus ein einfaches DIY-Fallen-Experiment.

- **Laufzeiten**: 1 h / 2 h / 4 h / 8 h mit großem Countdown, Auto-Stopp bei Ablauf
  — Restzeit zusätzlich im **Browser-Tab-Titel**, End-Piep bei Ablauf
- **Duett-Modus** (optional): Männchenton bei 1,25× parallel zum Weibchenton
- **Fangzähler**: „+1“-Button zählt gefangene Mücken pro Lauf; die Zahl landet
  als Spalte **„Gefangen“** im Journal und im CSV-Export
- **Wake Lock**: Display bleibt während des Fallenlaufs wach (wo unterstützt),
  Wiederaufnahme nach Tab-Rückkehr, sauberes Release bei Stopp/Not-Aus
- Einklappbare **Anleitung**: Fallenbau, Positionierung, Audio-Tipp, Ehrlichkeits-Hinweis
- Der **Not-Aus** stoppt und sperrt auch den Fallen-Modus zuverlässig

## 🛑 Sicherheit

- **NOT-AUS-Knopf** (oben rechts, ESC-Taste): stoppt sofort alles und **sperrt** die App
  (roter Sperr-Banner). Erst „Entsperren" gibt den Ton wieder frei.
- **Ultraschall-Warnung**: ab 18 kHz kommt (optional, Checkbox) ein Bestätigungs-Dialog —
  Menschen hören das nicht, aber Hunde, Katzen und Nager sehr wohl.
- **Lautstärke-Warnung** ab 80 %.

## 📊 Visualisierung

- **Spektrum-Analyzer** — log-skaliert, Balken farbcodiert nach Hörbereich
  (Mensch=Grün, Hund=Gelb, Vogel=Violett, Insekt=Pink)
- **Oszilloskop** — Wellenform des aktuellen Tons
- **Hörbereichs-Diagramm** — wo Mensch/Tier/Insekt hören, mit wanderndem weißem
  Marker für den aktuellen Ton

## ⚗️ Ehrliche Wissenschaft

Zu jedem Ziel gibt es eine Info-Box mit Hörbereich, Fakten **und** einem
Ehrlichkeits-Hinweis. Kurzgefasst:

- **Ultraschall gegen Mücken** ist wissenschaftlich **nicht belegt**
  (Cochrane-Review 2007: keine Wirkung gegen Stiche). Real funktioniert der
  **Anlock-Modus** (Weibchen-Flugton 400–600 Hz) für DIY-Fallen.
- **Ultraschall-Vogelabwehr** ist für Tauben wirkungslos — sie hören kein Ultraschall.
  Besser: Alarm-Chirps im hörbaren Bereich + visuelle Reize.
- **Hunde** hören bis ~45 kHz — Hundepfeifen (22–25 kHz) funktionieren, aber nie
  dauerhaft oder laut einsetzen.
- **Pflanzen** haben kein Gehör; Vibrationen bei 100–500 Hz können Wachstum laut
  einzelnen Studien leicht fördern. Dauerlaut = Stress.

## 📱 Als App installieren (PWA)

Die App ist eine installierbare PWA: Auf **HTTPS**-Hosting (z. B. GitHub Pages)
erscheint der **„⬇ Installieren“-Chip** im Kopf (bzw. „Zum Startbildschirm
hinzufügen“ im Browser-Menü). Danach startet sie wie eine native App im
Vollbild — **vollständig offline**, dank Service Worker mit
Precache der gesamten App-Shell (stale-while-revalidate) und
Network-first für Google Fonts.

Hinweise:
- Installation/Set-up des SW erfordert HTTPS; auf `localhost`/`file://`
  und einfachem http wird der Service Worker bewusst **nicht** registriert
  (Dev-Schutz gegen veraltete Cache-Stände).
- Die Icons werden aus dem Design-System generiert:
  `node scripts/make-icons.js` (192/512 + maskable, reines Node ohne Abhängigkeiten).

## 🚀 Deployment (GitHub Pages)

Die App ist unter <https://chaotikkk.github.io/frequenz-app/> live — automatisch
bei jedem Push auf `main` neu gebaut.

So wird eine Änderung veröffentlicht:

```
git add -A && git commit -m "Beschreibung" && git push
```

Nach ~1 Minute ist der neue Stand online. Der Service Worker aktualisiert
die App-Shell dann von selbst (stale-while-revalidate; ein App-Neustart
genügt).

### Tests

Zwei Ebenen, beide optional für die Nutzung der App:

- **`npm test`** — Logik-Suite (39 Tests, Node-Bordmittel, keine Abhängigkeiten)
- **`npm run e2e`** — Browser-E2E-Suite (20 Checks in headless Chromium via
  Playwright; braucht einmalig `pip install playwright` +
  `playwright install chromium`). Startet die App selbstständig auf Port 8593
  und prüft Laden, Kacheln, Journal, Not-Aus, Fallen-Modus, Lern-Demo und
  PWA-Dev-Guard.

**Auf dem Handy installieren:** Seite in Chrome (Android) bzw. Safari (iOS)
öffnen → Menü → **„Zum Startbildschirm hinzufügen“** — danach startet die
App wie eine native App im Vollbild, auch offline.

## 🎓 Lern-Modus

Unter Tafel III: fünf Buttons starten langsame Klang-Durchwanderungen der
Hörbereiche — **🧑 Mensch** (20 Hz–18 kHz), **🐕 Hund** (40 Hz–45 kHz),
**🦜 Vogel** (200 Hz–8,5 kHz), **🦟 Mücke** (150–800 Hz) und die
**🎢 Hör-Tour** durch alles. Die Live-Zeile zeigt laufend, welche Art die
gewählte Frequenz gerade hört (inkl. „🤫 für dich gerade lautlos“ jenseits
von 18 kHz); der Marker wandert synchron in Tafel III mit. Demos enden mit einem
Piep und werden als Modus „Lernen“ im Journal protokolliert.

## 📜 Sound-Journal

Jede Wiedergabe wird protokolliert: **Startzeit · Ziel · Modus · Frequenz ·
Wiedergabeart · Dauer** — inkl. Enden durch Stop, Not-Aus, Auto-Stopp oder
Kachelwechsel. Wiedergaben unter 1 Sekunde werden verworfen.

- **Persistenz:** `localStorage` (überlekt Reloads), max. 200 Einträge
- **CSV-Export:** Semikolon-getrennt (deutsches Excel), UTF-8-BOM,
  Dauer als `hh:mm:ss` — über den Button „⬇ CSV exportieren“
- Die Tabelle zeigt die 50 neuesten Einträge, das CSV alle

## Tests

Zero-Dependency-Testsuite mit Node-Bordmitteln:

```
npm test
```

12 Tests über reine Funktionen (Formatierung, Slider-Mapping, Countdown) und
die Zieldatenbank (Datenintegrität, Hörbereiche, Anlock-Modus). Die Dateien
in `js/` erwarten `document` — der Loader in `tests/helpers/load.js` führt sie
deshalb in einer vm-Sandbox mit DOM-Stub aus.

## Design

„The Naturalist's Listening Instrument“ — Nachtgrund mit Flechten-Papier-Platten,
Fraunces/Instrument Sans/Spline Sans Mono, artencodierte Farben (Flechte=Mensch,
Bernstein=Hund, Dämmerung=Vogel, Motte=Insekt), Messtafeln I–III als Signatur.
Das Styling folgt einer dreistufigen Token-Hierarchie (**Brand → Semantic →
Komponente**), Farben als Hex-Fallback plus exakt konvertiertem OKLCH —
Design-System-Disziplin ohne Build-Step.

## Dateien

```
index.html              Oberfläche (Redesign: Nacht + Papierplatten)
style.css               Design-System (Tafeln, Typo, Artenfarben)
js/targets.js           Frequenz-Datenbank + Studien-Hinweise
js/audio-engine.js      Web-Audio-Adapter (Voices, Patterns, Not-Aus-Sperre)
js/engine-logic.js      Reine Engine-Mathematik (Duett, Sweep-Bahn, Akkord, Hüllkurve)
js/visualizer.js        Messtafeln I–III (Canvas)
js/app.js               UI-Logik, Fallen-Modus, Timer, Sicherheit
js/journal.js           Sound-Journal (Logik, CSV, Persistenz)
js/sw-config.js         SW-Konfiguration: Precache-Liste, Strategien, Registrierungs-Guard
server.py               No-Cache-Entwicklungsserver (optional)
tests/                  node:test-Suite + vm-Harness
tests/e2e/              Playwright-E2E-Suite (headless Chromium, optional)
```
