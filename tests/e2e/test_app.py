# -*- coding: utf-8 -*-
"""
E2E-Tests für die Frequenz-App (Playwright, headless Chromium).

Läuft NICHT standalone — wird über with_server.py gestartet, das
`python server.py 8491` hochfährt und wartet:

    python <skill>/scripts/with_server.py \
        --server "python server.py 8593" --port 8593 \
        -- python tests/e2e/test_app.py

Szenarien: Laden · Kachel · Wiedergabe+Journal · Not-Aus · Falle ·
Lern-Demo · PWA-Dev-Guard.
"""
import sys
from playwright.sync_api import sync_playwright

# Windows-Konsolen (cp1252) können Emoji nicht drucken — UTF-8 erzwingen
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8593/"
FAILS = []


def check(name, cond, detail=""):
    tag = "PASS" if cond else "FAIL"
    print(f"[{tag}] {name}" + (f"  ({detail})" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def fresh_page(browser):
    page = browser.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    return page, errors


def tile(page, name):
    return page.locator(".tile", has_text=name).first


def play_stop_cycle(page):
    page.click("#btnPlay")
    page.wait_for_timeout(1400)   # > 1 s: Journal verwirft kürzere Wiedergaben
    page.click("#btnStop")
    page.wait_for_timeout(200)


def journal_rows(page):
    return page.locator("#journalBody tr").count()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ---------- 1) Laden sauber, keine Konsolen-Fehler ----------
        page, errors = fresh_page(browser)
        check("Laden: Titel sichtbar", page.locator("h1").inner_text().strip() == "Frequenz-App")
        check("Laden: 18 Ziel-Kacheln", page.locator(".tile").count() == 18, str(page.locator(".tile").count()))
        check("Laden: keine Konsolen-Fehler", len(errors) == 0, "; ".join(errors[:3]))

        # ---------- 2) Kachel wählen ----------
        tile(page, "Hunde").click()
        page.wait_for_timeout(250)
        hz = page.locator("#hzDisplay").inner_text()
        check("Kachel: Hunde-Grenze 20 kHz angezeigt", "20" in hz, hz)
        check("Kachel: Panel-Inhalte erscheinen",
              page.locator("#infoBody").inner_text().strip() != "" and
              page.locator("#presetChips .chip").count() > 0)

        # ---------- 3) Wiedergabe + Journal-Eintrag ----------
        rows_before = journal_rows(page)
        play_stop_cycle(page)
        page.wait_for_timeout(250)
        rows_after = journal_rows(page)
        check("Journal: Wiedergabe erzeugt Eintrag", rows_after == rows_before + 1,
              f"{rows_before} -> {rows_after}")
        row_text = page.locator("#journalBody tr").first.inner_text()
        check("Journal: Eintrag nennt hunde", "hunde" in row_text.lower(), row_text)

        # ---------- 4) Not-Aus: Banner, Sperre, Entsperren ----------
        page.click("#btnPlay")
        page.wait_for_timeout(300)
        page.click("#btnEstop")
        page.wait_for_timeout(250)
        banner = page.locator(".lockbanner")
        check("Not-Aus: Sperr-Banner erscheint", banner.is_visible())
        playing = page.evaluate("AudioEngine.isPlaying()")
        check("Not-Aus: Ton sofort aus", playing is False, str(playing))
        page.click("#btnUnlock")
        page.wait_for_timeout(250)
        check("Not-Aus: Entsperren entfernt Banner", banner.count() == 0 or not banner.is_visible())

        # ---------- 5) Fallen-Modus: Sichtbarkeit, Start, Countdown, Stopp ----------
        tile(page, "Stechmücken").click()
        page.wait_for_timeout(250)
        page.locator('#modeBtns button[data-mode="enrich"]').click()  # Bereichern = Anlock-Falle
        page.wait_for_timeout(200)
        check("Falle: Sektion sichtbar im Anlock-Modus", page.locator("#trapSection").is_visible())
        page.click("#btnTrapStart")
        page.wait_for_timeout(1400)
        count_txt = page.locator("#trapCount").inner_text()
        check("Falle: Countdown tickt", count_txt not in ("1:00:00", "—"), count_txt)
        playing = page.evaluate("AudioEngine.isPlaying()")
        check("Falle: Ton läuft", playing is True, str(playing))
        page.click("#btnTrapStop")
        page.wait_for_timeout(250)
        check("Falle: Stopp setzt Countdown zurück",
              page.locator("#trapCount").inner_text() == "1:00:00")
        check("Falle: Stopp beendet Ton", page.evaluate("AudioEngine.isPlaying()") is False)

        # Sichtbarkeits-Negativprobe: Tauben-Kachel darf Falle nie zeigen
        tile(page, "Tauben").click()
        page.wait_for_timeout(250)
        check("Falle: bei Tauben unsichtbar", page.locator("#trapSection").is_hidden())

        # ---------- 6) Lern-Demo: Live-Kommentar ----------
        page.locator("#learnBar .learn-btn", has_text="Mensch").click()
        page.wait_for_timeout(1600)
        note = page.locator("#learnNote").inner_text()
        check("Lern-Demo: Kommentar zeigt Frequenz + Hörer", "Hz" in note and "hören" in note, note)
        page.click("#btnEstop")   # Demo sauber abbrechen
        page.wait_for_timeout(200)
        page.click("#btnUnlock")
        page.wait_for_timeout(200)

        # ---------- 7) PWA: Manifest verlinkt, Dev-Guard verhindert SW auf http ----------
        check("PWA: Manifest verlinkt",
              page.evaluate("!!document.querySelector('link[rel=manifest]')"))
        check("PWA: kein SW auf http (Dev-Guard)",
              page.evaluate("navigator.serviceWorker.controller === null"))
        check("PWA: Install-Chip startet versteckt",
              page.evaluate("document.querySelector('#btnInstall').classList.contains('hidden')"))

        browser.close()

    print()
    if FAILS:
        print(f"ERGEBNIS: {len(FAILS)} Fehler: {', '.join(FAILS)}")
        sys.exit(1)
    print("ERGEBNIS: alle Szenarien bestanden")


if __name__ == "__main__":
    main()
