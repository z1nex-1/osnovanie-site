"""Лист превью: все SVG из site/img на фоне страницы, с живыми подписями. python3 -I design/illo/sheet.py"""
import pathlib
root = pathlib.Path(__file__).resolve().parent
d = root.parent.parent / "site" / "img"
F = "../../site/fonts/ibm-plex-"
ff = "".join(
    f'@font-face{{font-family:"IBM Plex {fam}";font-weight:{wt};src:url({F}{f}-{sub}{suf}.woff2){";unicode-range:U+0400-04FF" if sub == "cyrillic" else ""}}}'
    for fam, f, wt, suf in (("Mono", "mono", 400, "-400-normal"), ("Mono", "mono", 600, "-600-normal"), ("Sans", "sans", "100 700", "-wght-normal"))
    for sub in ("cyrillic", "latin"))
names = sorted(p.stem for p in d.glob("*.svg"))
small = [n for n in names if n.split("-")[0] in ("src", "kind", "entry")]
big = [n for n in names if n not in small and n != "og"]
h = ["<!doctype html><meta charset=utf-8><style>", ff,
     'body{background:#07100C;margin:0;padding:32px;color:#7E9488;font:12px "IBM Plex Mono"}.row{display:flex;gap:28px;flex-wrap:wrap;margin-bottom:32px}'
     '.row svg{width:96px;height:96px}.big svg{display:block;width:100%;height:auto;margin-bottom:12px;outline:1px dashed #23362C}figure{margin:0 0 20px}</style><div class=row>']
h += [f"<figure>{(d / (n + '.svg')).read_text()}<figcaption>{n}</figcaption></figure>" for n in small]
h.append("</div><div class=big>")
h += [f"<figure>{(d / (n + '.svg')).read_text()}<figcaption>{n}</figcaption></figure>" for n in big]
(root / "sheet.html").write_text("".join(h) + "</div>")
