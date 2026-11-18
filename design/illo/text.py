"""Слова для OG контуром: заголовок «Репером», подпись Plex Mono, блок «знак + слово» из logo/lockup.svg.
Illustrator открывает результат и рисует сцену под ним (draw.jsx, ART.og).

    $PY -I text.py        # PY=/Users/z1nex/saiti/tools-lab/type/venv/bin/python
"""
import pathlib
import re

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent.parent
REPER = pathlib.Path("/Users/z1nex/saiti/kit/type/out/reper/Reper-Regular.otf")
MONO = {
    "cyr": SITE / "site/fonts/ibm-plex-mono-cyrillic-400-normal.woff2",
    "lat": SITE / "site/fonts/ibm-plex-mono-latin-400-normal.woff2",
}


def run(fonts, text, x, y, size, track=0.0):
    """Строка контуром; fonts — список шрифтов, глиф берётся из первого, где он есть."""
    d, cur = [], x
    for ch in text:
        for f in fonts:
            name = f.getBestCmap().get(ord(ch))
            if name:
                break
        gs = f.getGlyphSet()
        upm = f["head"].unitsPerEm
        k = size / upm
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (k, 0, 0, -k, cur, y)))
        d.append(pen.getCommands())
        cur += gs[name].width * k + track * size
    return " ".join(c for c in d if c), cur - x


def main():
    reper = TTFont(REPER)
    mono = [TTFont(MONO["cyr"]), TTFont(MONO["lat"])]
    head = "#EEF4F0"
    parts = []
    for i, line in enumerate(["У каждого", "вывода есть", "основание"]):
        d, w = run([reper], line, 64, 318 + i * 100, 108)
        parts.append(f'<path fill="{head}" d="{d}"/>')
        print(line, round(64 + w))
    d, _ = run(mono, "Неофициальный концепт · MGIMO AI Challenge 2026", 64, 586, 18)
    parts.append(f'<path fill="#7E9488" d="{d}"/>')

    lock = (SITE / "design/logo/lockup.svg").read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', lock).group(1).split()]
    k = 52 / 174
    for m in re.finditer(r'<path[^>]*d="([^"]+)"', lock):
        parts.append(f'<path fill="{head}" transform="translate(64 56) scale({k:.5f})" d="{m.group(1)}"/>')

    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
           + "".join(parts) + "</svg>")
    (HERE / "og-text.svg").write_text(svg)
    print("og-text.svg", len(svg) // 1024, "КБ; блок шириной", round((vb[2] + 2 * vb[0]) * k), "px")


if __name__ == "__main__":
    main()
