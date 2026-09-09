# Design-Spec: „Tafelwerk" — Frontend-Redesign

**Datum:** 2026-09-09 · **Status:** genehmigt (Chat-Freigabe)
**Pfad:** Bounded-Plus — visuelles Redesign ohne Architektur-/Logik-Änderung

## Vision

Die Frequenz-App als **Naturalisten-Atlas**: Tageslicht-Papier statt Nachtglas,
gravierte Art-Tafeln statt dunkler Kacheln, Museums-Typografie statt
Dashboard-Chrome. Metapher: ein Feldbuch, in dem der Forscher seine
Hör-Experimente mit anderen Species dokumentiert.

## Design-Tokens

**Palette (6 Werte):**
| Token | Wert | Rolle |
|---|---|---|
| `--paper` | `#F2EDDF` | Seitenhintergrund (warmes Creme) |
| `--plate` | `#FBF8F0` | Panels/Tafeln (heller, wärmer) |
| `--ink` | `#1E3328` | Primärtext (Tief-Tintengrün) |
| `--ink-soft` | `#4A5D50` | Sekundärtext |
| `--burgundy` | `#7A2E2E` | Akzente, aktiv, NOT-AUS-Familie |
| `--ochre` | `#C79A3B` | Highlights, Marker, aktive Bänder |

**Typografie:** Fraunces (Display, bleibt), **Source Serif 4** (Body, neu —
klassisch-buchhaft), Spline Sans Mono (Zahlen, bleibt). Small-Caps-Labels mit
Letter-Spacing als strukturelles Stilmittel („TAFEL VII · HÖRBEREICHE").

## Layout

Reihenfolge bleibt (Kacheln → Regelpanel → Tafeln I–III → Lernmodus → Journal),
alles wird als Feldbuch verkleidet:

- **Header** = Buch-Titelblatt: „Frequenz-App" als Atlas-Titel, Untertitel kursiv,
  NOT-AUS als Burgundy-Siegel-Knopf oben rechts
- **Kacheln = nummerierte Art-Tafeln:** Small-Caps-Tafelnummer („TAFEL I"…"XVIII"),
  Artname in Display-Serif, Subzeile bleibt Small-Caps, dünne Doppelrule-Rahmen
- **Regelpanel** = Marginalien-Spalte: Papierkarte, Ochre-Sektionsetiketten,
  Hz-Anzeige in Fraunces mit Oldstyle-Ziffern
- **Tafeln I–III:** Canvas-Neuzeichnung in Papierpalette; Figure-Captions
  „FIG. 1 — SPEKTRUM" usw., dünne Tintenlinien
- **Journal** = „Beobachtungsprotokoll" — liniierte Logbuch-Tabelle

## Canvas-Neuzeichnung (js/visualizer.js)

Farbkonstanten auf Papierpalette: Spektrum-Balken in Tintengrün mit
Ochre-Highlights, Oszilloskop als Tintenlinie auf Papier, Tafel III als
gedruckte Figurenbänder; der rote Marker wird zur Burgundy-Nadel.

## Dateien

- `style.css` — Tokens + Komponenten-Skins (Selektorstruktur bleibt)
- `index.html` — Tafelnummern, FIG-Captions, Titelblatt-Header (kleine Zusätze)
- `js/visualizer.js` — Canvas-Farbkonstanten
- `manifest.webmanifest` — `theme_color`/`background_color` auf `#F2EDDF`
- Tests: `tests/pwa.test.js` Icon-Pixel-Test an neue Icon-Basis anpassen (falls
  Icons regeneriert werden) bzw. Manifest-Assertion
- **Keine Logik-Änderungen** — app.js, targets.js, engine-logic.js, journal.js
  bleiben unberührt

## Icons

Werden aus der neuen Palette regeneriert (Papier-Grund, Tintengrün-Welle) —
gleiche Dateinamen, gleiche Maße, `apple-touch-icon` bleibt verlinkt.

## Testing & Verifikation

- `npm test` (66) + `npm run e2e` (20) + smoke (12) + mobile audit (10) bleiben grün
- Live-Preview: Tafeln als Papierplatten, Canvas in Papierpalette, NOT-AUS/
  Sperr-Banner lesbar, 390px weiter ohne Horizontal-Scroll
- SW-Cache bumpt automatisch per Pre-Commit-Hook

## Explizit nicht im Scope

Kein Layout-Umbau, kein Framework, keine Feature-Änderungen, keine
Kachel-Umordnung. Rein visuelle Neukleidung — per Git revertierbar.
