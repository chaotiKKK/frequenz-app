# -*- coding: utf-8 -*-
"""Smoke-Test gegen die LAUFENDE Preview (http://127.0.0.1:8593/).
Server läuft schon — kein with_server.py nötig (Recon-then-Action-Pfad).

Szenarien: Laden + Konsolen-Fehler · Kachel · Wiedergabe/Journal ·
Not-Aus · Falle · Lern-Demo · Tafel III (7 Bänder).
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8593/"
results = []

def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1100, "height": 900})
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))

    # ---------- 1) Laden ----------
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    check("Laden: 18 Kacheln", page.locator(".tile").count() == 18,
          str(page.locator(".tile").count()))
    check("Laden: null Konsolen-Fehler", not errors, "; ".join(errors[:2]))

    # ---------- 2) Kachel: Katze ----------
    page.locator(".tile", has_text="Katze").first.click()
    page.wait_for_timeout(250)
    info = page.locator("#targetInfo").inner_text() if page.locator("#targetInfo").count() else ""
    check("Kachel Katze: Info-Panel gefüllt", "Katze" in info and "Hz" in info,
          info[:60].replace("\n", " "))

    # ---------- 3) Wiedergabe + Journal ----------
    page.get_by_role("button", name="▶ Ton starten").click()
    page.wait_for_timeout(1200)
    page.get_by_role("button", name="■ Stop").click()
    page.wait_for_timeout(250)
    rows = page.locator("#journalBody tr").count()
    check("Wiedergabe: Journal-Zeile entsteht", rows >= 1, f"{rows} Zeilen")
    stats = page.locator("#journalStats").inner_text() if page.locator("#journalStats").count() else ""
    check("Wiedergabe: Statistik-Kachel sichtbar", "Gesamt" in stats or ":" in stats,
          stats[:50].replace("\n", " "))

    # ---------- 4) Not-Aus ----------
    page.get_by_role("button", name="▶ Ton starten").click()
    page.wait_for_timeout(300)
    page.locator("#btnEstop").click()
    page.wait_for_timeout(250)
    banner = page.locator("#lockBanner").is_visible()
    check("Not-Aus: Sperr-Banner erscheint", banner, "")
    playing = page.evaluate("AudioEngine.isPlaying()")
    check("Not-Aus: Ton sofort tot", not playing, str(playing))
    page.locator("#btnUnlock").click()
    page.wait_for_timeout(200)

    # ---------- 5) Falle (Mücke → Bereichern) ----------
    page.locator(".tile", has_text="Stechmücken").first.click()
    page.wait_for_timeout(200)
    page.locator('[data-mode="enrich"]').first.click()
    page.wait_for_timeout(200)
    trap = page.locator("#trapSection")
    check("Falle: Sektion sichtbar", trap.is_visible(), "")
    cd0 = page.locator("#trapCount").inner_text() if trap.count() else ""
    page.locator("#btnTrapStart").click()
    page.wait_for_timeout(1600)
    cd1 = page.locator("#trapCount").inner_text() if trap.count() else ""
    check("Falle: Countdown tickt", cd0 != cd1, f"{cd0!r} -> {cd1!r}")
    check("Falle: Ton läuft", page.evaluate("AudioEngine.isPlaying()"), "")
    page.locator("#btnEstop").click(); page.wait_for_timeout(200)
    page.locator("#btnUnlock").click()
    page.wait_for_timeout(200)

    # ---------- 6) Lern-Demo ----------
    page.locator(".learn-btn", has_text="Hund").first.click()
    page.wait_for_timeout(1500)
    note = page.locator("#learnNote").inner_text()
    check("Lern-Demo: Kommentar mit Frequenz + Hörern", "Hz" in note and "hören" in note,
          note[:70])
    page.locator(".learn-btn", has_text="Hund").first.click()  # stoppt
    page.wait_for_timeout(200)

    # ---------- 7) Tafel III: 7 Bänder ----------
    bands = page.evaluate("""() => {
        const c = document.getElementById('ranges');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const rows = new Set();
        for (let y = 0; y < c.height; y += 4) {
            for (let x = 0; x < c.width; x += 40) {
                const i = (y * c.width + x) * 4;
                if (d[i + 3] > 0) rows.add(Math.min(6, Math.floor(y / (c.height / 7))));
            }
        }
        return rows.size;
    }""")
    check("Tafel III: 7 Band-Zeilen gezeichnet", bands == 7, f"{bands} Zeilen erkannt")

    browser.close()

fails = [r for r in results if not r[1]]
print(f"\nERGEBNIS: {len(results) - len(fails)}/{len(results)} bestanden")
sys.exit(1 if fails else 0)
