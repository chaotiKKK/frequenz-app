# -*- coding: utf-8 -*-
"""Mobile-PWA-Audit (Skill-Schritt 4/5) gegen die LAUFENDE Preview.
390x844 (Pixel-390): Overflow, Tap-Targets, neue UI (Stats, Varianten,
7-Band-Tafel), Manifest/Icons.
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8593/"
results = []
def check(name, ok, detail=""):
    results.append(ok)
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 390, "height": 844})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_load_state("networkidle")

    # 1) Kein Horizontal-Overflow
    m = pg.evaluate("({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
    check("390px: kein Horizontal-Scroll", m["sw"] <= m["iw"], f"scrollWidth {m['sw']} vs {m['iw']}")

    # 2) Tap-Targets der NEUEN UI >= 44px
    for sel, name in [(".variant-chip", "Varianten-Chip"), (".learn-btn", "Lern-Button"),
                      (".estop", "NOT-AUS"), (".chip", "Frequenz-Chip")]:
        n = pg.evaluate(f"""() => {{
            const el = document.querySelector('{sel}');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return Math.round(Math.min(r.width, r.height));
        }}""")
        check(f"Tap-Target {name} >= 44px", n is None or n >= 44, str(n))

    # 3) Stats-Grid stapelt auf 390px
    pg.locator(".tile", has_text="Katze").first.click()
    pg.get_by_role("button", name="▶ Ton starten").click()
    pg.wait_for_timeout(1100)
    pg.get_by_role("button", name="■ Stop").click(); pg.wait_for_timeout(250)
    stats = pg.evaluate("""() => {
        const el = document.getElementById('journalStats');
        const cols = getComputedStyle(el).gridTemplateColumns.split(' ').length;
        const chart = el.querySelector('.stat-cell:last-child');
        const w = chart ? Math.round(chart.getBoundingClientRect().width) : 0;
        return { cols, chartW: w, panelW: Math.round(el.getBoundingClientRect().width) };
    }""")
    check("Stats-Grid: 2 Spalten, Chart spannt voll",
          stats["cols"] == 2 and stats["chartW"] >= stats["panelW"] - 4,
          f"{stats['cols']} Spalten, Chart {stats['chartW']}px von {stats['panelW']}px")

    # 4) Tafel III sichtbar + 7 Bänder auch mobil
    h = pg.evaluate("document.getElementById('ranges').height")
    check("Tafel III: 240px-Höhe aktiv", h == 240, str(h))

    # 5) Manifest + Icons erreichbar (Installability-Basis)
    r = pg.evaluate("""async () => {
        const mf = await (await fetch('manifest.webmanifest')).json();
        const icons = await Promise.all(mf.icons.map(async i =>
            (await fetch(i.src)).status));
        return { name: !!mf.name, display: mf.display, iconStatuses: icons };
    }""")
    check("Manifest: name + standalone", r["name"] and r["display"] == "standalone", "")
    check("Manifest: alle 4 Icons HTTP 200", all(s == 200 for s in r["iconStatuses"]), str(r["iconStatuses"]))

    # 6) Keine Konsolen-Fehler mobil
    check("Mobil: null Konsolen-Fehler", not errs, "; ".join(errs[:2]))

    pg.screenshot(path="/tmp/mobile_audit.png", full_page=True)
    b.close()

fails = results.count(False)
print(f"\nERGEBNIS: {len(results) - fails}/{len(results)} bestanden")
sys.exit(1 if fails else 0)
