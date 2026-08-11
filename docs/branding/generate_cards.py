#!/usr/bin/env python3
"""Generates the Trophy Rooms App Store card set (cabinet identity, v6)."""
import subprocess
from pathlib import Path

CARDS = Path(__file__).parent
SHOTS = Path(__file__).parent / "screenshots"  # place raw simulator screenshots here
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# --- Silhouette shape library (viewBox w, h, inner SVG) ---
SHAPES = {
    "cup": (95, 165, """
      <path d="M12 6 h71 v27 c0 33 -16 51 -35 51 c-19 0 -36 -18 -36 -51 z"/>
      <path d="M41 84 h13 l6 24 h-25 z"/>
      <rect x="26" y="108" width="43" height="11" rx="3"/>
      <rect x="18" y="119" width="59" height="46" rx="4"/>"""),
    "star": (60, 117, """
      <polygon points="30,4 37,21 56,22 42,34 46,52 30,42 14,52 18,34 4,22 23,21"/>
      <rect x="24" y="52" width="12" height="42" rx="3"/>
      <rect x="12" y="94" width="36" height="23" rx="4"/>"""),
    "medal": (75, 90, """
      <circle cx="37" cy="34" r="26"/>
      <rect x="31" y="56" width="12" height="16" rx="3"/>
      <rect x="17" y="72" width="41" height="18" rx="4"/>"""),
    "obelisk": (55, 102, """
      <rect x="20" y="4" width="15" height="60" rx="4"/>
      <polygon points="27,0 34,12 21,12"/>
      <rect x="10" y="64" width="35" height="16" rx="3"/>
      <rect x="4" y="80" width="47" height="22" rx="4"/>"""),
    "bigcup": (120, 222, """
      <path d="M18 8 h84 v34 c0 40 -19 62 -42 62 c-23 0 -42 -22 -42 -62 z"/>
      <path d="M52 104 h16 l7 30 h-30 z"/>
      <rect x="34" y="134" width="52" height="14" rx="4"/>
      <rect x="24" y="148" width="72" height="74" rx="5"/>"""),
}

def sil(shape, pos_css, width):
    vw, vh, inner = SHAPES[shape]
    height = round(width * vh / vw)
    return (f'<div class="sil" style="{pos_css}">'
            f'<svg width="{width}" height="{height}" viewBox="0 0 {vw} {vh}">{inner}</svg></div>')

def flank(shape, side, offset, top, width):
    vw, vh, inner = SHAPES[shape]
    height = round(width * vh / vw)
    return (f'<div class="flank" style="{side}: {offset}px; top: {top}px;">'
            f'<svg width="{width}" height="{height}" viewBox="0 0 {vw} {vh}">{inner}</svg></div>')

# --- Card definitions: copy + per-card silhouette variety ---
CARDS_DEF = [
    dict(slug="library", shot="library", kicker="Your Library",
         headline="Every game.<br>One room.", plaque="Library",
         sils=[("cup", "left", 60, 190), ("star", "left", 270, 120), ("medal", "left", 405, 150),
               ("cup", "right", 60, 170), ("obelisk", "right", 250, 110)],
         flanks=[("bigcup", "left", -95, 240), ("bigcup", "right", -85, 220)]),
    dict(slug="collection", shot="collection", kicker="Your Collection",
         headline="Boxed. Sealed.<br>On the shelf.", plaque="The Collection",
         sils=[("medal", "left", 70, 160), ("obelisk", "left", 220, 120),
               ("cup", "right", 70, 200), ("star", "right", 290, 110), ("medal", "right", 420, 140)],
         flanks=[("bigcup", "left", -100, 250)]),
    dict(slug="journal", shot="journal", kicker="Day by day",
         headline="Keep the<br>streak alive.", plaque="Play Journal",
         sils=[("star", "left", 80, 130), ("cup", "left", 230, 180),
               ("medal", "right", 80, 150), ("star", "right", 260, 105)],
         flanks=[("bigcup", "right", -95, 235)]),
    dict(slug="quicklog", shot="log-play", kicker="One tap",
         headline="Tonight&rsquo;s play,<br>logged.", plaque="Quick Log",
         sils=[("obelisk", "left", 60, 115), ("medal", "left", 200, 150), ("cup", "left", 350, 175),
               ("cup", "right", 90, 155)],
         flanks=[]),
    dict(slug="search", shot="search", kicker="Find anything",
         headline="Every platform.<br>One search.", plaque="The Archive",
         sils=[("cup", "left", 90, 165), ("medal", "left", 290, 135),
               ("obelisk", "right", 90, 120), ("cup", "right", 230, 190), ("star", "right", 430, 110)],
         flanks=[("bigcup", "left", -90, 215), ("bigcup", "right", -100, 245)]),
    dict(slug="detail", shot="game-detail", kicker="The full story",
         headline="Every detail,<br>on record.", plaque="Game Details",
         sils=[("star", "left", 60, 125), ("obelisk", "left", 210, 115),
               ("medal", "right", 60, 155), ("cup", "right", 240, 185)],
         flanks=[("bigcup", "left", -105, 255)]),
]

