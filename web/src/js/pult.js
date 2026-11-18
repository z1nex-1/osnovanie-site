import { boot, still, gsap, loadJSON } from "./common.js";
import "../styles/pult.css";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const TYPE = {
  fact: ["факт", "fact"], calculation: ["расчёт", "fact"], opinion: ["мнение", "hyp"],
  assumption: ["допущение", "hyp"], hypothesis: ["гипотеза", "hyp"], forecast: ["прогноз", "hyp"],
};
const STATUS = { verified: "проверено", open: "открыто", stale: "устарело", contested: "спорно", superseded: "заменено" };
const rub = (v) => {
  const a = Math.abs(v), s = v < 0 ? "−" : "";
  return a >= 1e6 ? `${s}${(a / 1e6).toFixed(2).replace(".", ",")} млн` : `${s}${Math.round(a / 1e3)} тыс`;
};
const fmt = (v, unit) => (unit === "1" ? (v < 1 ? `${(v * 100).toFixed(1).replace(".", ",")}%` : `×${v.toFixed(2).replace(".", ",")}`) : Math.round(v).toLocaleString("ru-RU"));

let P, claims = {};

/* ---------- модель: формулы те же, что в state/model.json ---------- */
function compile(expr, names) {
  const toks = expr.match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|[-+*/()]|\S/g) || [];
  for (const t of toks) if (!/^[-+*/()]$/.test(t) && !/^\d/.test(t) && !names.includes(t)) throw new Error("формула: " + t);
  return new Function(...names, `return (${toks.join(" ")});`);
}
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tri = (u, a, m, b) => { if (a === b) return a; const c = (m - a) / (b - a); return u < c ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m)); };

