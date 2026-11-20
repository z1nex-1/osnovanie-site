import { boot, still, claimCard, loadJSON } from "./common.js";
import "../styles/replay.css";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const short = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s || "");
const tcls = (t) => ({ fact: "fact", calculation: "fact", assumption: "hyp", hypothesis: "hyp", forecast: "hyp", opinion: "hyp", conclusion: "concl" })[t] || "fact";
const LAYER_OF = { fact: 1, calculation: 1, assumption: 2, hypothesis: 2, forecast: 2, opinion: 2 };

let R, E, T, N, MSG = [];
let claims = {}, sources = {}, options = {};
let cur = 0, p = 0, playing = false, speed = 1, last = 0, held = -1;
let feedLast = null;

/* ---------- текст пакетов: заголовки, списки, жирный, код, ссылки на утверждения ---------- */
function md(text) {
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[((?:[cs]\d{3}(?:,\s*)?)+)\]/g, (_, ids) => ids.split(/,\s*/).map((id) => `<button type="button" class="cref" data-open="${id}">${id}</button>`).join(" "));
  let html = "", list = false;
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trimEnd();
    if (/^- /.test(line)) { if (!list) { html += "<ul>"; list = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
    if (list) { html += "</ul>"; list = false; }
    if (/^# /.test(line)) html += `<h4>${inline(line.slice(2))}</h4>`;
    else if (/^## /.test(line)) html += `<h5>${inline(line.slice(3))}</h5>`;
    else if (line.trim()) html += `<p>${inline(line)}</p>`;
  }
  return html + (list ? "</ul>" : "");
}

/* ---------- граф ---------- */
let G = { layers: [], edges: [], born: new Map(), pos: new Map() };
function buildGraph() {
  let layers;
  if (R.graph?.layers) layers = R.graph.layers.map((l) => ({ ...l, nodes: l.nodes.slice() }));
  else {
    layers = ["Источники", "Факты", "Допущения и гипотезы", "Выводы и варианты", "Решение"].map((name) => ({ name, nodes: [] }));
    Object.keys(sources).forEach((id) => layers[0].nodes.push({ id, type: "source", label: sources[id].domain || id }));
    Object.entries(claims).forEach(([id, c]) => { if (!c.superseded_by) layers[c.topic === "conclusion" ? 3 : LAYER_OF[c.type] ?? 2].nodes.push({ id, type: c.topic === "conclusion" ? "conclusion" : c.type, label: c.text }); });
  }
  let edges = R.graph?.edges;
  if (!edges) {
    edges = [];
    Object.entries(claims).forEach(([id, c]) => { if (c.source_id) edges.push([id, c.source_id]); (c.depends_on || []).forEach((d) => edges.push([id, d])); });
  }
  const born = new Map();
  E.forEach((e, i) => {
    const ids = [];
    if (e.k === "source" || e.k === "option" || e.k === "decision") ids.push(e.id);
    if (e.k === "claim") ids.push(e.op === "superseded" ? e.new_id : e.id);
    ids.forEach((id) => { if (id && !born.has(id)) born.set(id, i); });
  });
  G = { layers, edges, born, pos: new Map() };
}

function drawGraph() {
  const svg = $("#rpSvg");
  const W = Math.max(520, svg.clientWidth || 900), H = Math.max(360, svg.clientHeight || 640);
  G.pos.clear();
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const cols = G.layers.map((_, i) => 30 + i * ((W - 190) / 4));
  G.layers.forEach((l, i) => {
    const n = l.nodes.length;
    l.nodes.forEach((node, k) => {
      const y = n === 1 ? H / 2 : 42 + (k * (H - 64)) / Math.max(1, n - 1);
      G.pos.set(node.id, { x: cols[i] + (n > 16 ? (k % 2 ? 12 : -12) : 0), y, node, layer: i });
    });
  });
  let es = "";
  G.edges.forEach(([a, b]) => {
    const A = G.pos.get(a), B = G.pos.get(b);
    if (!A || !B) return;
    const mx = (A.x + B.x) / 2;
    es += `<path class="e" data-a="${esc(a)}" data-b="${esc(b)}" d="M${B.x} ${B.y}C${mx} ${B.y} ${mx} ${A.y} ${A.x} ${A.y}"/>`;
  });
  let ns = "";
  for (const [id, q] of G.pos) {
    const t = q.node.type;
    const r = q.layer >= 3 ? 8 : q.layer === 0 ? 4 : 5.5;
    const shape = q.layer >= 3 ? `<polygon points="${q.x},${q.y - r * 1.3} ${q.x + r * 1.3},${q.y} ${q.x},${q.y + r * 1.3} ${q.x - r * 1.3},${q.y}"/>` : `<circle cx="${q.x}" cy="${q.y}" r="${r}"/>`;
    const lab = q.layer >= 3 && /^(O\d|d\d)/.test(id) ? `<text x="${q.x + 14}" y="${q.y + 4}">${esc(short(q.node.label, 26))}</text>` : "";
    const full = short(q.node.label, 80), vis = lab ? short(q.node.label, 26) : full;
    ns += `<g class="n t-${esc(t)}" data-id="${esc(id)}" role="button" tabindex="-1" aria-label="${esc(vis)}">${vis !== full ? `<title>${esc(full)}</title>` : ""}${shape}${lab}</g>`;
  }
  const heads = G.layers.map((l, i) => { const [a, b] = l.name.toLowerCase().split(" и "); return `<text class="h" x="${i === 0 ? Math.max(2, cols[i] - 8) : cols[i]}" y="${b ? 10 : 18}" text-anchor="${i === 0 ? "start" : "middle"}">${esc(a)}${b ? `<tspan x="${cols[i]}" dy="13">и ${esc(b)}</tspan>` : ""}</text>`; }).join("");
  svg.innerHTML = `<g>${heads}</g><g class="edges">${es}</g><g class="nodes">${ns}</g>`;
}

function syncGraph(animate) {
  const svg = $("#rpSvg");
  svg.querySelectorAll(".n").forEach((g) => {
    const b = G.born.get(g.dataset.id);
    const on = b == null ? cur >= N : b < cur;
    if (on && !g.classList.contains("on") && animate) { g.classList.add("pop"); setTimeout(() => g.classList.remove("pop"), 700); }
    g.classList.toggle("on", on);
  });
  svg.querySelectorAll(".e").forEach((p) => {
    const a = G.born.get(p.dataset.a), b = G.born.get(p.dataset.b);
    p.classList.toggle("on", (a == null || a < cur) && (b == null || b < cur));
  });
  const rv = E.slice(0, cur).filter((e) => e.k === "review").pop();
  const hit = new Set();
  if (rv) [...(rv.changed || []).map((id) => claims[id]?.superseded_by || id), ...(rv.downstream || [])].forEach((id) => hit.add(id));
  svg.querySelectorAll(".n").forEach((g) => g.classList.toggle("hit", hit.has(g.dataset.id)));
  svg.querySelectorAll(".e").forEach((p) => p.classList.toggle("hit", hit.has(p.dataset.a) && (hit.has(p.dataset.b) || rv?.changed?.some((c) => claims[c]?.superseded_by === p.dataset.b))));
}

/* ---------- лента ---------- */
function chip(id) {
  const c = claims[id], s = sources[id];
  if (s) return `<button type="button" class="chip src${s.quarantined ? " bad" : ""}" data-open="${esc(id)}">${esc(s.domain || id)}</button>`;
  return `<button type="button" class="chip ${tcls(c?.type)}" data-open="${esc(id)}" title="${esc(short(c?.text, 120))}">${esc(id)}</button>`;
}

function feedItem(e) {
  const k = e.k;
  if (k === "user") {
    return `<div class="msg user${e.gate ? " ans" : ""}"><span class="who mono">${esc(e.who || "человек")}</span><p>${esc(e.text)}</p>${e.note ? `<span class="note mono">${esc(e.note)}</span>` : ""}</div>`;
  }
  if (k === "agent") return `<div class="msg agent"><span class="who mono">агент${e.agent && e.agent !== "main" ? " · " + esc(e.agent) : ""}${e.usd ? ` · $${e.usd.toFixed(3)}` : ""}</span>${md(e.text)}</div>`;
  if (k === "stage") return `<div class="stage-div mono"><span>этап · ${esc(e.label || e.stage)}</span></div>`;
  if (k === "verify") return `<div class="msg sys mono">сверил цитаты с текстом источников: совпали ${e.verified}, спорных ${e.contested}</div>`;
  if (k === "claim-sup") return `<div class="msg sys warn mono">${chip(e.id)} заменено на ${chip(e.new_id)} — старое остаётся в истории</div>`;
  if (k === "option") {
    return `<div class="card opt"><header class="mono"><b>${esc(e.id)}</b> вариант</header><h4>${esc(e.title)}</h4><p>${esc(e.thesis)}</p>
${(e.objections || []).map((o) => `<p class="objn"><span class="mono">${esc(o.by)}</span>${esc(o.text)} ${(o.claims || []).map(chip).join(" ")}</p>`).join("")}
${e.loses_if ? `<p class="mono mute">проигрывает, если: ${esc(e.loses_if)}</p>` : ""}</div>`;
  }
  if (k === "model") {
    const res = e.results || {};
    const ids = Object.keys(res);
    if (!ids.length) return `<div class="msg sys mono">модель пересчитана</div>`;
    const min = Math.min(...ids.map((i) => res[i].p10)), max = Math.max(...ids.map((i) => res[i].p90));
    const x = (v) => ((v - min) / (max - min || 1)) * 100;
    const k0 = x(0);
    const fmt = (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + " млн" : Math.round(v / 1e3) + " тыс");
    return `<div class="card model"><header class="mono"><b>модель</b> прибыль в месяц, ₽ · 10–90% исходов · ${e.assumption_share != null ? `доля допущений ${Math.round(e.assumption_share * 100)}%` : ""}</header>
${ids.map((i) => `<div class="bar"><span class="mono">${esc(i)}</span><div class="rng"><i class="zero" style="left:${k0}%"></i><i class="r" style="left:${x(res[i].p10)}%;width:${Math.max(0.6, x(res[i].p90) - x(res[i].p10))}%"></i><i class="b" style="left:${x(res[i].base)}%"></i></div><span class="mono pb">лидер в ${Math.round(res[i].p_best * 100)}%</span></div>`).join("")}
<p class="mono mute">ромб — база ${ids.map((i) => `${i} ${fmt(res[i].base)}`).join(" · ")}. Диапазон, а не одна цифра: допущения помечены.</p></div>`;
  }
  if (k === "gate" && e.op === "open") {
    const title = (e.packet || "").split("\n")[0].replace(/^#\s*/, "") || `Точка ${e.gate}`;
    return `<div class="card gate"><header class="mono"><b>${esc(e.gate)}</b> агент остановился и ждёт человека</header><h4>${esc(title)}</h4><div class="gbtns"><button type="button" class="btn sm" data-answer="${e.i}">Да, утверждаю</button><button type="button" class="btn sm ghost" data-gaterev="${e.i}">Нужны правки</button><button type="button" class="btn sm ghost" data-gate="${e.i}">Пакет точки</button></div><p class="mono gans" hidden></p></div>`;
  }
  if (k === "gate") return `<div class="msg sys ok mono">${esc(e.gate)} закрыта сообщением человека${e.channel ? ` · канал ${esc(e.channel)}` : ""} — хук не даёт агенту закрыть её самому</div>`;
  if (k === "review") {
    return `<div class="card review"><header class="mono"><b>${esc(e.id)}</b> пересмотр при новых данных</header><h4>${esc(e.note ? e.note[0].toUpperCase() + e.note.slice(1) : "Новые данные")}</h4>
<p class="mono">изменилось: ${(e.changed || []).map((id) => `${chip(id)} → ${chip(claims[id]?.superseded_by || id)}`).join(" ")}</p>
<p class="mono">задето по связям: ${(e.downstream || []).map(chip).join(" ")}</p>
${(e.params || []).map((m) => `<p class="mono">в модели: ${esc(m.label)} ${esc(String(m.was))} → ${esc(String(m.now))} ${esc(m.unit || "")} ${chip(m.claim_was)} → ${chip(m.claim_now)}</p>`).join("")}
${(e.fallen || []).length ? `<p class="mono mute">что упало и почему:</p><ul class="fall">${e.fallen.map((f) => `<li>${chip(f.id)} ${esc(f.text.length > 120 ? f.text.slice(0, 118) + "…" : f.text)} <span class="mono mute">держался на ${(f.path || []).slice(1).map(chip).join(" → ")}</span></li>`).join("")}</ul>` : ""}
${e.total ? `<p class="mono ok">устояло ${e.held} из ${e.total} утверждений — их не пересматриваем</p>` : ""}
<p class="mono ${e.leader_changed ? "obj" : "mute"}">лидер ${e.leader_changed ? `сменился: ${esc(e.leader_before)} → ${esc(e.leader_after)}` : `остался прежним: ${esc(e.leader_after || "")}`}</p></div>`;
  }
  if (k === "commitment") return `<div class="card commit"><header class="mono"><b>${esc(e.id)}</b> обязательство с порогом</header><p>${esc(e.what)}</p><p class="mono">метрика: ${esc(e.metric)} · порог ${esc(e.threshold)} · проверить ${esc(e.check_at)}</p><p class="mono mute">пересмотреть, если: ${esc(e.review_if)}</p></div>`;
  if (k === "decision") {
    const o = options[e.option] || {};
    return `<div class="card decision"><header class="mono"><b>решение</b> принято человеком в точке G4</header><h4>${esc(e.option)}. ${esc(o.title || "")}</h4><p class="mono">держится на ${e.bases?.length || 0} утверждениях: ${(e.bases || []).slice(0, 12).map(chip).join(" ")}${(e.bases || []).length > 12 ? " …" : ""}</p><button type="button" class="btn sm" data-memo>Записка на одну страницу <span class="arr">↗</span></button></div>`;
  }
  if (k === "guard") return `<div class="card guard"><header class="mono"><b>защита</b> действие остановлено</header><p>${esc(e.reason)}</p></div>`;
  if (k === "ctx") return `<div class="msg sys mono">${{ compact: "контекст сжат — работа продолжается по файлам проекта", pause: "пауза", resume: "продолжение в новом чате", interrupt: "человек прервал" }[e.op] || esc(e.op)}</div>`;
  return "";
}

const GROUPABLE = { source: "Источники", claim: "Утверждения", sup: "Формулировки обновлены", tool: "Инструменты" };
const gkey = (e) => (e.k === "claim" && e.op === "superseded" ? "sup" : e.k);
const gchip = (e) => (e.k === "tool" ? `<code class="tl">${esc(e.line || e.name)}</code>` : e.k === "claim" && e.op === "superseded" ? `<span class="sup">${chip(e.id)}→${chip(e.new_id)}</span>` : chip(e.id));
function appendFeed(e, animate) {
  const feed = $("#feed");
  const key = gkey(e);
  const grouped = !!GROUPABLE[key];
  if (grouped && feedLast?.k === key) {
    feedLast.n++;
    feedLast.el.querySelector(".cnt").textContent = "+" + feedLast.n;
    feedLast.el.querySelector(".chips").insertAdjacentHTML("beforeend", gchip(e));
    if (e.k === "source" && e.op === "quarantined") feedLast.el.classList.add("has-bad");
  } else {
    const div = document.createElement("div");
    if (grouped) {
      div.className = "msg sys grp" + (key === "sup" ? " supg" : "");
      div.innerHTML = `<span class="mono"><b>${GROUPABLE[key]}</b> <span class="cnt">+1</span>${key === "source" ? " · дата снятия и sha256 у каждого" : key === "claim" ? " · у каждого тип и опора" : key === "sup" ? " · старые остаются в истории" : ""}</span><div class="chips">${gchip(e)}</div>`;
      feedLast = { k: key, n: 1, el: div };
    } else {
      div.innerHTML = feedItem(e);
      feedLast = null;
    }
    if (animate) div.classList.add("in");
    feed.append(div);
    if (e.k === "gate" && e.op === "open") div.dataset.gopen = e.gate;
    if (e.k === "user" && e.gate) {
      const card = [...feed.querySelectorAll(`[data-gopen="${e.gate}"]`)].pop();
      const a = card?.querySelector(".gans");
      if (a) { a.textContent = `ответ из записи: «${e.text}»`; a.hidden = false; card.querySelector(".card")?.classList.add("answered"); }
    }
  }
  if (animate) feed.scrollTo({ top: feed.scrollHeight, behavior: still() ? "auto" : "smooth" });
}

/* ---------- инспектор ---------- */
function rel(id) {
  const holds = [], heldBy = [];
  for (const [a, b] of G.edges) { if (a === id) holds.push(b); if (b === id) heldBy.push(a); }
  return { holds, heldBy };
}
function inspect(id) {
  const body = $("#inspBody");
  const c = claims[id], s = sources[id], o = options[id];
  let html = "";
  if (s) {
    html = `<div class="t mono"><b class="src">источник</b><span>${esc(id)}</span>${s.quarantined ? '<b class="obj">карантин</b>' : ""}</div><h4>${esc(s.title)}</h4>
<dl class="mono"><dt>адрес</dt><dd><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.domain || s.url)}</a></dd><dt>снято</dt><dd>${esc(s.retrieved_at)}</dd>${s.published_at ? `<dt>опубликовано</dt><dd>${esc(s.published_at)}</dd>` : ""}${s.sha256 ? `<dt>sha256</dt><dd>${esc(s.sha256.slice(0, 16))}…</dd>` : ""}</dl>`;
  } else if (c) {
    html = claimCard({ id, ...c, quote: c.quote || c.text });
    if (c.quote && c.text) html += `<p class="ins-text">${esc(c.text)}</p>`;
    if (c.url) html += `<p class="mono"><a href="${esc(c.url)}" target="_blank" rel="noopener">открыть источник ↗</a></p>`;
    if (c.superseded_by) html += `<p class="mono obj">заменено на ${chip(c.superseded_by)}</p>`;
  } else if (o) {
    html = `<div class="t mono"><b>вариант</b><span>${esc(id)}</span></div><h4>${esc(o.title)}</h4><p>${esc(o.thesis)}</p>${o.loses_if ? `<p class="mono mute">проигрывает, если: ${esc(o.loses_if)}</p>` : ""}${o.portfolio ? `<p class="mono mute">портфель: ${esc(o.portfolio)}</p>` : ""}`;
  } else {
    const n = G.pos.get(id)?.node;
    html = `<div class="t mono"><b>${esc(n?.type || "узел")}</b><span>${esc(id)}</span></div><p>${esc(n?.label || id)}</p>`;
  }
  const r = rel(id);
  if (r.holds.length) html += `<p class="mono rel"><span>держится на</span>${r.holds.map(chip).join(" ")}</p>`;
  if (r.heldBy.length) html += `<p class="mono rel"><span>на нём держится</span>${r.heldBy.map(chip).join(" ")}</p>`;
  body.innerHTML = html;
  showInsp();
  $("#rpSvg").querySelectorAll(".n").forEach((g) => g.classList.toggle("sel", g.dataset.id === id || r.holds.includes(g.dataset.id) || r.heldBy.includes(g.dataset.id)));
}
function inspectGate(i) {
  const e = E[i];
  const ans = E.slice(i + 1).find((x) => x.k === "user" && x.gate === e.gate);
  const body = $("#inspBody");
  body.innerHTML = `<div class="t mono"><b class="hypb">${esc(e.gate)}</b><span>точка человека</span></div><div class="packet">${md(e.packet)}</div>
<div class="answer"><p class="mono mute">Вы — руководитель. Агент ждёт вашего слова:</p>
<button type="button" class="btn sm" data-answer="${i}">${esc(ans?.text || e.gate + " да")}</button>
<button type="button" class="btn sm ghost" data-revise="${i}">${esc(e.gate)} правка…</button><p class="mono rev" hidden>В живом прогоне агент вернётся к этапу с вашей правкой и снова остановится здесь. В эталонном проекте правок не было — продолжаем.</p></div>`;
  showInsp();
}
function showInsp() { $("#inspEmpty").hidden = true; $("#inspBody").hidden = false; $("#insp").classList.add("open"); }

/* ---------- шкала ---------- */
function timeline() {
  const pct = (e) => (e.p / T) * 100;
  const stages = E.filter((e) => e.k === "stage");
  $("#lnStage").innerHTML = stages.map((e, k) => {
    const end = stages[k + 1] ? pct(stages[k + 1]) : 100;
    return `<i class="band b${k % 2}" style="left:${pct(e)}%;width:${end - pct(e)}%"><span>${esc(e.label || e.stage)}</span></i>`;
  }).join("") + `<i class="band pre" style="left:0;width:${stages[0] ? pct(stages[0]) : 0}%"><span>постановка</span></i>`;
  $("#lnGate").innerHTML = E.filter((e) => e.k === "gate").map((e) => `<button type="button" class="gm ${e.op === "open" ? "open" : "done"}" style="left:${pct(e)}%" data-seek="${e.i + 1}" title="${esc(e.gate)}: ${e.op === "open" ? "агент ждёт" : "человек ответил"}">${e.op === "open" ? esc(e.gate) : ""}</button>`).join("");
  $("#lnClaim").innerHTML = E.filter((e) => e.k === "claim" || e.k === "option" || e.k === "review").map((e) => `<i class="tk ${e.k === "review" ? "rv" : e.k === "option" ? "op" : tcls(claims[e.id]?.type)}" style="left:${pct(e)}%"></i>`).join("");
  $("#lnSrc").innerHTML = E.filter((e) => e.k === "source" || e.k === "tool").map((e) => `<i class="tk ${e.op === "quarantined" ? "bad" : "src"}" style="left:${pct(e)}%"></i>`).join("");
  const ch = R.chapters || [];
  $("#chapters").innerHTML = ch.map((c) => `<li><button type="button" data-seek="${c.i + 1}" data-ch="${c.i}"><span class="mono">${String(Math.round((c.p / T) * 100)).padStart(2, "0")}%</span>${esc(c.label)}</button></li>`).join("");
}

function updHead() {
  const f = T ? Math.min(1, p / T) : 0;
  $("#head").style.left = f * 100 + "%";
  $("#scrub").setAttribute("aria-valuenow", String(Math.round(f * 100)));
  $("#clock").textContent = `событие ${cur} из ${N}`;
  const mi = MSG.filter((i) => i < cur).length;
  $("#msgCnt").textContent = `сообщение ${mi} из ${MSG.length}`;
  document.querySelectorAll("#chapters button").forEach((b) => b.classList.toggle("on", +b.dataset.ch < cur));
  const cs = E.slice(0, cur);
  const cnt = (f) => cs.filter(f).length;
  const facts = cnt((e) => e.k === "claim" && e.op === "added" && /fact|calc/.test(claims[e.id]?.type || ""));
  const hyp = cnt((e) => e.k === "claim" && e.op === "added" && /assum|hypo|fore|opin/.test(claims[e.id]?.type || ""));
  $("#stats").innerHTML = `<span><b>${cnt((e) => e.k === "source")}</b> источников</span><span><b class="ok">${facts}</b> фактов и расчётов</span><span><b class="hyp">${hyp}</b> допущений и гипотез</span><span><b>${cnt((e) => e.k === "option")}</b> вариантов</span><span><b>${cnt((e) => e.k === "gate" && e.op !== "open")}</b>/5 точек закрыто человеком</span>`;
}

/* ---------- воспроизведение ---------- */
function resetView() {
  $("#feed").innerHTML = "";
  feedLast = null;
  cur = 0;
}
function renderTo(n, animate) {
  n = Math.max(0, Math.min(N, n));
  if (n < cur) { resetView(); animate = false; }
  for (let i = cur; i < n; i++) {
    appendFeed(E[i], animate);
    cur = i + 1;
    if (animate && playing && $("#stopGates").checked && E[i].k === "gate" && E[i].op === "open" && held !== i) {
      held = i;
      pause();
      inspectGate(i);
      p = E[i].p;
      break;
    }
  }
  if (!animate) $("#feed").scrollTop = $("#feed").scrollHeight;
  syncGraph(animate);
  updHead();
}
const idxAt = (pos) => { let lo = 0, hi = N; while (lo < hi) { const m = (lo + hi) >> 1; if (E[m].p <= pos) lo = m + 1; else hi = m; } return lo; };
function seekIdx(n) { pause(); n = Math.max(0, Math.min(N, n)); p = n ? E[n - 1].p : 0; held = n - 1; renderTo(n, false); setHash(); }
function setHash() { try { history.replaceState(null, "", cur ? `#e=${cur}` : location.pathname); } catch {} }

function frame(t) {
  if (!playing) return;
  const dt = Math.min(500, t - last);
  last = t;
  p += dt * speed;
  renderTo(idxAt(p), true);
  if (cur >= N) { pause(); return; }
  if (playing) requestAnimationFrame(frame);
}
function play() {
  if (cur >= N) { resetView(); p = 0; held = -1; syncGraph(false); }
  if (speed === 0) { p = T; held = N - 1; renderTo(N, false); updHead(); setHash(); return; }
  playing = true;
  $("#playIcon").setAttribute("d", "M5 3h4v14H5zM11 3h4v14h-4z");
  $("#play").setAttribute("aria-label", "Пауза");
  last = performance.now();
  requestAnimationFrame(frame);
}
function pause() {
  playing = false;
  $("#playIcon").setAttribute("d", "M5 3l12 7-12 7z");
  $("#play").setAttribute("aria-label", "Пуск");
  setHash();
}

function setSpeed(v) {
  speed = v;
  document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("on", +b.dataset.speed === v));
  if (v === 0) { pause(); p = T; held = N - 1; renderTo(N, false); updHead(); setHash(); }
}

/* ---------- записка ---------- */
const DOC_RU = { monday: "Что делать в понедельник", strategy: "Стратегия", "review-1": "Отчёт пересмотра" };
function memo() {
  const docs = R.docs || {};
  const names = Object.keys(docs);
  if (!names.length) return;
  const dlg = $("#memo");
  const tabs = dlg.querySelector(".memo-tabs");
  const show = (n) => { $("#memoDoc").innerHTML = md(docs[n]); tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.doc === n))); };
  tabs.innerHTML = names.map((n) => `<button type="button" role="tab" class="mono" data-doc="${n}">${esc(DOC_RU[n] || n)}</button>`).join("");
  tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-doc]"); if (b) show(b.dataset.doc); });
  show(names[0]);
  dlg.showModal();
}

