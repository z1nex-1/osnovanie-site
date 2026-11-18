"""Журнал событий проекта «Основания» → реплей для сайта (схема osnovanie-replay/1, mode=reference).

Эталонный проект собран детерминированным движком, а не моделью, поэтому реальных секунд
у событий нет: шкала реплея — порядок событий. Реплики «агента» здесь — пояснения,
собранные из записей проекта; пакеты точек и отчёт пересмотра взяты из файлов проекта как есть.

    python3 tools/ref_replay.py ../osnovanie/projects/meganeuroseti-ref web/public/data/ref/replay.json
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

DUR = {"user": 2600, "agent": 1500, "stage": 1300, "source": 380, "claim": 260, "verify": 900, "option": 1300,
       "model": 1700, "gate_open": 2600, "gate_answer": 1600, "review": 3200, "commitment": 1000, "decision": 2000}
STAGE_RU = {"intake": "Постановка", "plan": "План и источники", "research": "Исследование", "options": "Варианты",
            "strategy": "Стратегия", "validation": "Проверка", "decided": "Решение принято", "review": "Пересмотр", "done": "Готово"}
TYPE_LAYER = {"fact": 1, "calculation": 1, "assumption": 2, "hypothesis": 2, "forecast": 2, "opinion": 2}


def rows(state: Path, name: str) -> list[dict]:
    p = state / f"{name}.jsonl"
    return [json.loads(l) for l in p.read_text("utf-8").splitlines() if l.strip()] if p.exists() else []


def latest(items: list[dict]) -> dict[str, dict]:
    out = {}
    for r in items:
        out[r["id"]] = {**out.get(r["id"], {}), **r}
    return out


def domain(url: str | None) -> str:
    return (urlparse(url).hostname or "").removeprefix("www.") if url else ""


def packet(proj: Path, gate: str) -> str:
    p = proj / "outputs" / "gates" / f"{gate}.md"
    if not p.exists():
        return ""
    text = p.read_text("utf-8")
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text[:2400]


def main(proj: Path, out: Path) -> None:
    state = proj / "state"
    meta = json.loads((proj / "project.json").read_text("utf-8"))
    brief = json.loads((state / "brief.json").read_text("utf-8")) if (state / "brief.json").exists() else {}
    claims_raw = latest(rows(state, "claims"))
    sources = latest(rows(state, "sources"))
    options = latest(rows(state, "options"))
    reviews = rows(state, "reviews")
    commitments = latest(rows(state, "commitments"))
    decisions = rows(state, "decisions")
    runs = rows(state, "model_runs")
    gate_rows = rows(state, "gates")

    claims = {}
    for cid, c in claims_raw.items():
        s = sources.get(c.get("source_id") or "")
        claims[cid] = {
            "type": c["type"], "topic": c.get("topic"), "text": c["text"], "status": c.get("status"), "quote": c.get("quote"),
            "source_id": c.get("source_id"), "domain": domain(s.get("origin")) if s else None, "url": s.get("origin") if s else None,
            "captured": (s.get("accessed_at") or "")[:10] if s else None, "hash": s.get("sha256") if s else None,
            "depends_on": c.get("depends_on", []), "confidence": c.get("confidence"), "expires": c.get("expires"),
            "supersedes": c.get("supersedes"), "superseded_by": c.get("superseded_by"),
        }
    src_out = {sid: {"title": s.get("title"), "url": s.get("origin"), "domain": domain(s.get("origin")), "kind": s.get("kind"),
                     "retrieved_at": (s.get("accessed_at") or "")[:10], "published_at": s.get("published_at"),
                     "sha256": s.get("sha256"), "quarantined": bool(s.get("quarantined"))} for sid, s in sources.items()}

    # граф: источники → факты → допущения и гипотезы → выводы и варианты → решение
    layers = [[], [], [], [], []]
    edges = []
    for sid, s in src_out.items():
        layers[0].append({"id": sid, "type": "source", "label": s["domain"] or sid})
    for cid, c in claims.items():
        if c["superseded_by"]:
            continue
        li = 3 if c["topic"] == "conclusion" else TYPE_LAYER.get(c["type"], 2)
        layers[li].append({"id": cid, "type": "conclusion" if li == 3 else c["type"], "label": c["text"][:80]})
        if c["source_id"]:
            edges.append([cid, c["source_id"]])
        for d in c["depends_on"]:
            edges.append([cid, claims[d]["superseded_by"] or d if d in claims else d])
    for oid, o in options.items():
        layers[3].append({"id": oid, "type": "close" if o.get("kind") == "close" else "option", "label": f"{oid}. {o.get('title', '')}"})
        for b in o.get("basis", []):
            edges.append([oid, b])
        for ob in o.get("objections", []):
            for b in ob.get("claims", []):
                edges.append([oid, b])
    if decisions:
        d = decisions[-1]
        layers[4].append({"id": d["id"], "type": "decision", "label": f"Решение: {d['option']}"})
        edges.append([d["id"], d["option"]])
        for b in d.get("bases", []):
            edges.append([d["id"], b])
    alive = {n["id"] for l in layers for n in l}
    edges = [e for e in {tuple(e) for e in edges} if e[0] in alive and e[1] in alive]

    # события
    ev = []
    add = lambda k, **kw: ev.append({"k": k, **kw})
    add("user", text=brief.get("question") or meta.get("question"), who="демо-команда в роли руководителя")
    gate_answers = [g for g in gate_rows if g.get("action") in ("approve", "revise", "reject")]
    answer_of = {}
    for g in gate_answers:
        answer_of.setdefault(g["gate"], []).append(g)
    run_i = 0
    for r in rows(state, "events"):
        k = r.get("kind")
        if k == "brief":
            add("agent", text=f"Понял задачу так. Решение: {brief.get('goal', '—')}. Получатель: {brief.get('recipient', '—')}. Ограничения: {brief.get('constraints', '—')}.")
        elif k == "stage":
            add("stage", stage=r.get("stage"), label=STAGE_RU.get(r.get("stage"), r.get("stage")))
        elif k == "source_plan":
            continue
        elif k == "source_added":
            s = src_out.get(r["id"], {})
            add("source", id=r["id"], op="quarantined" if r.get("quarantined") else "added", title=s.get("title"), domain=s.get("domain"))
        elif k == "claim_added":
            add("claim", id=r["id"], op="added", type=r.get("type"))
        elif k == "claim_superseded":
            add("claim", id=r.get("old"), op="superseded", new_id=r.get("new"))
        elif k == "verify":
            add("verify", verified=r.get("verified"), contested=r.get("contested"))
        elif k == "option":
            o = options.get(r.get("id"), {})
            add("option", id=r.get("id"), title=o.get("title"), thesis=o.get("thesis"), loses_if=o.get("loses_if"),
                objections=[{"by": x.get("by"), "text": x.get("text"), "claims": x.get("claims", [])} for x in o.get("objections", [])])
        elif k == "model_run":
            run = runs[min(run_i, len(runs) - 1)] if runs else {}
            run_i += 1
            add("model", op="run", results=run.get("results") or run.get("options"), breakeven=(run.get("breakeven") or [])[:4],
                assumption_share=run.get("assumption_share"))
        elif k == "gate_open":
            g = r.get("gate")
            add("gate", gate=g, op="open", packet=packet(proj, g))
        elif k in ("gate_approve", "gate_revise", "gate_reject"):
            g = r.get("gate")
            ans = (answer_of.get(g) or [{}]).pop(0) if answer_of.get(g) else {}
            op = k[5:]
            word = {"approve": "да", "revise": "правка", "reject": "нет"}[op]
            extra = (" " + " ".join(ans.get("options", []))) if ans.get("options") else ""
            if ans.get("owner"):
                extra += " ответственный " + ans["owner"]
            add("user", text=f"{g} {word}{extra}", gate=g, who="демо-команда в роли руководителя", note=ans.get("comment"))
            add("gate", gate=g, op=op, channel=r.get("channel"))
        elif k == "review":
            rv = reviews[min(r.get("number", 1) - 1, len(reviews) - 1)] if reviews else {}
            add("review", id=rv.get("id", f"R{r.get('number')}"), note=rv.get("note"), changed=rv.get("changed", []), downstream=rv.get("downstream", []),
                leader_before=rv.get("leader_before"), leader_after=rv.get("leader_after"), leader_changed=r.get("leader_changed"),
                fallen=rv.get("fallen", []), held=rv.get("held"), total=rv.get("total"), params=rv.get("params_changed", []))
        elif k == "commitment":
            c = commitments.get(r.get("id")) or next(iter(commitments.values()), {})
            add("commitment", id=c.get("id"), what=c.get("what"), metric=c.get("metric"), threshold=c.get("threshold"), check_at=c.get("check_at"), review_if=c.get("review_if"))
    if decisions:
        d = decisions[-1]
        add("decision", id=d["id"], option=d["option"], owner=d.get("owner"), bases=d.get("bases", []))

    # шкала: порядок событий
    p = 0
    for i, e in enumerate(ev):
        e["i"], e["t"], e["p"] = i, i, p
        key = f"gate_{'open' if e.get('op') == 'open' else 'answer'}" if e["k"] == "gate" else e["k"]
        p += DUR.get(key, 400)
    chapters = [{"i": e["i"], "p": e["p"], "label": ("Вопрос руководителя" if e["k"] == "user" and e["i"] == 0 else
                 f"Этап: {e['label']}" if e["k"] == "stage" else f"Пересмотр {e['id']}" if e["k"] == "review" else
                 f"{e['gate']}: человек принял" if e["k"] == "gate" else "Решение")}
                for e in ev if (e["k"] == "user" and e["i"] == 0) or e["k"] in ("stage", "review", "decision") or (e["k"] == "gate" and e["op"] != "open")]

    replay = {
        "schema": "osnovanie-replay/1", "id": meta.get("slug"), "title": meta.get("title"),
        "run": {"mode": "reference", "harness": "engine", "model": None, "project": meta.get("slug"), "question": brief.get("question"),
                "note": "Эталонный проект: собран детерминированным движком «Основания» из 27 открытых цитат, чтобы показать механику. Это не прогон модели: реплики агента здесь — пояснения из записей проекта, ответы в точках дала демо-команда."},
        "brief": brief,
        "t_axes": {"play_ms": [0, p]},
        "chapters": chapters,
        "claims": claims, "sources": src_out,
        "options": {oid: {k: o.get(k) for k in ("title", "kind", "thesis", "loses_if", "what_changes", "portfolio")} for oid, o in options.items()},
        "graph": {"layers": [{"key": k, "name": n, "nodes": layers[i]} for i, (k, n) in enumerate(
            [("sources", "Источники"), ("facts", "Факты"), ("beliefs", "Допущения и гипотезы"), ("options", "Выводы и варианты"), ("decision", "Решение")])],
            "edges": [list(e) for e in sorted(edges)]},
        "docs": {name: (proj / "outputs" / f"{name}.md").read_text("utf-8")[:6000] for name in ("monday", "strategy", "review-1") if (proj / "outputs" / f"{name}.md").exists()},
        "totals": {"usd": 0, "events": len(ev), "claims": dict(Counter(c["type"] for c in claims.values())), "sources": len(src_out),
                   "gates": sum(1 for e in ev if e["k"] == "gate" and e["op"] != "open")},
        "events": ev,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(replay, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"{out}: {len(ev)} событий, {len(claims)} утверждений, {len(src_out)} источников, {len(edges)} рёбер")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
