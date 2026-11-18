import "../styles/proof.css";
import { boot, gsap, ScrollTrigger, still } from "./common.js";
import { loadFacts, applyFacts } from "./graph.js";

const CATS = [
  ["gate-forge", 4], ["config-target", 2], ["exec", 2], ["judge-bait", 2], ["obfuscation", 2], ["role", 2],
  ["exfil", 1], ["option-tamper", 1], ["override", 1], ["recommend-force", 1], ["state-tamper", 1], ["subtle", 0],
];

function cells(id, hit, total) {
  const box = document.getElementById(id);
  if (!box) return;
  box.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < hit ? "hit" : "miss"}"></i>`).join("");
  if (still()) return;
  box.classList.add("pending");
  ScrollTrigger.create({
    trigger: box, start: "top 85%", once: true,
    onEnter: () => {
      box.classList.remove("pending");
      gsap.from(box.children, { scale: 0.3, opacity: 0, duration: 0.5, ease: "power3.out", stagger: { each: 0.02, from: "start" } });
    },
  });
}

function bars() {
  const ul = document.getElementById("catBars");
  if (!ul) return;
  ul.innerHTML = CATS.map(([n, k]) => `<li class="${k === 0 ? "z" : ""}"><span>${n}</span><span class="tr"><b style="--w:${k / 4}"></b></span><em>${k}/4</em></li>`).join("");
  if (still()) return;
  const fills = ul.querySelectorAll(".tr b");
  gsap.set(fills, { scaleX: 0 });
  ScrollTrigger.create({
    trigger: ul, start: "top 85%", once: true,
    onEnter: () => fills.forEach((b, i) => gsap.to(b, { scaleX: getComputedStyle(b).getPropertyValue("--w"), duration: 0.9, delay: i * 0.05, ease: "power3.out" })),
  });
}

function flow() {
  const f = document.getElementById("d13flow");
  if (!f || still()) return;
  f.style.setProperty("--ln", 0);
  const o = { v: 0 };
  ScrollTrigger.create({ trigger: f, start: "top 80%", once: true, onEnter: () => gsap.to(o, { v: 1, duration: 1.4, ease: "power2.out", onUpdate: () => f.style.setProperty("--ln", o.v) }) });
}

function filter() {
  const rows = [...document.querySelectorAll("#critTable tbody tr")];
  const btns = [...document.querySelectorAll(".pf-filter button")];
  btns.forEach((b) => {
    const k = b.dataset.f;
    b.querySelector("i").textContent = k === "all" ? rows.length : rows.filter((r) => r.dataset.s === k).length;
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.toggle("on", x === b));
      rows.forEach((r) => r.classList.toggle("hide", k !== "all" && r.dataset.s !== k));
      ScrollTrigger.refresh();
    });
  });
}

(async () => {
  const f = await loadFacts();
  applyFacts(f);
  boot();
  const e = f?.evals || {};
  cells("cellsAttack", e.attacks_caught ?? 19, e.attacks ?? 48);
  cells("cellsDef", e.defects_blocked ?? 15, (e.defects_total ?? 15) + (e.defects_semantic ?? 3));
  bars();
  flow();
  filter();
  ScrollTrigger.refresh();
})();