/* ---------- события интерфейса ---------- */
function wire() {
  $("#play").addEventListener("click", () => (playing ? pause() : play()));
  document.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => setSpeed(+b.dataset.speed)));
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b));
    if (b.dataset.mode === "sixty") { $("#stopGates").checked = false; speed = T / 60000; document.querySelectorAll("[data-speed]").forEach((x) => x.classList.remove("on")); resetView(); p = 0; held = -1; syncGraph(false); play(); }
    else { $("#stopGates").checked = true; setSpeed(1); }
  }));
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]"); if (o) { inspect(o.dataset.open); return; }
    const gr = e.target.closest("[data-gaterev]"); if (gr) { inspectGate(+gr.dataset.gaterev); $("#inspBody .rev").hidden = false; return; }
    const g = e.target.closest("[data-gate]"); if (g) { inspectGate(+g.dataset.gate); return; }
    const a = e.target.closest("[data-answer]"); if (a) { $("#inspBody").innerHTML = ""; $("#inspBody").hidden = true; $("#inspEmpty").hidden = false; play(); return; }
    const rv = e.target.closest("[data-revise]"); if (rv) { rv.parentElement.querySelector(".rev").hidden = false; return; }
    const s = e.target.closest("[data-seek]"); if (s) { seekIdx(+s.dataset.seek); return; }
    if (e.target.closest("[data-memo]")) memo();
  });
  $("#memoBtn").addEventListener("click", memo);
  $("#msgPrev").addEventListener("click", () => seekIdx(([...MSG].reverse().find((i) => i + 1 < cur) ?? -1) + 1));
  $("#msgNext").addEventListener("click", () => seekIdx((MSG.find((i) => i + 1 > cur) ?? N - 1) + 1));
  $("#share").addEventListener("click", async () => { setHash(); try { await navigator.clipboard.writeText(location.href); $("#share").textContent = "скопировано"; } catch { $("#share").textContent = location.hash; } setTimeout(() => ($("#share").textContent = "ссылка на момент"), 1600); });

  const scrub = $("#scrub");
  const at = (x) => { const r = scrub.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (x - r.left) / r.width)); pause(); p = f * T; held = idxAt(p) - 1; renderTo(idxAt(p), false); };
  let drag = false;
  scrub.addEventListener("pointerdown", (e) => { drag = true; scrub.setPointerCapture(e.pointerId); at(e.clientX); });
  scrub.addEventListener("pointermove", (e) => drag && at(e.clientX));
  scrub.addEventListener("pointerup", () => { drag = false; setHash(); });

  const chapterIdx = () => (R.chapters || []).map((c) => c.i + 1);
  addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, dialog[open]") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === " ") { e.preventDefault(); playing ? pause() : play(); }
    else if (k === "ArrowRight" && e.shiftKey) { e.preventDefault(); seekIdx(chapterIdx().find((i) => i > cur) ?? N); }
    else if (k === "ArrowLeft" && e.shiftKey) { e.preventDefault(); seekIdx([...chapterIdx()].reverse().find((i) => i < cur) ?? 0); }
    else if (k === "ArrowRight") { e.preventDefault(); seekIdx(cur + 1); }
    else if (k === "ArrowLeft") { e.preventDefault(); seekIdx(cur - 1); }
    else if (k === "g" || k === "G" || k === "п" || k === "П") { const g = E.find((x) => x.i >= cur && x.k === "gate" && x.op === "open"); if (g) { seekIdx(g.i + 1); inspectGate(g.i); } }
    else if (["1", "2", "3", "4"].includes(k)) setSpeed([1, 2, 4, 0][+k - 1]);
    else if (k === "Escape") { $("#inspBody").hidden = true; $("#inspEmpty").hidden = false; }
  });
}

