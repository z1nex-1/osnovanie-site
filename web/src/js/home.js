import { boot, gsap, ScrollTrigger, still, claimCard, loadJSON } from "./common.js";
import { runIntro } from "./intro.js";
import { loadGraph, loadFacts, applyFacts, waveFrom, short } from "./graph.js";
import "../styles/home.css";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const desktop = () => matchMedia("(min-width: 900px)").matches;

let quotes = [];

/* ---------- стратиграфия ---------- */
function strata(graph) {
  const host = $("#gl");
  const steps = [...document.querySelectorAll(".strata-steps li")];
  const hero = $(".strata-hero");
  const meterBar = $("#meterBar"), meterLabel = $("#meterLabel");
  let stack = null;
  const gl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
  if (gl) import("./stack3d.js").then(({ createStack }) => {
    const pop = document.createElement("div");
    pop.className = "qpop";
    document.body.append(pop);
    stack = createStack(host, graph, {
      onHover(node, e) {
        if (!node) { pop.classList.remove("on"); return; }
        const c = graph.claims[node.id] || { id: node.id, type: node.type, quote: node.label };
        pop.innerHTML = claimCard(c);
        pop.style.left = Math.min(e.clientX + 18, innerWidth - pop.offsetWidth - 16) + "px";
        pop.style.top = Math.min(e.clientY + 18, innerHeight - pop.offsetHeight - 16) + "px";
        pop.classList.add("on");
      },
    });
    host.classList.add("live");
    $(".strata-poster", host)?.remove();
    if (still()) { stack.open = 1; stack.freeze(true); }
  }).catch(() => host.classList.add("flat"));
  else host.classList.add("flat");

  const setStep = (i) => steps.forEach((s, k) => s.classList.toggle("on", k === i));
  if (still()) {
    document.body.classList.add("strata-static");
    return;
  }
  let lastStep = -2;
  ScrollTrigger.create({
    trigger: "#strata", pin: ".strata-pin", start: "top top", end: () => "+=" + innerHeight * (desktop() ? 4.2 : 3.6), scrub: true,
    onUpdate(self) {
      const p = self.progress;
      const heroOut = gsap.utils.clamp(0, 1, (p - 0.04) / 0.1);
      hero.style.opacity = String(1 - heroOut);
      hero.style.transform = `translateY(${-heroOut * 60}px)`;
      hero.style.pointerEvents = heroOut > 0.5 ? "none" : "";
      const open = gsap.utils.clamp(0, 1, (p - 0.1) / 0.16);
      if (stack) stack.open = open;
      const i = p < 0.2 ? -1 : Math.min(4, Math.floor((p - 0.2) / 0.16));
      if (i !== lastStep) { lastStep = i; setStep(i); stack?.focus(i); }
      meterBar.style.transform = `scaleY(${Math.max(0, (p - 0.2) / 0.8)})`;
      meterLabel.textContent = i < 0 ? "знак" : `слой 0${i + 1}`;
    },
  });
  addEventListener("osn:motion", (e) => { if (stack) stack.freeze(e.detail.still); });
}

/* ---------- лента источников ---------- */
function ticker() {
  const t = $("#ticker");
  if (!quotes.length) return;
  const row = quotes.map((q) => `<span><b>${esc(q.domain)}</b> «${esc(short(q.quote, 90))}»</span>`).join("");
  t.innerHTML = row + row;
}

/* ---------- чат против основания ---------- */
function versus() {
  const by = Object.fromEntries(quotes.map((q) => [q.n, q]));
  const ref = (n, label) => {
    const q = by[n];
    if (!q) return label;
    return `<a class="cref" href="${esc(q.url)}" target="_blank" rel="noopener" data-claim="r${n}" data-type="fact" data-quote="${esc(q.quote)}" data-domain="${esc(q.domain)}" data-captured="${esc(q.date)}">${label}</a>`;
  };
  $("#baseText").innerHTML =
    `Корпоративный запуск: «Лайт» бесплатно, «Про» — 299 ₽ в месяц ${ref(6, "r6")}. Рядом бесплатные уровни агрегаторов ${ref(17, "r17")} и 300 токенов в подписке Билайна ${ref(13, "r13")}. ИИ-сервисами пользуются 55% россиян старше 12 лет ${ref(23, "r23")}, а платная подписка мешает 15% опрошенных ${ref(22, "r22")}. Что малый бизнес заплатит больше — <span class="hypt" data-claim="H2" data-type="hypothesis" data-quote="Малый бизнес и фрилансеры переходят из «Лайт» в «Про» чаще, чем крупные компании. Опросов сегмента в открытых источниках нет; проверка — 10 интервью с закупщиками.">гипотеза H2</span>: опросов сегмента нет.`;
  const nums = document.querySelectorAll("#chatText .vnum");
  nums.forEach((n) => n.setAttribute("data-hot", ""));
  if (still()) return;
  gsap.from("#baseText .cref, #baseText .hypt", {
    scrollTrigger: { trigger: "#versus .vs-grid", start: "top 70%" },
    backgroundColor: "rgba(12,220,120,.5)", duration: 1.2, stagger: 0.18, ease: "power2.out",
  });
  gsap.fromTo(nums, { "--strike": 0 }, { "--strike": 1, duration: 0.6, stagger: 0.2, ease: "power2.inOut", scrollTrigger: { trigger: "#versus .vs-grid", start: "top 55%" } });
}

