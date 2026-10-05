#!/usr/bin/env python3
"""Renders the banner at the top of the Supabase auth emails.

The email templates (trophy-rooms-backend/supabase/email-templates) load it
from https://trophyrooms.org/email-trophies.png at 280px wide, so it is
written straight to public/ under that name. Keep the name: the live
templates in Supabase point at it.

Needs Google Chrome at the standard /Applications path.
"""
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "email-trophies.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Display size in the email, in CSS px. Rendered at 3x for high-DPI screens.
W, H, SCALE = 280, 100, 3

# Same shapes as the brand silhouette library in generate_cards.py and
# src/components/TrophyShelf.tsx: (viewBox w, h, inner SVG)
SHAPES = {
    "cup": (95, 165, """<path d="M12 6 h71 v27 c0 33 -16 51 -35 51 c-19 0 -36 -18 -36 -51 z"/>
      <path d="M41 84 h13 l6 24 h-25 z"/><rect x="26" y="108" width="43" height="11" rx="3"/>
      <rect x="18" y="119" width="59" height="46" rx="4"/>"""),
    "star": (60, 117, """<polygon points="30,4 37,21 56,22 42,34 46,52 30,42 14,52 18,34 4,22 23,21"/>
      <rect x="24" y="52" width="12" height="42" rx="3"/><rect x="12" y="94" width="36" height="23" rx="4"/>"""),
    "medal": (75, 90, """<circle cx="37" cy="34" r="26"/><rect x="31" y="56" width="12" height="16" rx="3"/>
      <rect x="17" y="72" width="41" height="18" rx="4"/>"""),
    "obelisk": (55, 102, """<rect x="20" y="4" width="15" height="60" rx="4"/>
      <polygon points="27,0 34,12 21,12"/><rect x="10" y="64" width="35" height="16" rx="3"/>
      <rect x="4" y="80" width="47" height="22" rx="4"/>"""),
}

# Left to right along the shelf: (shape, height in px)
SHELF = [("star", 30), ("cup", 42), ("medal", 22), ("obelisk", 32),
         ("cup", 36), ("star", 26), ("medal", 20)]


def silhouette(shape, height):
    vw, vh, inner = SHAPES[shape]
    width = round(height * vw / vh, 1)
    return f'<svg width="{width}" height="{height}" viewBox="0 0 {vw} {vh}">{inner}</svg>'


HTML = """<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {w}px; height: {h}px; background: transparent; overflow: hidden; }}
.banner {{ position: relative; width: {w}px; height: {h}px; border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(201, 164, 92, 0.3);
  background:
    radial-gradient(ellipse 70% 85% at 50% 100%, rgba(255, 196, 116, 0.42), rgba(255, 190, 110, 0.08) 62%, transparent 86%),
    radial-gradient(ellipse 95% 90% at 50% 45%, transparent 50%, rgba(10, 5, 2, 0.55) 100%),
    repeating-linear-gradient(90deg, transparent 0 54px, rgba(0, 0, 0, 0.3) 54px 55px),
    linear-gradient(90deg, #241509 0%, #33200f 30%, #2a1a0c 60%, #241509 100%); }}
.wordmark {{ position: absolute; top: 14px; left: 0; width: 100%; text-align: center;
  font-family: 'Anton', sans-serif; font-size: 26px; line-height: 1; letter-spacing: 1.5px;
  text-transform: uppercase; color: #efe7d2; text-shadow: 2px 2px 0 rgba(122, 26, 34, 0.85); }}
.shelf {{ position: absolute; left: 14px; right: 14px; bottom: 5px; display: flex;
  align-items: flex-end; justify-content: space-between; }}
.shelf svg {{ display: block; fill: #0d0805; }}
.ledge {{ position: absolute; left: 0; right: 0; bottom: 0; height: 5px;
  background: linear-gradient(180deg, #e8d5ac 0%, #b08d54 40%, #5c3f22 100%); }}
</style></head><body>
<div class="banner">
  <div class="wordmark">Trophy Rooms</div>
  <div class="shelf">{shelf}</div>
  <div class="ledge"></div>
</div>
</body></html>"""


def main():
    html = HTML.format(w=W, h=H, shelf="".join(silhouette(s, h) for s, h in SHELF))
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "banner.html"
        page.write_text(html)
        subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                        f"--force-device-scale-factor={SCALE}", f"--window-size={W},{H}",
                        "--default-background-color=00000000", "--virtual-time-budget=8000",
                        f"--screenshot={OUT}", f"file://{page}"],
                       check=True, capture_output=True)
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
