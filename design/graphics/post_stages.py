"""SVG из Illustrator → web/public/img/illo: без служебного мусора, подписи из .labels.txt живым текстом.

    python3 -I post_stages.py
"""
import html
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "ai"
OUT = HERE.parent.parent / "web" / "public" / "img" / "illo"

M = "#8AA094"
H = "#EEF4F0"
CLS = {
    "m": (10, M, 400), "m9": (9, M, 400), "m11": (11, M, 400),
    "h": (10, H, 400), "h9": (9, H, 400), "hb": (11, H, 600),
    "o": (10, "#0CDC78", 400), "y": (10, "#FFA717", 400),
    "r": (10, "#FF5A64", 400), "rb": (11, "#FF5A64", 600),
}
FONT = "Plex Mono, monospace"


def labels(name):
    f = SRC / f"{name}.labels.txt"
    out = []
    for line in re.split(r"[\r\n]+", f.read_text("utf-8")):
        if not line.strip():
            continue
        x, y, cls, anchor, text = (line.split("\t") + [""] * 5)[:5]
        size, fill, wt = CLS[cls]
        a = "" if anchor == "start" else f' text-anchor="{anchor}"'
        w = "" if wt == 400 else f' font-weight="{wt}"'
        out.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}"{w}{a}>{html.escape(text)}</text>')
    return f'<g font-family="{FONT}">{"".join(out)}</g>'


def clean(name):
    s = (SRC / f"{name}.svg").read_text("utf-8")
    s = re.sub(r"<\?xml[^>]*>\s*", "", s)
    s = re.sub(r"<!--.*?-->\s*", "", s, flags=re.S)
    s = re.sub(r"<svg[^>]*>", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" fill="none">', s, count=1)
    s = re.sub(r"<title>.*?</title>", "", s)
    pre = name.split("-")[1]
    s = re.sub(r'id="([^"]+)"', lambda m: f'id="{pre}-{m.group(1)}"', s)
    s = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{pre}-{m.group(1)})", s)
    s = s.replace("</svg>", labels(name) + "</svg>")
    return re.sub(r">\s+<", "><", s).strip()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for p in sorted(SRC.glob("stage-*.svg")):
        (OUT / p.name).write_text(clean(p.stem), "utf-8")
        print(p.name)


if __name__ == "__main__":
    main()