(async () => {
  boot();
  const src = new URLSearchParams(location.search).get("run") || "/data/live/replay.json";
  try { R = await loadJSON(src.startsWith("/data/") ? src : "/data/live/replay.json"); }
  catch {
    try { R = await loadJSON("/data/ref/replay.json"); }
    catch { $("#feed").innerHTML = '<p class="mono mute">Файл реплея не загрузился.</p>'; return; }
  }
  E = R.events; N = E.length; MSG = E.filter((e) => e.k === "user" || e.k === "agent" || (e.k === "gate" && e.op === "open")).map((e) => e.i); T = R.t_axes?.play_ms?.[1] || (E[N - 1]?.p ?? 1);
  claims = R.claims || {}; sources = R.sources || {}; options = R.options || {};
  $("#rpTitle").textContent = R.title || "Прогон";
  $("#rpQ").textContent = R.run?.question ? `«${R.run.question}»` : "";
  const ref = R.run?.mode === "reference";
  $("#rpMode").textContent = ref ? "эталонный проект · не прогон модели" : `живой прогон · ${R.run?.model || "модель"} · $${(R.totals?.usd ?? 0).toFixed(2)}`;
  $("#rpMode").classList.toggle("ref", ref);
  if (ref) {
    $("#rpOther").href = "/replay/"; $("#rpOther").textContent = "живой прогон по брифу →";
    $("#rpWhat").textContent = "Это эталонный проект. Его собрал детерминированный движок «Основания» из 27 открытых цитат, чтобы показать механику без модели, а ответы в точках дала демо-команда. Шкала — порядок событий, а не секунды. Живой прогон по брифу МегаФона записан в том же формате и открывается по ссылке вверху.";
  }
  $("#rpNote").textContent = R.run?.note || ""; $("#rpNote").hidden = !R.run?.note;
  if (R.source_hash) $("#rpHash").textContent = `отпечаток журналов: ${R.source_hash.slice(0, 23)}…`;
  $("#memoBtn").disabled = !R.docs || !Object.keys(R.docs).length;
  buildGraph();
  drawGraph();
  $("#rpSvg").addEventListener("click", (e) => { const g = e.target.closest(".n"); if (g) inspect(g.dataset.id); });
  let rz;
  new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => { drawGraph(); syncGraph(false); }, 120); }).observe($("#rpSvg"));
  timeline();
  wire();
  const m = /#e=(\d+)/.exec(location.hash);
  if (m) seekIdx(+m[1]);
  else if (still()) renderTo(N, false);
  else { renderTo(1, true); updHead(); setTimeout(() => { if (!playing && cur <= 1) play(); }, 1200); }
})();
