import { boot, still, gsap, ScrollTrigger, loadJSON, setClaims } from "./common.js";
import "../styles/how.css";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const TYPE = {
  fact: ["факт", "ok"], calculation: ["расчёт", "ok"], opinion: ["мнение", "hyp"],
  assumption: ["допущение", "hyp"], hypothesis: ["гипотеза", "hyp"], forecast: ["прогноз", "hyp"],
};
const num = (v) => Number(v).toLocaleString("ru-RU");
const pct = (v) => `${Math.round(v * 100)}%`;
const rangeText = (c) => {
  if (!c.range) return "";
  const [a, b] = c.range;
  return c.unit === "1" ? `${pct(a)} – ${pct(b)}` : `${num(a)} – ${num(b)}`;
};

let C = {}, S = {};

function pipe() {
  const svg = $("#pipe");
  if (still()) return;
  const line = svg.querySelector(".pipe-line");
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 80%" } });
  tl.to(line, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" })
    .from(svg.querySelectorAll(".pipe-in, .pipe-st, .pipe-out"), { opacity: 0, y: 14, stagger: 0.14, duration: 0.5 }, 0.1)
    .from(svg.querySelectorAll(".gt"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", stagger: 0.12, duration: 0.4, ease: "back.out(2)" }, 0.9)
    .from(svg.querySelector(".pipe-r"), { opacity: 0, duration: 0.6 }, 1.5)
    .from(svg.querySelectorAll(".cap"), { opacity: 0, duration: 0.6 }, 1.6);
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("r", "6");
  dot.setAttribute("class", "pipe-dot");
  svg.append(dot);
  const stops = [75, 280, 460, 640, 820, 1000, 1150];
  const run = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 2 });
  stops.forEach((x, i) => {
    run.to(dot, { attr: { cx: x, cy: 105 }, duration: i ? 0.7 : 0, ease: "power1.inOut" });
    if ([1, 2, 4, 5].includes(i)) run.to(dot, { attr: { r: 9 }, duration: 0.18, yoyo: true, repeat: 1 }).to({}, { duration: 0.35 });
  });
}

function anatomy() {
  const c = C.c002, s = S[c.source_id] || {};
  $("#anCard").innerHTML = `
    <div class="ac-top mono"><span class="ac-id">${c.id}</span><span class="tag ok" data-pin="1">${TYPE[c.type][0]}</span><span class="ac-st">проверено</span></div>
    <p class="ac-text">${esc(c.text)}</p>
    <blockquote class="ac-q" data-pin="2"><span class="mono">цитата</span>«${esc(c.quote)}»</blockquote>
    <dl class="ac-dl mono">
      <div data-pin="3"><dt>источник</dt><dd>${esc(s.domain || c.source?.domain)}</dd></div>
      <div data-pin="3"><dt>снято</dt><dd>${esc((s.accessed_at || "").slice(0, 10))}</dd></div>
      <div data-pin="3"><dt>sha256</dt><dd>${esc((s.sha256 || "").slice(0, 16))}…</dd></div>
      <div data-pin="4"><dt>годен до</dt><dd>${esc(c.expires)}</dd></div>
      <div data-pin="5"><dt>значение</dt><dd><b>${num(c.value)}</b> ${esc(c.unit)}</dd></div>
    </dl>
    <p class="ac-foot mono">эталонный проект · не прогон модели</p>`;
  const keys = [...document.querySelectorAll("#anKeys li")];
  const light = (n) => {
    document.querySelectorAll("#anCard [data-pin]").forEach((el) => el.classList.toggle("lit", el.dataset.pin === n));
    keys.forEach((k) => k.classList.toggle("lit", k.dataset.pin === n));
  };
  keys.forEach((k) => {
    k.tabIndex = 0;
    k.addEventListener("pointerenter", () => light(k.dataset.pin));
    k.addEventListener("focus", () => light(k.dataset.pin));
  });
  document.querySelectorAll("#anCard [data-pin]").forEach((el) => el.addEventListener("pointerenter", () => light(el.dataset.pin)));
  if (still()) { light("1"); return; }
  ScrollTrigger.create({
    trigger: ".an", start: "top 60%", end: "bottom 40%",
    onUpdate: (st) => { if (!document.querySelector("#anKeys li:hover")) light(String(1 + Math.min(4, Math.floor(st.progress * 5)))); },
  });
  gsap.from("#anCard", { y: 40, rotate: -1.5, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: "#anCard", start: "top 85%" } });
}

