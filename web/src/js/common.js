import "../styles/base.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
root.classList.add("js");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let stored = null;
try { stored = localStorage.getItem("osn-motion"); } catch {}
export const still = () => root.classList.contains("still");
if (stored === "off" || (reduced && stored !== "on")) root.classList.add("still");
if (stored === "on") root.classList.add("motion-forced");

export let lenis = null;
function startLenis() {
  if (still() || lenis) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis && lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function motionToggle() {
  const b = document.getElementById("motion");
  if (!b) return;
  const sync = () => b.setAttribute("aria-pressed", String(still()));
  sync();
  b.addEventListener("click", () => {
    root.classList.toggle("still");
    try { localStorage.setItem("osn-motion", still() ? "off" : "on"); } catch {}
    sync();
    if (still() && lenis) { lenis.destroy(); lenis = null; }
    else startLenis();
    window.dispatchEvent(new CustomEvent("osn:motion", { detail: { still: still() } }));
  });
}

function navBehaviour() {
  const nav = document.getElementById("nav");
  const bar = document.getElementById("progress");
  const btn = document.getElementById("menuBtn");
  if (!nav) return;
  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 8);
    nav.classList.toggle("hide", y > last && y > 400 && !nav.classList.contains("open"));
    last = y;
    if (bar) {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

function reveals() {
  const els = document.querySelectorAll("[data-reveal]");
  if (still() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));
}

export function splitLines(el) {
  if (el.dataset.splitDone) return [...el.querySelectorAll(".split-line > span")];
  const words = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = words.map((w) => `<span class="split-line"><span>${w.trim()}</span></span>`).join("");
  el.dataset.splitDone = "1";
  return [...el.querySelectorAll(".split-line > span")];
}

function splitHeads() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    const lines = splitLines(el);
    if (still()) return;
    gsap.from(lines, {
      yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: el.hasAttribute("data-split-now") ? undefined : { trigger: el, start: "top 88%" },
      delay: el.hasAttribute("data-split-now") ? 0.15 : 0,
    });
  });
}

function counters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const fmt = (v) => v.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (still()) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 1.6, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v)) }),
    });
  });
}

function scramble() {
  const chars = "0123456789ABCDEF#%/=+";
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    const final = el.textContent;
    if (still()) return;
    const run = () => {
      let f = 0;
      const total = 22;
      const id = setInterval(() => {
        f++;
        el.textContent = final.split("").map((c, i) => (c === " " || i < (f / total) * final.length ? c : chars[(Math.random() * chars.length) | 0])).join("");
        if (f >= total) { clearInterval(id); el.textContent = final; }
      }, 34);
    };
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: run });
    el.addEventListener("mouseenter", run);
  });
}

function copyButtons() {
  document.querySelectorAll("[data-copy]").forEach((b) => {
    b.addEventListener("click", async () => {
      const src = document.getElementById(b.dataset.copy);
      const text = src ? src.innerText.replace(/^\$ /gm, "") : b.dataset.copy;
      try { await navigator.clipboard.writeText(text); b.textContent = "скопировано"; } catch { b.textContent = "выделите вручную"; }
      setTimeout(() => (b.textContent = "копировать"), 1600);
    });
  });
}

function reticle() {
  if (matchMedia("(hover: none), (pointer: coarse)").matches) return;
  const r = document.createElement("div");
  r.className = "reticle";
  r.setAttribute("aria-hidden", "true");
  document.body.append(r);
  const xTo = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3" });
  const yTo = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3" });
  addEventListener("pointermove", (e) => {
    r.classList.add("on");
    xTo(e.clientX); yTo(e.clientY);
    const hot = e.target.closest?.("a, button, [data-claim], [data-hot], input, .node");
    r.classList.toggle("hot", !!hot);
  }, { passive: true });
  document.addEventListener("mouseleave", () => r.classList.remove("on"));
}

function magnetic() {
  if (matchMedia("(hover: none)").matches) return;
  document.querySelectorAll(".btn:not(.sm)").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      if (still()) return;
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power3" });
    });
    b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,.4)" }));
  });
}