/* ---------- горизонтальная лента этапов ---------- */
function track() {
  const rail = $("#rail");
  const line = $("#trackLine line");
  const stages = [...rail.querySelectorAll(".stage")];
  if (still()) { stages.forEach((s) => s.classList.add("on")); return; }
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    const dist = () => rail.scrollWidth - innerWidth + 80;
    const tw = gsap.to(rail, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "#track", pin: ".track-pin", start: "top top", end: () => "+=" + dist(), scrub: 0.6, invalidateOnRefresh: true,
        onUpdate(self) {
          line.style.strokeDashoffset = String(1 - self.progress);
          stages.forEach((s, i) => s.classList.toggle("on", self.progress >= i / stages.length - 0.02));
        },
      },
    });
    return () => tw.kill();
  });
  mm.add("(max-width: 899px)", () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("on")), { threshold: 0.4 });
    stages.forEach((s) => io.observe(s));
    return () => io.disconnect();
  });
}

/* ---------- волна пересмотра ---------- */
function waveSection(graph) {
  const svg = $("#waveSvg");
  const W = 1000, H = 560;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const cols = graph.layers.map((l, i) => 70 + i * ((W - 140) / 4));
  const pos = new Map();
  graph.layers.forEach((l, i) => {
    const n = l.nodes.length;
    l.nodes.forEach((node, k) => {
      const y = n === 1 ? H / 2 : 50 + (k * (H - 100)) / Math.max(1, n - 1);
      pos.set(node.id, { x: cols[i] + (n > 14 ? (k % 2 ? 16 : -16) : 0), y, node, layer: i });
    });
  });
  let edgesSvg = "";
  graph.edges.forEach(([a, b], i) => {
    const A = pos.get(a), B = pos.get(b);
    if (!A || !B) return;
    const mx = (A.x + B.x) / 2;
    edgesSvg += `<path class="e" data-a="${esc(a)}" data-b="${esc(b)}" d="M${B.x} ${B.y}C${mx} ${B.y} ${mx} ${A.y} ${A.x} ${A.y}"/>`;
  });
  let nodesSvg = "";
  for (const [id, p] of pos) {
    const t = p.node.type;
    const r = p.layer >= 3 ? 9 : p.layer === 0 ? 4 : 5.5;
    const shape = p.layer >= 3
      ? `<polygon points="${p.x},${p.y - r * 1.3} ${p.x + r * 1.3},${p.y} ${p.x},${p.y + r * 1.3} ${p.x - r * 1.3},${p.y}"/>`
      : `<circle cx="${p.x}" cy="${p.y}" r="${r}"/>`;
    const lab = p.layer === 3 ? `<text x="${p.x + 16}" y="${p.y + 4}">${esc(short(p.node.label, 24))}</text>` : p.layer === 4 ? `<text x="${p.x}" y="${p.y + 30}" text-anchor="middle">${esc(short(p.node.label, 18))}</text>` : "";
    const c = graph.claims[id];
    nodesSvg += `<g class="n t-${esc(t)}" data-id="${esc(id)}" tabindex="-1"${c?.quote ? ` data-claim="${esc(id)}" data-type="${esc(c.type)}" data-quote="${esc(c.quote)}" data-domain="${esc(c.domain || "")}"` : ""}>${shape}${lab}</g>`;
  }
  const heads = graph.layers.map((l, i) => `<text class="h" x="${cols[i]}" y="20" text-anchor="middle">${esc(l.name.toLowerCase())}</text>`).join("");
  svg.innerHTML = `<g class="heads">${heads}</g><g class="edges">${edgesSvg}</g><g class="nodes">${nodesSvg}</g>`;

  const w = graph.wave || {};
  const ids = new Set(pos.keys());
  let start = (w.start || w.changed || w.seed || []).filter((id) => ids.has(id));
  if (!start.length) start = ["r13"].filter((id) => ids.has(id));
  if (!start.length) start = [graph.layers[1].nodes[0]?.id].filter(Boolean);
  const layers = Array.isArray(w.layers) && w.layers.length ? w.layers : waveFrom(graph, start);
  const startClaim = graph.claims[start[0]];
  $("#waveFact").innerHTML = w.text ? esc(w.text) : startClaim ? `«${esc(short(startClaim.quote, 140))}» <span class="mono mute">— ${esc(startClaim.domain || "")}</span>` : "Новый факт";
  const opts = graph.layers[3].nodes;
  const optsEl = $("#waveOpts");
  optsEl.innerHTML = opts.map((o) => `<div class="wo" data-id="${esc(o.id)}"><span class="mono">${esc(o.id)}</span><b>${esc(short(o.label, 44))}</b><i class="mono">держится</i></div>`).join("");
  const depth = new Map();
  layers.forEach((l, d) => l.forEach((id) => depth.set(id, d)));
  const hitCount = depth.size;
  const btn = $("#waveBtn");
  btn.disabled = false;
  let fired = false;
  const reset = () => {
    svg.querySelectorAll(".hit").forEach((e) => e.classList.remove("hit"));
    optsEl.querySelectorAll(".wo").forEach((e) => { e.classList.remove("hit"); e.querySelector("i").textContent = "держится"; });
    $("#waveNote").textContent = "";
  };
  btn.addEventListener("click", () => {
    if (fired) { reset(); fired = false; btn.innerHTML = 'Добавить новый факт <span class="arr">↯</span>'; return; }
    fired = true;
    btn.innerHTML = 'Сбросить <span class="arr">↺</span>';
    const step = still() ? 0 : 420;
    layers.forEach((l, d) => setTimeout(() => {
      l.forEach((id) => {
        svg.querySelector(`.n[data-id="${CSS.escape(id)}"]`)?.classList.add("hit");
        svg.querySelectorAll(`.e[data-b="${CSS.escape(id)}"]`).forEach((e) => { if (depth.has(e.dataset.a)) e.classList.add("hit"); });
        const o = optsEl.querySelector(`.wo[data-id="${CSS.escape(id)}"]`);
        if (o) { o.classList.add("hit"); o.querySelector("i").textContent = `пересмотреть · шаг ${d}`; }
      });
      if (d === layers.length - 1) $("#waveNote").textContent = `затронуто ${hitCount} узлов за ${layers.length - 1} шаг(а) по связям. Агент покажет разницу в стратегии и остановится на точке R.`;
    }, d * step));
  });
  ScrollTrigger.create({ trigger: "#waveStage", start: "top 75%", once: true, onEnter: () => svg.classList.add("drawn") });
}

