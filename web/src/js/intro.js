/* Заставка: строки настоящих источников, луч чтения, числа отрываются частицами
   и собираются в знак «плита на основании». Только первый визит за сессию. */
import { gsap } from "./common.js";

const MARK = "M58 0L156 0L200 44L200 112L58 112ZM0 134L200 134L200 174L21 174L0 153Z";

function samplePath(d, w, h, step) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  const p = new Path2D(d);
  const s = Math.min(w / 232, h / 206) * 0.9;
  x.translate((w - 200 * s) / 2, (h - 174 * s) / 2);
  x.scale(s, s);
  x.fill(p);
  const data = x.getImageData(0, 0, w, h).data;
  const pts = [];
  for (let y = 0; y < h; y += step) for (let i = 0; i < w; i += step) if (data[(y * w + i) * 4 + 3] > 128) pts.push([i, y]);
  return pts;
}

export function runIntro(lines) {
  let seen = false;
  try { seen = sessionStorage.getItem("osn-intro") === "1"; } catch {}
  const html = document.documentElement;
  if (seen || html.classList.contains("still") || location.hash || innerWidth < 50 || innerHeight < 50) return Promise.resolve(false);
  try { sessionStorage.setItem("osn-intro", "1"); } catch {}

  const el = document.createElement("div");
  el.className = "intro";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<canvas></canvas><div class="intro-ui"><span class="mono" id="introStat">чтение источников · 0/27</span><button type="button" class="intro-skip mono">пропустить</button></div>`;
  document.body.append(el);
  document.body.style.overflow = "hidden";
  const cv = el.querySelector("canvas");
  const ctx = cv.getContext("2d");
  const stat = el.querySelector("#introStat");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const small = W < 700;
  const fs = small ? 11 : 13;
  const lh = fs * 1.9;
  const colX = small ? 16 : Math.round(W * 0.08);
  const rows = Math.ceil(H / lh) + 2;
  const text = [];
  for (let i = 0; i < rows; i++) text.push(lines[i % lines.length]);

  const numRe = /\d[\d\s,.]*\s?(₽|%|рублей|запросов|моделей|токенов)?/g;
  const parts = [];
  const pick = [];
  ctx.font = `400 ${fs}px "Plex Mono", monospace`;
  text.forEach((t, r) => {
    const y = r * lh + lh;
    const line = t.slice(0, small ? 46 : 120);
    let m;
    numRe.lastIndex = 0;
    while ((m = numRe.exec(line))) {
      if (m[0].trim().length < 2) continue;
      const x0 = colX + ctx.measureText(line.slice(0, m.index)).width;
      const w = ctx.measureText(m[0]).width;
      pick.push({ x: x0, y, w, r });
    }
    parts.push({ line, y });
  });

  const targets = samplePath(MARK, Math.min(W, 520), Math.min(H, 460), small ? 6 : 5);
  const ox = (W - Math.min(W, 520)) / 2, oy = (H - Math.min(H, 460)) / 2 - (small ? 20 : 30);
  const P = targets.map(([tx, ty], i) => {
    const src = pick.length ? pick[i % pick.length] : { x: colX, y: H / 2, w: 40 };
    return { x: src.x + Math.random() * src.w, y: src.y - fs * 0.4 + Math.random() * fs * 0.6, tx: tx + ox, ty: ty + oy, d: Math.random() };
  });

  const st = { beam: -0.05, read: 0, fade: 0, fly: 0, glow: 0, out: 0 };
  let raf = 0, done = false;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#07100c";
    ctx.fillRect(0, 0, W, H);
    const by = st.beam * H;
    ctx.font = `400 ${fs}px "Plex Mono", monospace`;
    ctx.textBaseline = "alphabetic";
    for (const p of parts) {
      const a = (p.y < by ? 0.78 : 0.18) * (1 - st.fade);
      if (a <= 0.01) continue;
      ctx.fillStyle = `rgba(216,227,220,${a})`;
      ctx.fillText(p.line, colX, p.y);
    }
    if (st.fly < 0.02) for (const k of pick) {
      if (k.y > by) continue;
      ctx.fillStyle = `rgba(12,220,120,${0.22 * (1 - st.fade)})`;
      ctx.fillRect(k.x - 3, k.y - fs, k.w + 6, fs * 1.35);
      ctx.fillStyle = `rgba(238,244,240,${1 - st.fade})`;
    }
    if (st.beam > 0 && st.beam < 1.05 && st.fade < 1) {
      const g = ctx.createLinearGradient(0, by - 90, 0, by);
      g.addColorStop(0, "rgba(12,220,120,0)");
      g.addColorStop(1, `rgba(12,220,120,${0.12 * (1 - st.fade)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, by - 90, W, 90);
      ctx.fillStyle = `rgba(12,220,120,${0.9 * (1 - st.fade)})`;
      ctx.fillRect(0, by, W, 1.5);
    }
    if (st.fly > 0) {
      const e = st.fly;
      ctx.fillStyle = `rgba(12,220,120,${1 - st.out})`;
      const sz = small ? 2.6 : 2.2;
      for (const p of P) {
        const k = Math.min(1, Math.max(0, (e - p.d * 0.35) / 0.65));
        const ee = 1 - Math.pow(1 - k, 3);
        const swirl = Math.sin(ee * Math.PI) * 60 * (p.d - 0.5);
        const x = p.x + (p.tx - p.x) * ee + swirl;
        const y = p.y + (p.ty - p.y) * ee - Math.sin(ee * Math.PI) * 40 * p.d;
        ctx.fillRect(x, y, sz, sz);
      }
    }
    if (st.glow > 0) {
      ctx.fillStyle = `rgba(238,244,240,${st.glow * (1 - st.out)})`;
      ctx.font = `400 ${small ? 34 : 54}px Reper, "Plex Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("основание", W / 2, oy + Math.min(H, 460) - (small ? 8 : 0));
      ctx.textAlign = "left";
    }
    if (!done) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onUpdate: () => { stat.textContent = `чтение источников · ${Math.min(27, Math.round(st.beam * 27))}/27`; },
      onComplete: finish,
    });
    tl.to(st, { beam: 1.05, duration: 1.5, ease: "power1.inOut" })
      .to(st, { fly: 1, duration: 1.3, ease: "power2.inOut" }, 1.05)
      .to(st, { fade: 1, duration: 0.6 }, 1.15)
      .add(() => (stat.textContent = "27 цитат → 1 основание"), 2.2)
      .to(st, { glow: 1, duration: 0.5 }, 2.25)
      .to(st, { out: 1, duration: 0.55, ease: "power2.in" }, 3.05)
      .to(el, { opacity: 0, duration: 0.5 }, 3.15);
    function finish() {
      done = true;
      cancelAnimationFrame(raf);
      el.remove();
      document.body.style.overflow = "";
      resolve(true);
    }
    el.querySelector(".intro-skip").addEventListener("click", () => { tl.progress(1); });
    addEventListener("keydown", function k(e) { if (e.key === "Escape") { tl.progress(1); removeEventListener("keydown", k); } });
  });
}
