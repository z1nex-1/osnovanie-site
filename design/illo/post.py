"""SVG из Illustrator → site/img: без служебного мусора, подписи из .labels.txt живым текстом.

    python3 -I post.py            # все рисунки из ai/
"""
import html
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "ai"
OUT = HERE.parent.parent / "site" / "img"

# SVG вставляется в страницу целиком, поэтому стили подписей привязаны к классу рисунка,
# а id получают приставку: иначе w1 графа и w1 карантина совпадут.
PREFIX = {"graph": "gr", "pipeline": "pl", "quarantine": "qr"}
STYLE = (
    "<style>"
    ".t{font:13px 'IBM Plex Mono',ui-monospace,monospace;fill:#7E9488}"
    ".t-s{font:500 15px 'IBM Plex Sans',system-ui,sans-serif;fill:#D8E3DC}"
    ".t-o{font:600 17px 'IBM Plex Sans',system-ui,sans-serif;fill:#EEF4F0}"
    ".t-g{font:600 15px 'IBM Plex Mono',monospace;fill:#EEF4F0}"
    ".t-r{font:600 15px 'IBM Plex Mono',monospace;fill:#07100C}"
    ".t-q{font:14px 'IBM Plex Mono',monospace;fill:#D8E3DC}"
    ".t-h{fill:#D8E3DC}"
    ".t-x{fill:#FF5A64}"
    ".t-gr{letter-spacing:.06em;text-transform:uppercase;fill:#7E9488}"
    "</style>"
)


def style(name):
    return re.sub(r"(^|})\.", lambda m: f"{m.group(1)}.il-{name} .", STYLE[7:-8]).join(("<style>", "</style>")).replace(".t", ".lb")


def labels(name):
    f = SRC / f"{name}.labels.txt"
    if not f.exists():
        return ""
    out = []
    for line in re.split(r"[\r\n]+", f.read_text("utf-8")):
        if not line.strip():
            continue
        x, y, cls, anchor, text = (line.split("\t") + [""] * 5)[:5]
        if not text:
            continue
        extra = "" if cls == "m" else f" t-{cls}"
        a = "" if anchor == "start" else f' text-anchor="{anchor}"'
        out.append(f'<text class="lb{extra.replace(" t-", " lb-")}" x="{x}" y="{y}"{a}>{html.escape(text)}</text>')
    return f'<g class="labels">{"".join(out)}</g>' if out else ""


def clean(name):
    s = (SRC / f"{name}.svg").read_text("utf-8")
    s = re.sub(r"<\?xml[^>]*>\s*", "", s)
    s = re.sub(r"<!--.*?-->\s*", "", s, flags=re.S)
    s = s.replace('id="Layer_1" ', "")
    s = re.sub(r"<svg ", f'<svg class="il il-{name}" ', s, count=1)
    pre = PREFIX.get(name, name)
    s = re.sub(r'id="([^"]+)"', lambda m: f'id="{pre}-{m.group(1)}"', s)
    s = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{pre}-{m.group(1)})", s)
    lab = labels(name)
    if lab:
        s = re.sub(r"(<svg[^>]*>)", r"\1" + style(name), s, count=1)
        s = s.replace("</svg>", lab + "</svg>")
    s = re.sub(r">\s+<", "><", s).strip()
    return s


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names = sorted(p.stem for p in SRC.glob("*.svg") if p.stem != "og")
    if len(sys.argv) > 1:
        names = [n for n in names if n in sys.argv[1:]]
    total = 0
    for n in names:
        s = clean(n)
        (OUT / f"{n}.svg").write_text(s, "utf-8")
        total += len(s.encode())
    print(f"{len(names)} svg, {total // 1024} КБ → {OUT}")


if __name__ == "__main__":
    main()