/* ---------- сканер: луч читает страницу, предложение становится утверждением ---------- */
function scanner() {
  const target = quotes.find((q) => q.n === 6) || quotes[0];
  if (!target) return;
  const lines = $("#docLines");
  const N = 22, hitAt = 13;
  let html = "";
  for (let i = 0; i < N; i++) {
    if (i === hitAt) html += `<p class="dl hitline"><span>${esc(target.quote)}</span></p>`;
    else if (i === 0) html += `<p class="dl ttl"><i style="width:62%"></i></p>`;
    else html += `<p class="dl"><i style="width:${48 + ((i * 37) % 47)}%"></i></p>`;
  }
  lines.innerHTML = html;
  $("#docCard").innerHTML = claimCard({ id: "r6", type: "fact", quote: target.quote, domain: target.domain, captured: target.date });
  const beam = $("#docBeam"), ln = $("#docLn"), card = $("#docCard"), hl = lines.querySelector(".hitline");
  if (still()) { hl.classList.add("lit"); card.classList.add("on"); beam.style.top = hl.offsetTop + "px"; return; }
  ScrollTrigger.create({
    trigger: "#scan", start: "top 60%", end: "bottom 70%", scrub: 0.4,
    onUpdate(self) {
      const doc = $("#scanDoc");
      const y = self.progress * (doc.clientHeight - 20);
      beam.style.transform = `translateY(${y}px)`;
      ln.textContent = `строка ${String(200 + Math.round(self.progress * 90)).padStart(3, "0")}`;
      const lit = y >= hl.offsetTop;
      hl.classList.toggle("lit", lit);
      card.classList.toggle("on", lit);
    },
  });
}