function types() {
  const all = Object.values(C);
  const n = (f) => all.filter(f).length;
  const cols = [
    { cls: "ok", h: "Факт", sub: `${n((c) => ["fact", "calculation"].includes(c.type))} с расчётами`, c: C.c002,
      body: (c) => `<p>${esc(c.text)}</p><div class="meter"><i style="--w:100%"></i></div><p class="mono">цитата сверена · источник ${esc(c.source?.domain)}</p>`,
      rule: "Можно ставить в стратегию как есть." },
    { cls: "hyp", h: "Допущение", sub: `${n((c) => c.type === "assumption")} в проекте`, c: C.c028,
      body: (c) => `<p>${esc(c.text)}</p><div class="rng"><span>${num(c.range[0])}</span><i style="--a:${((c.value - c.range[0]) / (c.range[1] - c.range[0])) * 100}%"></i><span>${num(c.range[1])}</span></div><p class="mono">уверенность ${pct(c.confidence)} · держится на ${c.depends_on.join(", ")}</p>`,
      rule: "Идёт в модель только диапазоном. На пульте его можно двигать." },
    { cls: "obj", h: "Гипотеза", sub: `${n((c) => ["hypothesis", "forecast"].includes(c.type))} в проекте`, c: C.c037,
      body: (c) => `<p>${esc(c.text)}</p><div class="meter"><i style="--w:${c.confidence * 100}%"></i></div><p class="mono">уверенность ${pct(c.confidence)} · проверка: интервью</p>`,
      rule: "Называется гипотезой прямо в тексте и получает план проверки." },
  ];
  $("#tyCols").innerHTML = cols.map((x) => `
    <article class="ty-col ${x.cls}">
      <header><h3>${x.h}</h3><span class="mono">${x.sub}</span></header>
      <span class="mono ty-id" data-claim="${x.c.id}" tabindex="0">${x.c.id}</span>
      ${x.body(x.c)}
      <footer>${x.rule}</footer>
    </article>`).join("");
  if (!still()) {
    gsap.from(".ty-col", { y: 60, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: "#tyCols", start: "top 80%" } });
    gsap.from(".ty-col .meter i, .ty-col .rng i", { scaleX: 0, transformOrigin: "0 50%", duration: 1.1, delay: 0.4, scrollTrigger: { trigger: "#tyCols", start: "top 75%" } });
  }
}

/* записка → утверждение → опоры → источник */
const MEMO = [
  { text: "Запросить у владельца продукта число подписчиков «Про» и конверсию из «Лайт»: от них зависят допущения", refs: ["c028", "c029"] },
  { text: "Собрать 10 интервью с закупщиками малого бизнеса: проверить гипотезу о сегменте", refs: ["c037"] },
  { text: "Подготовить пилот пакета «ИИ в тарифе» на 5 000 абонентов", refs: ["c034"] },
];
function chain() {
  $("#chMemo").innerHTML = `<span class="ch-lab mono">outputs/monday.md</span><h3>Что делать в понедельник</h3><ul>${MEMO.map((m, i) =>
    `<li>${esc(m.text)} ${m.refs.map((r) => `<button type="button" class="cref" data-i="${i}" data-ref="${r}">[${r}]</button>`).join(" ")}</li>`).join("")}</ul>`;
  const box = (c) => {
    const t = TYPE[c.type] || ["", ""];
    return `<div class="ch-box ${t[1]}" data-id="${c.id}"><span class="mono">${c.id} · ${t[0]}</span><p>${esc(c.text)}</p>${c.range ? `<span class="mono">диапазон ${rangeText(c)}</span>` : ""}${c.confidence != null ? `<span class="mono">уверенность ${pct(c.confidence)}</span>` : ""}</div>`;
  };
  const srcBox = (s) => `<div class="ch-box src" data-id="${s.id}"><span class="mono">${s.id} · ${s.kind === "primary" ? "первичный" : "вторичный"}</span><p>${esc(s.title)}</p><span class="mono">${esc(s.domain)} · sha ${esc(s.sha256.slice(0, 10))}…</span></div>`;
  const pick = (ref) => {
    document.querySelectorAll("#chMemo .cref").forEach((b) => b.classList.toggle("on", b.dataset.ref === ref));
    const c = C[ref];
    const deps = (c.depends_on || []).map((d) => C[d]).filter(Boolean);
    const srcIds = [...new Set(deps.map((d) => d.source_id).filter(Boolean))];
    $("#chC1").innerHTML = `<span class="ch-lab mono">утверждение</span>${box(c)}`;
    $("#chC2").innerHTML = `<span class="ch-lab mono">держится на</span>${deps.map(box).join("") || `<p class="mute">опор нет — это пробел</p>`}`;
    $("#chC3").innerHTML = `<span class="ch-lab mono">источник</span>${srcIds.map((id) => S[id] && srcBox(S[id])).join("")}`;
    wires(deps);
    if (!still()) gsap.from("#chC1 .ch-box, #chC2 .ch-box, #chC3 .ch-box", { x: -24, opacity: 0, stagger: 0.08, duration: 0.45, ease: "power2.out" });
  };
  const wires = (deps) => {
    const svg = $("#chWires"), st = $("#chStage").getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${st.width} ${st.height}`);
    if (innerWidth <= 900) { svg.innerHTML = ""; return; }
    const at = (el, side) => { const r = el.getBoundingClientRect(); return [side ? r.right - st.left : r.left - st.left, r.top - st.top + Math.min(r.height / 2, 40)]; };
    const path = (a, b, cls) => { const mx = (a[0] + b[0]) / 2; return `<path class="${cls}" d="M${a[0]} ${a[1]} C${mx} ${a[1]} ${mx} ${b[1]} ${b[0]} ${b[1]}"/>`; };
    const btn = document.querySelector(`#chMemo .cref.on`), c1 = $("#chC1 .ch-box");
    let out = btn && c1 ? path(at(btn, 1), at(c1, 0), "w0") : "";
    deps.forEach((d) => {
      const el = $(`#chC2 [data-id="${d.id}"]`);
      if (!el) return;
      out += path(at(c1, 1), at(el, 0), TYPE[d.type]?.[1] === "ok" ? "w1" : "w2");
      const s = d.source_id && $(`#chC3 [data-id="${d.source_id}"]`);
      if (s) out += path(at(el, 1), at(s, 0), "w1");
    });
    svg.innerHTML = out;
    if (!still()) svg.querySelectorAll("path").forEach((p, i) => {
      const l = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 0.6, delay: 0.15 + i * 0.08, ease: "power2.out" });
    });
  };
  $("#chMemo").addEventListener("click", (e) => { const b = e.target.closest(".cref"); if (b) pick(b.dataset.ref); });
  let cur = "c028";
  new ResizeObserver(() => { const b = $("#chMemo .cref.on"); if (b) { cur = b.dataset.ref; wires((C[cur].depends_on || []).map((d) => C[d]).filter(Boolean)); } }).observe($("#chStage"));
  pick(cur);
}