# --- Device geometries ---
IPHONE = dict(cw=1320, ch=2868, shot_prefix="iphone-69", out_prefix="iphone",
              dev_w=780, dev_top=690, dev_radius=50,
              shelf_top=2392, plaque_top=2470, comp_h=444,
              kicker_size=106, kicker_top=138, head_size=148, head_top=292,
              flank_shelf=2392)
IPAD = dict(cw=2064, ch=2752, shot_prefix="ipad-13", out_prefix="ipad",
            dev_w=1080, dev_top=600, dev_radius=44,
            shelf_top=2042, plaque_top=2122, comp_h=678,
            kicker_size=96, kicker_top=112, head_size=122, head_top=252,
            flank_shelf=2042)

TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Yellowtail&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: {cw}px; height: {ch}px; overflow: hidden; }}
  body {{ position: relative; background: #2b1b10; }}
  .wood {{ position: absolute; inset: 0; background:
      repeating-linear-gradient(90deg, transparent 0 216px, rgba(0,0,0,0.42) 216px 221px),
      repeating-linear-gradient(90deg, rgba(255,232,190,0.020) 0 2px, transparent 2px 7px),
      repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 3px, transparent 3px 90px),
      linear-gradient(90deg, #241509 0%, #33200f 22%, #2a1a0c 47%, #362211 71%, #241509 100%); }}
  .light {{ position: absolute; inset: 0; background:
      radial-gradient(ellipse 62% 30% at 50% 24%, rgba(255, 208, 138, 0.16), transparent 68%),
      radial-gradient(ellipse 95% 85% at 50% 45%, transparent 45%, rgba(10, 5, 2, 0.75) 100%); }}
  .grain {{ position: absolute; inset: 0;
      background-image: radial-gradient(circle, rgba(255, 236, 205, 0.035) 1.3px, transparent 1.9px);
      background-size: 9px 9px; }}
  .glass {{ position: absolute; inset: 0; z-index: 40; background:
      linear-gradient(115deg, transparent 34%, rgba(239,231,210,0.08) 40%, rgba(239,231,210,0.02) 47%, transparent 52%),
      linear-gradient(115deg, transparent 58%, rgba(239,231,210,0.045) 62%, transparent 66%); }}
  .kicker {{ position: absolute; top: {kicker_top}px; width: 100%; text-align: center;
      font-family: 'Yellowtail', cursive; font-size: {kicker_size}px; color: #c9a45c;
      transform: rotate(-2.5deg); text-shadow: 0 4px 24px rgba(0,0,0,0.6); }}
  .headline {{ position: absolute; top: {head_top}px; width: 100%; text-align: center;
      font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: {head_size}px;
      line-height: 1.05; letter-spacing: 2px; color: #efe7d2;
      text-shadow: 8px 8px 0 rgba(122, 26, 34, 0.85); }}
  .device {{ position: absolute; top: {dev_top}px; left: 50%; width: {dev_w}px;
      transform: translateX(-50%); border: 8px solid #a5824a; border-radius: {dev_radius}px;
      overflow: hidden; z-index: 20;
      box-shadow: 0 0 0 2px rgba(43, 27, 16, 0.9), 0 30px 80px rgba(0, 0, 0, 0.75); }}
  .device img {{ width: 100%; display: block; }}
  .shelf {{ position: absolute; top: {shelf_top}px; left: 0; width: {cw}px; height: 32px;
      background: linear-gradient(180deg, #e8d5ac 0%, #b08d54 18%, #5c3f22 55%, #2a1a0c 100%);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85); z-index: 30; }}
  .compartment {{ position: absolute; top: {comp_top}px; left: 0; width: {cw}px; height: {comp_h}px;
      z-index: 10; background:
      radial-gradient(ellipse 80% 100% at 50% 72%, rgba(255, 196, 116, 0.42), rgba(255, 190, 110, 0.12) 58%, transparent 80%); }}
  .sil {{ position: absolute; bottom: 0; z-index: 12; }}
  .sil svg {{ display: block; }}
  .sil path, .sil rect, .sil circle, .sil polygon {{ fill: #0d0805; }}
  .flank {{ position: absolute; z-index: 15; }}
  .flank svg {{ display: block; }}
  .flank path, .flank rect, .flank circle, .flank polygon {{ fill: #140d06; }}
  .plaque {{ position: absolute; top: {plaque_top}px; left: 50%; transform: translateX(-50%);
      padding: 16px 50px 12px;
      background: linear-gradient(180deg, #d9bd85 0%, #b8934e 45%, #8a6a33 100%);
      border-radius: 10px; border: 3px solid #5c4520;
      box-shadow: 0 10px 30px rgba(0,0,0,0.65), inset 0 2px 3px rgba(255,240,200,0.7);
      font-family: 'Anton', sans-serif; text-transform: uppercase; font-size: 42px;
      letter-spacing: 12px; text-indent: 12px; color: #3a2a12;
      text-shadow: 0 1px 0 rgba(255, 240, 200, 0.45); z-index: 30; }}
</style></head>
<body>
  <div class="wood"></div>
  <div class="light"></div>
  <div class="grain"></div>
  <div class="kicker">{kicker}</div>
  <div class="headline">{headline}</div>
  {flanks_html}
  <div class="compartment">{sils_html}</div>
  <div class="shelf"></div>
  <div class="device"><img src="file://{shot_path}"></div>
  <div class="plaque">{plaque}</div>
  <div class="glass"></div>
</body></html>
"""

def build(geom):
    outputs = []
    # iPad canvas is wider: spread silhouette clusters proportionally
    xscale = geom["cw"] / 1320
    for i, card in enumerate(CARDS_DEF, start=1):
        sils_html = ""
        for shape, side, pos, width in card["sils"]:
            w = round(width * xscale)
            sils_html += sil(shape, f"{side}: {round(pos * xscale)}px;", w)
        flanks_html = ""
        for shape, side, offset, width in card["flanks"]:
            w = round(width * xscale)
            vh = SHAPES[shape][1]
            h = round(w * vh / SHAPES[shape][0])
            top = geom["flank_shelf"] - h
            flanks_html += flank(shape, side, round(offset * xscale), top, w)
        shot_path = SHOTS / f"{geom['shot_prefix']}-{card['shot']}-dark.png"
        html = TEMPLATE.format(
            cw=geom["cw"], ch=geom["ch"],
            kicker_top=geom["kicker_top"], kicker_size=geom["kicker_size"],
            head_top=geom["head_top"], head_size=geom["head_size"],
            dev_top=geom["dev_top"], dev_w=geom["dev_w"], dev_radius=geom["dev_radius"],
            shelf_top=geom["shelf_top"], comp_top=geom["shelf_top"] + 32,
            comp_h=geom["comp_h"], plaque_top=geom["plaque_top"],
            kicker=card["kicker"], headline=card["headline"], plaque=card["plaque"],
            sils_html=sils_html, flanks_html=flanks_html, shot_path=shot_path,
        )
        html_path = CARDS / f"gen-{geom['out_prefix']}-{i}-{card['slug']}.html"
        html_path.write_text(html)
        png_path = CARDS / f"final-{geom['out_prefix']}-{i}-{card['slug']}.png"
        outputs.append((html_path, png_path, geom["cw"], geom["ch"]))
    return outputs

jobs = build(IPHONE) + build(IPAD)
for html_path, png_path, w, h in jobs:
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--force-device-scale-factor=1",
                    f"--window-size={w},{h}", "--virtual-time-budget=8000",
                    f"--screenshot={png_path}", f"file://{html_path}"],
                   capture_output=True)
    print(f"rendered {png_path.name}")