/* ---------- колба: что дошло до агента и что ушло в карантин ---------- */
function flask() {
  const cv = $("#flask");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  new ResizeObserver(size).observe(cv);
  const glyph = "абвгдежзиклмнопрстуфхцчшщэюя0123456789<>/=";
  const P = [];
  let inA = 0, inQ = 0, raf = 0, on = false;
  const spawn = () => {
    const bad = Math.random() < 0.22;
    P.push({ x: W * 0.5 + (Math.random() - 0.5) * W * 0.5, y: -10, vx: 0, vy: 1 + Math.random() * 1.4, bad, ch: glyph[(Math.random() * glyph.length) | 0], life: 0 });
  };
  const draw = () => {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    const gx = W * 0.5, gy = H * 0.42;
    ctx.strokeStyle = "#34503f"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx - W * 0.3, gy); ctx.lineTo(gx - 22, gy); ctx.moveTo(gx + 22, gy); ctx.lineTo(gx + W * 0.3, gy); ctx.stroke();
    ctx.strokeStyle = "#0cdc78"; ctx.beginPath(); ctx.moveTo(gx - 22, gy); ctx.lineTo(gx + 22, gy); ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
    const qx = W * 0.86, qy = H * 0.7;
    ctx.strokeStyle = "#ff5a64"; ctx.strokeRect(qx - 44, qy - 34, 88, 68);
    const ax = W * 0.42, ay = H * 0.86;
    ctx.strokeStyle = "#0cdc78"; ctx.strokeRect(ax - 70, ay - 30, 140, 50);
    ctx.font = '12px "Plex Mono", monospace';
    ctx.fillStyle = "#ff5a64"; ctx.fillText(`карантин ${inQ}`, qx - 44, qy - 42);
    ctx.fillStyle = "#0cdc78"; ctx.fillText(`агенту ${inA}`, ax - 70, ay - 38);
    ctx.fillStyle = "#8aa094"; ctx.fillText("страницы из интернета", 16, 22); ctx.fillText("санитайзер", gx + W * 0.3 - 74, gy - 10);
    if (Math.random() < 0.55) spawn();
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life++;
      if (p.y < gy - 4) { p.x += (gx - p.x) * 0.018; p.y += p.vy; }
      else if (p.bad) { p.x += (qx - p.x) * 0.06; p.y += (qy - p.y) * 0.06; if (Math.abs(p.x - qx) < 30 && Math.abs(p.y - qy) < 24) { inQ++; P.splice(i, 1); continue; } }
      else { p.x += (ax - p.x) * 0.05; p.y += (ay - p.y) * 0.05; if (Math.abs(p.y - ay) < 16) { inA++; P.splice(i, 1); continue; } }
      ctx.fillStyle = p.bad ? (p.y > gy ? "#ff5a64" : "#d8e3dc") : (p.y > gy ? "#0cdc78" : "#d8e3dc");
      ctx.fillText(p.ch, p.x, p.y);
    }
    if (on && !still()) raf = requestAnimationFrame(draw);
  };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  if (still()) { for (let i = 0; i < 60; i++) draw(); }
}

/* ---------- терминал ---------- */
async function terminal() {
  const pre = $("#term");
  let lines;
  try { lines = (await loadJSON("/data/term.json")).lines; } catch {
    lines = [
      ["p", "$ osnovanie claim add --json '{\"type\":\"fact\",\"text\":\"Рынок ИИ-подписок вырос на 40%\"}'"],
      ["r", "Ошибка: Тип fact требует источник и дословную цитату. Иначе запишите как hypothesis."],
      ["p", "$ osnovanie score"],
      ["", "Индекс обоснованности: 85 из 100"],
    ];
  }
  const render = (n, partial = "") => lines.slice(0, n).map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join("\n") + (partial ? "\n" + partial : "");
  if (still()) { pre.innerHTML = render(lines.length); return; }
  pre.innerHTML = "";
  const run = async () => {
    for (let i = 0; i < lines.length; i++) {
      const [c, t] = lines[i];
      if (c === "p") for (let k = 1; k <= t.length; k += 2) { pre.innerHTML = render(i, `<span class="p">${esc(t.slice(0, k))}</span><i class="caret"></i>`); await new Promise((r) => setTimeout(r, 18)); }
      pre.innerHTML = render(i + 1) + '<i class="caret"></i>';
      await new Promise((r) => setTimeout(r, c === "p" ? 260 : 520));
    }
  };
  ScrollTrigger.create({ trigger: pre, start: "top 80%", once: true, onEnter: run });
}

/* ---------- старт ---------- */
(async () => {
  try { quotes = await loadJSON("/data/sources27.json"); } catch { quotes = []; }
  let introP = Promise.resolve(false);
  try { introP = runIntro(quotes.length ? quotes.map((q) => `${q.domain}  ${q.quote}`) : ["основание"]); } catch (e) { document.querySelector(".intro")?.remove(); document.body.style.overflow = ""; }
  applyFacts(await loadFacts());
  const graph = await loadGraph();
  boot();
  strata(graph);
  ticker();
  versus();
  track();
  waveSection(graph);
  scanner();
  flask();
  terminal();
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  await introP;
  ScrollTrigger.refresh();
})();
