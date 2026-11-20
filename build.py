"""Сборка страницы: src/index.html → site/index.html.

Числа берутся из data/facts.json и osnovanie/docs/facts.json (разделы agent и evals),
реестр цитат — из osnovanie/demo/meganeuroseti-sources.md, матрица требований — из osnovanie/docs/CRITERIA.md.
Руками на странице не пишется ни одно число.

    python3 -I build.py
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
AGENT = ROOT.parent / "osnovanie"
SITE = ROOT / "site"
E = html.escape


def facts():
    d = json.loads((ROOT / "data/facts.json").read_text())
    docs = json.loads((AGENT / "docs/facts.json").read_text())
    day = docs.get("generated_at", "")[:10]
    day = ".".join(reversed(day.split("-"))) if day else ""
    for part in ("agent", "evals"):
        d[part] = {k: {"value": v, "stub": False, "src": f"osnovanie/docs/facts.json → {part}.{k}", "date": day}
                   for k, v in docs.get(part, {}).items() if not isinstance(v, (dict, list))}
    return d


def get(d, path):
    for k in path.split("."):
        d = d[k]
    return d


def fid(path):
    return "f-" + path.replace(".", "-").replace("_", "-")


def num(d, path, label=None):
    f = get(d, path)
    if f.get("stub") or f.get("value") is None:
        return f'<a class="num stub" href="#{fid(path)}" data-f="{path}">{E(label or "не измерено")}</a>'
    v = (label or "@").replace("@", str(f["value"]))
    return f'<a class="num" href="#{fid(path)}" data-f="{path}">{E(v)}</a>'


def walk(d, prefix=""):
    for k, v in d.items():
        if k.startswith("$") or not isinstance(v, dict):
            continue
        p = f"{prefix}{k}"
        if "value" in v or "stub" in v:
            yield p, v
        else:
            yield from walk(v, p + ".")


def factlist(d, used):
    out = []
    for p, f in walk(d):
        if p not in used:
            continue
        val = "не измерено" if f.get("stub") or f.get("value") is None else str(f["value"])
        meta = " · ".join(x for x in (f.get("src", ""), f.get("date", "")) if x)
        out.append(f'<li id="{fid(p)}"><code>{E(p)}</code><b>{E(val)}</b><span>{E(meta)}</span></li>')
    return "".join(out)


def table(md, start):
    rows = []
    for line in md[start:].splitlines()[2:]:
        if not line.startswith("|"):
            break
        rows.append([c.strip() for c in line.strip().strip("|").split("|")])
    return rows


def sources():
    md = (AGENT / "demo/meganeuroseti-sources.md").read_text()
    i = md.index("| # | группа")
    out = []
    for r in table(md, i):
        n, group, url, title, date, quote, closes = r[:7]
        out.append({"n": int(n), "group": group.split(". ", 1)[-1], "url": url, "title": title,
                    "date": date, "quote": quote.strip("«»"), "closes": closes})
    return out


def registry(src):
    out = []
    for s in src:
        host = re.sub(r"^https?://(www\.)?", "", s["url"]).split("/")[0]
        out.append(
            f'<li id="q{s["n"]:02d}"><span class="qn">#{s["n"]:02d}</span>'
            f'<q>{E(s["quote"])}</q>'
            f'<span class="qm"><a href="{E(s["url"])}" rel="noopener" target="_blank">{E(host)}</a> · {E(s["date"])} · {E(s["group"])}</span></li>')
    return "".join(out)


def md_inline(s):
    s = E(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)


STATS = {}


def matrix():
    md = (AGENT / "docs/CRITERIA.md").read_text()
    out = []
    STATS.update(total=0, bad=0)
    for m in re.finditer(r"^## (.+)$", md, re.M):
        try:
            i = md.index("| #", m.end())
        except ValueError:
            continue
        nxt = md.find("\n## ", m.end())
        if nxt != -1 and i > nxt:
            continue
        rows = table(md, i)
        out.append(f'<tr class="grp"><th colspan="4" scope="rowgroup">{E(m.group(1))}</th></tr>')
        for r in rows:
            if len(r) < 4:
                continue
            code, req, where, check = r[0], r[1], r[2], r[3]
            status = r[4] if len(r) > 4 else ""
            bad = bool(re.search(r"(?<!\w)не\s", status.lower())) or "нет" == status.lower()
            STATS["total"] += 1
            STATS["bad"] += bad
            out.append(
                f'<tr><th scope="row">{E(code)}</th><td>{md_inline(req)}</td><td>{md_inline(where)}</td>'
                f'<td>{md_inline(check)}<span class="st{" st-no" if bad else ""}">{md_inline(status)}</span></td></tr>')
    return "".join(out)


def svg(name):
    return (SITE / "img" / f"{name}.svg").read_text()


def build(src_name="index.html"):
    d = facts()
    src = sources()
    t = (ROOT / "src" / src_name).read_text()
    used = set(re.findall(r"\{\{n:([\w.]+)", t))
    t = re.sub(r"\{\{svg:([\w-]+)\}\}", lambda m: svg(m.group(1)), t)
    t = re.sub(r"\{\{n:([\w.]+)(?:\|([^}]+))?\}\}", lambda m: num(d, m.group(1), m.group(2)), t)
    t = t.replace("{{logo}}", re.search(r'd="([^"]+)"', (ROOT / "design/logo/lockup.svg").read_text()).group(1))
    t = t.replace("{{rows}}", (ROOT / "design/tiles/doc-rows.html").read_text())
    t = t.replace("{{registry}}", registry(src))
    t = t.replace("{{matrix}}", matrix())
    t = t.replace("{{matrix_sum}}", f'<span><b>{STATS["total"]}</b>требований из ТЗ и плана</span>'
                  f'<span><b class="ok">{STATS["total"] - STATS["bad"]}</b>закрыто, у каждого есть чем проверить</span>'
                  f'<span><b class="st-no">{STATS["bad"]}</b>не сделано, в таблице отмечены красным</span>')
    t = t.replace("{{factlist}}", factlist(d, used))
    quotes = {f"q{s['n']:02d}": [s["quote"], s["url"], s["date"]] for s in src}
    data = {"facts": {p: f for p, f in walk(d) if p in used}, "quotes": quotes}
    t = t.replace("{{data}}", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
    left = re.findall(r"\{\{[^{}]*", t)
    if left:
        raise SystemExit(f"не заменено: {left[:5]}")
    out = SITE / src_name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(t)
    print(f"{out.relative_to(ROOT)}: {len(t) // 1024} КБ, чисел {len(used)}, цитат {len(src)}")


if __name__ == "__main__":
    build("index.html")
    build("404.html")
    if (ROOT / "src/en/index.html").exists():
        build("en/index.html")