function whatif() {
  const M = P.model;
  const params = M.params, keys = Object.keys(params);
  const consts = Object.fromEntries(Object.entries(M.constants).map(([k, v]) => [k, v.value]));
  const names = [...keys, ...Object.keys(consts)];
  const opts = Object.keys(M.formulas);
  const fns = Object.fromEntries(opts.map((o) => [o, compile(M.formulas[o], names)]));
  const base0 = Object.fromEntries(keys.map((k) => [k, params[k].base]));
  const cur = { ...base0 };
  const N = M.samples || 4000;
  const brk = {};
  (M.breakeven || []).forEach((b) => (brk[b.param] ||= []).push(b));
  const optTitle = Object.fromEntries((Array.isArray(P.options) ? P.options : Object.values(P.options)).map((o) => [o.id, o.title]));

  $("#params").innerHTML = keys.map((k) => {
    const p = params[k];
    const step = p.unit === "1" ? (p.high - p.low) / 200 : Math.max(1, Math.round((p.high - p.low) / 200));
    const ticks = (brk[k] || []).filter((b) => b.threshold >= p.low && b.threshold <= p.high)
      .map((b) => `<i class="brk" style="left:${((b.threshold - p.low) / (p.high - p.low)) * 100}%" title="при ${fmt(b.threshold, p.unit)} лидером станет ${b.new_leader}"><span>→${esc(b.new_leader)}</span></i>`).join("");
    const ck = claims[p.claim];
    return `<div class="prm" data-k="${k}">
  <div class="prm-top"><label for="r-${k}">${esc(p.label)}</label><output class="mono" id="o-${k}">${fmt(p.base, p.unit)}</output></div>
  <div class="prm-rail"><input type="range" id="r-${k}" min="${p.low}" max="${p.high}" step="${step}" value="${p.base}"><i class="agent" style="left:${((p.base - p.low) / (p.high - p.low)) * 100}%" title="значение агента"></i>${ticks}</div>
  <div class="prm-bot mono"><span>${fmt(p.low, p.unit)}</span><button type="button" class="cl ${TYPE[ck?.type]?.[1] || "hyp"}" data-claim-open="${esc(p.claim)}">${esc(p.claim)} · ${esc(TYPE[ck?.type]?.[0] || "допущение")}</button><span>${fmt(p.high, p.unit)}</span></div>
</div>`;
  }).join("");

  const share = M.assumption_share;
  if (share != null) $("#wiShare").textContent = `доля допущений в модели: ${Math.round(share * 100)}% — поэтому агент показывает диапазон, а не одну цифру`;

  const bars = $("#bars");
  bars.innerHTML = opts.map((o) => `<div class="ob" data-o="${o}"><div class="ob-l"><b>${o}</b><span>${esc(optTitle[o] || "")}</span></div><svg class="ob-h" viewBox="0 0 400 46" preserveAspectRatio="none"><path class="hist"/><rect class="band" y="34" height="8"/><line class="zero" y1="0" y2="46"/><line class="base" y1="4" y2="46"/></svg><div class="ob-r mono"><b class="pb">0%</b><span class="bv"></span></div></div>`).join("");

  let raf = 0;
  const compute = () => {
    raf = 0;
    const r = rng(20261114);
    const env = { ...consts };
    const draws = Object.fromEntries(opts.map((o) => [o, new Float64Array(N)]));
    const wins = Object.fromEntries(opts.map((o) => [o, 0]));
    for (let i = 0; i < N; i++) {
      for (const k of keys) env[k] = tri(r(), params[k].low, cur[k], params[k].high);
      const args = names.map((n) => env[n]);
      let best = null, bv = -Infinity;
      for (const o of opts) { const v = fns[o](...args); draws[o][i] = v; if (v > bv) { bv = v; best = o; } }
      wins[best]++;
    }
    const benv = names.map((n) => (n in cur ? cur[n] : consts[n]));
    const base = Object.fromEntries(opts.map((o) => [o, fns[o](...benv)]));
    const stats = {};
    let lo = Infinity, hi = -Infinity;
    for (const o of opts) {
      const s = Array.from(draws[o]).sort((a, b) => a - b);
      stats[o] = { s, p10: s[Math.floor(N * 0.1)], p90: s[Math.floor(N * 0.9)], base: base[o], pb: wins[o] / N };
      lo = Math.min(lo, s[Math.floor(N * 0.02)]); hi = Math.max(hi, s[Math.floor(N * 0.98)]);
    }
    lo = Math.min(lo, 0); hi = Math.max(hi, 0);
    const X = (v) => Math.max(0, Math.min(400, ((v - lo) / (hi - lo || 1)) * 400));
    const leader = opts.reduce((a, b) => (base[b] > base[a] ? b : a));
    for (const o of opts) {
      const st = stats[o], el = bars.querySelector(`[data-o="${o}"]`);
      const bins = new Array(40).fill(0);
      for (const v of st.s) { const b = Math.floor(((v - lo) / (hi - lo || 1)) * 40); if (b >= 0 && b < 40) bins[b]++; }
      const mx = Math.max(...bins) || 1;
      el.querySelector(".hist").setAttribute("d", "M0 30" + bins.map((c, i) => `L${i * 10 + 5} ${30 - (c / mx) * 26}`).join("") + "L400 30Z");
      el.querySelector(".band").setAttribute("x", X(st.p10));
      el.querySelector(".band").setAttribute("width", Math.max(2, X(st.p90) - X(st.p10)));
      el.querySelector(".zero").setAttribute("x1", X(0)); el.querySelector(".zero").setAttribute("x2", X(0));
      el.querySelector(".base").setAttribute("x1", X(st.base)); el.querySelector(".base").setAttribute("x2", X(st.base));
      el.querySelector(".pb").textContent = `${Math.round(st.pb * 100)}%`;
      el.querySelector(".bv").textContent = `база ${rub(st.base)}`;
      el.classList.toggle("lead", o === leader);
    }
    const prev = $("#leader").textContent;
    $("#leader").textContent = leader;
    $("#leaderNote").textContent = `${optTitle[leader] || ""} · лидирует в ${Math.round(stats[leader].pb * 100)}% исходов`;
    const agentLeader = (M.ranking || [])[0];
    $("#leader").classList.toggle("flip", !!agentLeader && leader !== agentLeader);
    if (prev !== "—" && prev !== leader && !still()) gsap.fromTo("#leader", { scale: 1.5, color: "#ff5a64" }, { scale: 1, color: "", duration: .6, ease: "expo.out" });
    const changed = keys.filter((k) => Math.abs(cur[k] - base0[k]) > 1e-9);
    $("#wiCmd").textContent = "osnovanie whatif" + changed.map((k) => ` --set ${k}=${+cur[k].toFixed(4)}`).join("");
    bars.querySelectorAll(".ob").forEach((el) => el.querySelector(".ob-r").setAttribute("aria-label", `${el.dataset.o}: лидер в ${el.querySelector(".pb").textContent} исходов`));
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(compute); };

  $("#params").addEventListener("input", (e) => {
    const inp = e.target.closest("input[type=range]"); if (!inp) return;
    const k = inp.closest(".prm").dataset.k;
    cur[k] = +inp.value;
    $(`#o-${k}`).textContent = fmt(cur[k], params[k].unit);
    inp.closest(".prm").classList.toggle("moved", Math.abs(cur[k] - base0[k]) > 1e-9);
    schedule();
  });
  $("#wiReset").addEventListener("click", () => {
    keys.forEach((k) => { cur[k] = base0[k]; $(`#r-${k}`).value = base0[k]; $(`#o-${k}`).textContent = fmt(base0[k], params[k].unit); });
    document.querySelectorAll(".prm.moved").forEach((x) => x.classList.remove("moved"));
    schedule();
  });
  compute();
}

