# 🎵 Frequenz-App

Web-App, die per Web-Audio-API Töne für Tiere, Insekten und Pflanzen erzeugt —
abwehrend **und** bereichernd, mit großem **Not-Aus-Knopf** und Live-Visualisierung.

## Starten

Einfach `index.html` im Browser öffnen (Doppelklick) — kein Build, keine Installation.
Für Ultraschall-Töne gilt: Handys/Laptops haben eingebaute Lautsprecher, die oberhalb
von ~15–18 kHz physikalisch kaum noch etwas erzeugen. Für 20–44 kHz braucht es
Ultraschall-Lautsprecher; die App zeigt den Bereich trotzdem korrekt an.

## Bedienung

1. **Ziel-Kachel wählen** (Tauben, Sittiche, Hunde, Stechmücken, Fliegen, Pflanzen)
2. **Modus**: 🛡 Abwehren oder 💚 Bereichern (bei Mücken: „Anlocken (Falle)")
3. **Frequenz**: Preset-Chips antippen oder Slider frei bewegen (20 Hz – 48 kHz, log)
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

## Dateien

```
index.html              Oberfläche (Redesign: Nacht + Papierplatten)
style.css               Design-System (Tafeln, Typo, Artenfarben)
js/targets.js           Frequenz-Datenbank + Studien-Hinweise
js/audio-engine.js      Web-Audio-Engine (Oszillatoren, Sweeps, Not-Aus-Sperre)
js/visualizer.js        Messtafeln I–III (Canvas)
js/app.js               UI-Logik, Fallen-Modus, Timer, Sicherheit
js/journal.js           Sound-Journal (Logik, CSV, Persistenz)
js/audio-engine.js      Web-Audio-Engine (Oszillatoren, Duett, Chime, Not-Aus-Sperre)
server.py               No-Cache-Entwicklungsserver (optional)
tests/                  node:test-Suite + vm-Harness
```