function gateChat() {
  const msgs = [...document.querySelectorAll("#gtChat .cm")];
  if (still()) return;
  gsap.set(msgs, { opacity: 0, y: 16 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: "#gtChat", start: "top 70%" } });
  msgs.forEach((m, i) => {
    tl.to(m, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, i ? "+=0.55" : 0);
    if (m.classList.contains("deny")) tl.fromTo(m, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" }, "<0.1");
  });
}

const TREE = {
  "AGENTS.md": "Первое, что читает Claude Code в папке. Восемь правил, которые не меняются, порядок этапов и первая команда: <code>bin/osnovanie resume</code>.",
  skills: "Десять навыков: intake, collect, research, options, strategy, validation, review, interview, ux-review, data-analysis. Агент открывает только нужный этапу.",
  sub: "Шесть субагентов со своими доступами: исследователь, скептик, проверяющий, адвокат закрытия, очиститель источников, модельный респондент.",
  hooks: "Пять хуков: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop. Не дают агенту закрыть точку человека, читать сырые источники и карантин, ходить в сеть напрямую.",
  cli: "43 команды одного инструмента: от <code>resume</code> и <code>claim add</code> до <code>whatif</code> и <code>export site</code>. Каждая пишет в журнал, ничего не теряется.",
  methods: "21 методика: JTBD, Кано, RICE, оценка Ферми, юнит-экономика, предмортем, Румельт, анализ конкурирующих гипотез. Агент читает только ту, что нужна этапу.",
  kb: "Проверенные знания между проектами. Факт из прошлого проекта приходит с исходной цитатой и сроком годности.",
  proj: "Один проект — одна папка. Внутри всё, что нужно, чтобы продолжить с того же места через неделю или в другом чате.",
  mat: "Снимки источников. <code>raw</code> и <code>quarantine</code> основному агенту читать запрещено, ему достаются только разобранные утверждения.",
  state: "Журналы в JSONL: утверждения, источники, варианты, точки, события, прогоны модели. Запись дописывается, а не перезаписывается.",
  out: "Единственное место, куда пишет агент: ситуация, варианты, стратегии, записка «Что делать в понедельник», пакет для руководства.",
};
function tree() {
  const items = [...document.querySelectorAll("#tree li")];
  const show = (li) => {
    items.forEach((x) => x.classList.toggle("on", x === li));
    $("#treeNote").innerHTML = `<span class="mono">${li.querySelector("b").textContent}</span><p>${TREE[li.dataset.t]}</p>`;
    if (!still()) gsap.from("#treeNote > *", { y: 10, opacity: 0, stagger: 0.06, duration: 0.3 });
  };
  items.forEach((li) => {
    li.tabIndex = 0;
    li.addEventListener("pointerenter", () => show(li));
    li.addEventListener("focus", () => show(li));
    li.addEventListener("click", () => show(li));
  });
  show(items[0]);
  if (!still()) gsap.from(items, { x: -20, opacity: 0, stagger: 0.05, duration: 0.4, scrollTrigger: { trigger: "#tree", start: "top 80%" } });
}

function flow() {
  if (still()) return;
  gsap.from(".sf-flow li", { y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".sf-flow", start: "top 80%" } });
}

async function main() {
  boot();
  pipe();
  gateChat();
  flow();
  tree();
  const P = await loadJSON("/data/ref/pult.json");
  P.claims.forEach((c) => (C[c.id] = c));
  P.sources.forEach((s) => (S[s.id] = s));
  setClaims(Object.fromEntries(P.claims.map((c) => [c.id, { id: c.id, type: c.type, quote: c.quote || c.text, domain: c.source?.domain, expires: c.expires, confidence: c.confidence }])));
  anatomy();
  types();
  chain();
  ScrollTrigger.refresh();
}
main();
