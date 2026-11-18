/* Приводит экспорт проекта (osnovanie-site/1) или запасной набор цитат к одному виду:
   слои узлов, рёбра «опирается на», индекс утверждений для карточки цитаты. */
import { loadJSON } from "./common.js";

const LAYER_OF = { source: 0, fact: 1, assumption: 2, hypothesis: 2, forecast: 2, objection: 2, conclusion: 3, option: 3, decision: 4 };
const LAYER_KEYS = ["sources", "facts", "beliefs", "options", "decision"];
const LAYER_NAMES = ["Источники", "Факты", "Допущения и гипотезы", "Варианты", "Решение"];

export const short = (s, n = 64) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s || "");

function fromExport(p) {
  const claims = {};
  const layers = LAYER_KEYS.map((key, i) => ({ key, name: LAYER_NAMES[i], nodes: [] }));
  const put = (n) => {
    const t = n.kind || n.type || "fact";
    const li = n.layer != null ? (typeof n.layer === "number" ? n.layer : LAYER_KEYS.indexOf(n.layer)) : LAYER_OF[t] ?? 1;
    layers[Math.max(0, Math.min(4, li))].nodes.push({ ...n, type: t, label: n.label || short(n.text || n.title || n.quote || n.id) });
    claims[n.id] = { id: n.id, type: t === "source" ? "fact" : t, quote: n.quote || n.text || n.title, text: n.text, domain: n.domain, captured: n.captured, hash: n.hash || n.sha256, expires: n.expires, confidence: n.confidence };
  };
  if (Array.isArray(p.layers) && p.layers[0]?.nodes) p.layers.forEach((l, i) => l.nodes.forEach((n) => put({ ...n, layer: n.layer ?? i })));
  else (p.nodes || []).forEach(put);
  const edges = (p.edges || []).map((e) => (Array.isArray(e) ? e : [e.from || e.source, e.to || e.target]));
  return { reference: !!p.reference, title: p.title || p.project?.title, layers, edges, claims, wave: p.wave || p.review || null, options: p.options || [], events: p.events || [], raw: p };
}

function fromQuotes(rows) {
  const claims = {};
  const domains = [...new Set(rows.map((r) => r.domain))];
  const src = domains.map((d, i) => ({ id: "s" + (i + 1), type: "source", label: d, domain: d }));
  const facts = rows.map((r) => {
    const id = "r" + r.n;
    claims[id] = { id, type: "fact", quote: r.quote, domain: r.domain, captured: r.date };
    return { id, type: "fact", label: short(r.quote, 54), quote: r.quote, domain: r.domain, captured: r.date };
  });
  const opt = [["O1", "Оставить как есть"], ["O2", "Сместиться в малый бизнес"], ["O3", "Продавать вместе с тарифом"], ["O4", "Закрыть направление"]].map(([id, label]) => ({ id, type: id === "O4" ? "close" : "option", label }));
  const edges = facts.map((f) => [f.id, src[domains.indexOf(f.domain)].id]);
  facts.forEach((f, i) => edges.push([opt[i % 4].id, f.id]));
  opt.forEach((o) => edges.push(["D", o.id]));
  return {
    reference: true, title: "МегаНейросети: запасной набор цитат",
    layers: [
      { key: "sources", name: LAYER_NAMES[0], nodes: src },
      { key: "facts", name: LAYER_NAMES[1], nodes: facts },
      { key: "beliefs", name: LAYER_NAMES[2], nodes: [] },
      { key: "options", name: LAYER_NAMES[3], nodes: opt },
      { key: "decision", name: LAYER_NAMES[4], nodes: [{ id: "D", type: "decision", label: "Решение руководителя" }] },
    ],
    edges, claims, wave: null, options: [], events: [], fallback: true,
  };
}

/* волна: от изменённых узлов вверх по тем, кто на них опирается (рёбра [кто, на что]) */
export function waveFrom(graph, startIds) {
  const up = new Map();
  for (const [a, b] of graph.edges) { if (!up.has(b)) up.set(b, []); up.get(b).push(a); }
  const seen = new Set(startIds);
  const out = [startIds.slice()];
  let cur = startIds;
  while (cur.length) {
    const next = [];
    for (const id of cur) for (const p of up.get(id) || []) if (!seen.has(p)) { seen.add(p); next.push(p); }
    if (next.length) out.push(next);
    cur = next;
  }
  return out;
}

function fromReplay(r) {
  const g = fromExport({ ...r.graph, reference: r.run?.mode === "reference", title: r.title });
  for (const [id, c] of Object.entries(r.claims || {})) g.claims[id] = { id, ...c, quote: c.quote || c.text };
  for (const [id, s] of Object.entries(r.sources || {})) g.claims[id] = { id, type: "fact", quote: s.title, domain: s.domain, captured: s.retrieved_at, hash: s.sha256 };
  const rv = (r.events || []).find((e) => e.k === "review");
  if (rv) g.wave = { start: rv.changed.map((id) => r.claims[id]?.superseded_by || id), text: rv.note ? rv.note[0].toUpperCase() + rv.note.slice(1) : "" };
  g.replay = r;
  return g;
}

let cache = null;
export async function loadGraph() {
  if (cache) return cache;
  try { cache = fromReplay(await loadJSON("/data/ref/replay.json")); return cache; } catch {}
  cache = fromQuotes(await loadJSON("/data/sources27.json"));
  return cache;
}

export async function loadReplay(path = "/data/ref/replay.json") { return loadJSON(path); }

export async function loadFacts() {
  try { return await loadJSON("/data/facts.json"); } catch { return null; }
}

/* подставляет живые числа из facts.json в [data-fact="a.b"]; число не меняется, если ключа нет */
export function applyFacts(facts) {
  if (!facts) return;
  document.querySelectorAll("[data-fact]").forEach((el) => {
    const v = el.dataset.fact.split(".").reduce((o, k) => (o == null ? o : o[k]), facts);
    if (v == null || typeof v === "object") return;
    if (el.hasAttribute("data-count")) el.dataset.count = String(v);
    el.textContent = String(v);
  });
}