/* занавес между страницами: строки закрываются, как сканер, и открываются на новой странице */
function curtain() {
  const c = document.createElement("div");
  c.className = "curtain";
  c.setAttribute("aria-hidden", "true");
  c.innerHTML = "<i></i>".repeat(6) + '<div class="beam"></div>';
  document.body.append(c);
  const rows = c.querySelectorAll("i");
  let entering = false;
  try { entering = sessionStorage.getItem("osn-curtain") === "1"; sessionStorage.removeItem("osn-curtain"); } catch {}
  if (entering && !still()) {
    gsap.set(rows, { scaleX: 1, transformOrigin: "left" });
    gsap.to(rows, { scaleX: 0, duration: 0.55, ease: "expo.inOut", stagger: 0.04, delay: 0.05 });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || still()) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash) || a.hasAttribute("download")) return;
    if (url.pathname === location.pathname && !url.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem("osn-curtain", "1"); } catch {}
    gsap.set(rows, { transformOrigin: "right" });
    gsap.to(rows, { scaleX: 1, duration: 0.45, ease: "expo.inOut", stagger: 0.035, onComplete: () => (location.href = url.href) });
  });
  addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(rows, { scaleX: 0 }); });
}

/* карточка цитаты по наведению на [data-claim] */
let claimsIndex = null;
export function setClaims(index) { claimsIndex = index; }
const TYPE_RU = { fact: "факт", hypothesis: "гипотеза", assumption: "допущение", forecast: "прогноз", conclusion: "вывод", objection: "возражение" };
const TYPE_CLS = { fact: "", hypothesis: "hyp", assumption: "assume", forecast: "forecast", conclusion: "concl", objection: "obj" };
export function claimCard(c) {
  const t = c.type || "fact";
  return `<div class="t"><b class="${TYPE_CLS[t] || ""}">${TYPE_RU[t] || t}</b><span>${c.id}</span>${c.confidence != null ? `<span class="mute">уверенность ${Math.round(c.confidence * 100)}%</span>` : ""}</div>
<q>${c.quote || c.text}</q>
<dl>${c.source_url || c.domain ? `<dt>источник</dt><dd>${c.domain || c.source_url}</dd>` : ""}${c.captured ? `<dt>снято</dt><dd>${c.captured}</dd>` : ""}${c.hash ? `<dt>sha256</dt><dd>${c.hash.slice(0, 12)}…</dd>` : ""}${c.expires ? `<dt>годен до</dt><dd>${c.expires}</dd>` : ""}</dl>`;
}
function quotePop() {
  const pop = document.createElement("div");
  pop.className = "qpop";
  pop.id = "qpop";
  document.body.append(pop);
  const show = (el) => {
    const id = el.dataset.claim;
    const c = claimsIndex?.[id] || (el.dataset.quote ? { id, type: el.dataset.type, quote: el.dataset.quote, domain: el.dataset.domain, captured: el.dataset.captured } : null);
    if (!c) return;
    pop.innerHTML = claimCard(c);
    pop.setAttribute("role", "tooltip");
    el.setAttribute("aria-describedby", "qpop");
    const r = el.getBoundingClientRect();
    const w = pop.offsetWidth || 420;
    pop.style.left = Math.min(Math.max(16, r.left), innerWidth - w - 16) + "px";
    const below = r.bottom + 12;
    pop.style.top = (below + 200 > innerHeight ? Math.max(16, r.top - pop.offsetHeight - 12) : below) + "px";
    pop.classList.add("on");
  };
  const hide = () => pop.classList.remove("on");
  document.addEventListener("pointerover", (e) => { const el = e.target.closest?.("[data-claim]"); if (el) show(el); });
  document.addEventListener("pointerout", (e) => { if (e.target.closest?.("[data-claim]")) hide(); });
  document.addEventListener("focusin", (e) => { const el = e.target.closest?.("[data-claim]"); if (el) show(el); });
  document.addEventListener("focusout", hide);
  addEventListener("scroll", hide, { passive: true });
}

export async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}

export function boot() {
  startLenis();
  motionToggle();
  navBehaviour();
  reveals();
  splitHeads();
  counters();
  scramble();
  copyButtons();
  reticle();
  magnetic();
  curtain();
  quotePop();
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = document.querySelector(a.getAttribute("href"));
    if (t && lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); }
  }));
}

export { gsap, ScrollTrigger };