/* ---------- реестр ---------- */
function registry() {
  const list = P.claims;
  const groups = [["all", "все", () => true], ["fact", "факты и расчёты", (c) => TYPE[c.type]?.[1] === "fact"], ["hyp", "допущения и гипотезы", (c) => TYPE[c.type]?.[1] === "hyp"], ["stale", "устаревшие и заменённые", (c) => c.status === "stale" || c.superseded_by]];
  let filt = "all", q = "";
  $("#filters").innerHTML = groups.map(([k, l, f]) => `<button type="button" data-f="${k}" class="${k === "all" ? "on" : ""}">${l} <b>${list.filter(f).length}</b></button>`).join("");
  const row = (c) => {
    const [tl, tc] = TYPE[c.type] || [c.type, "fact"];
    const dom = c.source?.domain || (c.source?.origin ? new URL(c.source.origin).hostname.replace(/^www\./, "") : "");
    const support = dom ? esc(dom) : c.range ? `диапазон ${esc(c.range.join?.("–") ?? c.range)}` : c.confidence != null ? `уверенность ${Math.round(c.confidence * 100)}%` : (c.depends_on || []).length ? `из ${c.depends_on.map(esc).join(", ")}` : "—";
    return `<div class="rg-row${c.superseded_by ? " dead" : ""}" role="row" data-id="${c.id}" tabindex="0" aria-expanded="false"><span class="mono" role="gridcell">${c.id}</span><span role="gridcell"><i class="tg ${tc}">${tl}</i></span><span class="tx" role="gridcell">${esc(c.text)}</span><span class="mono sp" role="gridcell">${support}</span><span role="gridcell" class="mono st st-${c.superseded_by ? "superseded" : c.status}">${STATUS[c.superseded_by ? "superseded" : c.status] || esc(c.status)}</span></div>`;
  };
  const draw = () => {
    const f = groups.find((g) => g[0] === filt)[2];
    const ql = q.toLowerCase();
    const shown = list.filter((c) => f(c) && (!ql || c.id.includes(ql) || (c.text || "").toLowerCase().includes(ql) || (c.quote || "").toLowerCase().includes(ql) || (c.source?.domain || "").includes(ql)));
    $("#rows").innerHTML = shown.map(row).join("") || `<p class="mono rg-empty">Ничего не нашлось.</p>`;
    $("#rgCount").textContent = `показано ${shown.length} из ${list.length}`;
  };
  $("#filters").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; filt = b.dataset.f; $("#filters").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); draw(); });
  $("#q").addEventListener("input", (e) => { q = e.target.value.trim(); draw(); });
  const toggle = (r) => {
    const open = r.nextElementSibling?.classList.contains("rg-more");
    document.querySelectorAll(".rg-more").forEach((x) => { x.previousElementSibling?.setAttribute("aria-expanded", "false"); x.remove(); });
    if (open) return;
    const c = claims[r.dataset.id];
    const s = c.source || {};
    const more = document.createElement("div");
    more.className = "rg-more";
    more.setAttribute("role", "row");
    more.innerHTML = `<div role="gridcell">${c.quote ? `<q>${esc(c.quote)}</q>` : ""}
<dl class="mono">${s.origin ? `<dt>источник</dt><dd><a href="${esc(s.origin)}" target="_blank" rel="noopener">${esc(s.title || s.origin)} ↗</a></dd>` : ""}${s.accessed_at ? `<dt>снято</dt><dd>${esc(String(s.accessed_at).slice(0, 10))}</dd>` : ""}${s.sha256 ? `<dt>sha256</dt><dd>${esc(s.sha256.slice(0, 24))}…</dd>` : ""}${c.expires ? `<dt>годен до</dt><dd>${esc(c.expires)}</dd>` : ""}${c.value != null ? `<dt>значение</dt><dd>${esc(c.value)} ${esc(c.unit || "")}</dd>` : ""}${c.range ? `<dt>диапазон</dt><dd>${esc(Array.isArray(c.range) ? c.range.join(" – ") : c.range)} ${esc(c.unit || "")}</dd>` : ""}${c.confidence != null ? `<dt>уверенность</dt><dd>${Math.round(c.confidence * 100)}%</dd>` : ""}${c.verify_plan ? `<dt>как проверить</dt><dd>${esc(c.verify_plan)}</dd>` : ""}${c.stale_reason ? `<dt>почему устарело</dt><dd>${esc(c.stale_reason)}</dd>` : ""}${(c.depends_on || []).length ? `<dt>держится на</dt><dd>${c.depends_on.map((d) => `<button type="button" class="cref" data-jump="${esc(d)}">${esc(d)}</button>`).join(" ")}</dd>` : ""}${c.superseded_by ? `<dt>заменено на</dt><dd><button type="button" class="cref" data-jump="${esc(c.superseded_by)}">${esc(c.superseded_by)}</button></dd>` : ""}</dl></div>`;
    r.after(more);
    r.setAttribute("aria-expanded", "true");
  };
  $("#rows").addEventListener("click", (e) => {
    const j = e.target.closest("[data-jump]");
    if (j) { jump(j.dataset.jump); return; }
    const r = e.target.closest(".rg-row"); if (r && !e.target.closest("a")) toggle(r);
  });
  $("#rows").addEventListener("keydown", (e) => { const r = e.target.closest(".rg-row"); if (r && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(r); } });
  const jump = (id) => {
    filt = "all"; q = ""; $("#q").value = "";
    $("#filters").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.f === "all"));
    draw();
    const r = $(`.rg-row[data-id="${id}"]`);
    if (!r) return;
    toggle(r);
    r.scrollIntoView({ block: "center", behavior: still() ? "auto" : "smooth" });
    r.classList.add("flash"); setTimeout(() => r.classList.remove("flash"), 1600);
    r.focus({ preventScroll: true });
  };
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-claim-open]"); if (b) { jump(b.dataset.claimOpen); } });
  draw();
}

/* ---------- точки, обязательства, оценка ---------- */
function gates() {
  const hp = P.human_points || [];
  $("#gpLine").innerHTML = hp.map((g) => `<li class="gp-pt st-${esc(g.status)}"><span class="gp-g mono">${esc(g.gate)}</span><h3>${esc(g.label)}</h3>
<p class="mono">${g.status === "approved" ? "принята" : esc(g.status)}${g.options?.length ? ` · ${g.options.map(esc).join(" ")}` : ""}</p>
<p class="gp-c">${esc(g.comment || "")}</p>
<p class="mono gp-ch">${g.by_human ? "человек в чате" : `канал ${esc(g.channel)} — не живой человек`}</p></li>`).join("");
}
function bets() {
  $("#btList").innerHTML = (P.commitments || []).map((k) => `<article class="bet"><header class="mono"><b>${esc(k.id)}</b><span>проверить ${esc(k.check_at)}</span><span class="st">${k.status === "active" ? "идёт" : esc(k.status)}</span></header>
<h3>${esc(k.what)}</h3>
<div class="bet-m"><div><span class="mono">метрика</span>${esc(k.metric)}</div><div><span class="mono">порог</span><b>${esc(k.threshold)}</b></div></div>
<p class="bet-r"><span class="mono">пересмотреть, если</span>${esc(k.review_if)}</p>
<p class="mono bet-c">опора: ${(k.claims || []).map((c) => `<button type="button" class="cref" data-claim-open="${esc(c)}">${esc(c)}</button>`).join(" ")}</p></article>`).join("");
}
function scorecard() {
  const S = P.score;
  $("#scFormula").textContent = S.formula || "";
  $("#scNote").textContent = (S.notes || []).join(" ");
  const maxW = Math.max(...S.parts.map((p) => p.weight));
  $("#scParts").innerHTML = S.parts.map((p) => `<div class="scp${p.points < p.weight ? " short" : ""}"><div class="scp-t"><span>${esc(p.label)}</span><b class="mono">${Math.round(p.points)}<i>/${p.weight}</i></b></div><div class="scp-bar"><i style="width:${(p.weight / maxW) * 100}%"></i><b style="width:${(p.points / maxW) * 100}%"></b></div><p class="mono">${esc(p.detail)}</p></div>`).join("");
  const arc = $("#scoreArc");
  const num = $("#scoreNum");
  num.textContent = S.score;
  $("#score").title = S.notes?.[0] || "";
  if (still()) { arc.style.strokeDashoffset = 100 - S.score; return; }
  const o = { v: 0 };
  gsap.to(o, { v: S.score, duration: 1.8, ease: "expo.out", delay: .3, onUpdate: () => { arc.style.strokeDashoffset = 100 - o.v; } });
}

(async () => {
  boot();
  try { P = await loadJSON("/data/ref/pult.json"); }
  catch { $("#main").insertAdjacentHTML("afterbegin", '<p class="wrap mono">Экспорт проекта не загрузился.</p>'); return; }
  claims = Object.fromEntries(P.claims.map((c) => [c.id, c]));
  $("#ptTitle").textContent = P.project.title;
  $("#ptQ").textContent = `«${P.project.question}»`;
  $("#ptStage").textContent = `этап: ${P.project.stage_label}`;
  const d = P.project.decision;
  if (d) $("#ptDecision").innerHTML = `решение: <b>${esc(d.option)}</b>`;
  whatif();
  registry();
  gates();
  bets();
  scorecard();
})();
