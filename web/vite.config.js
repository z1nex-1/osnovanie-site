import { defineConfig } from "vite";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const pages = { main: "index.html", replay: "replay/index.html", how: "how/index.html", pult: "pult/index.html", proof: "proof/index.html", guide: "guide/index.html", e404: "404.html" };

const links = [
  ["/how/", "Как работает", "how"],
  ["/replay/", "Прогон", "replay"],
  ["/pult/", "Пульт", "pult"],
  ["/proof/", "Доказательства", "proof"],
  ["/guide/", "Инструкция", "guide"],
];

const lockup = readFileSync(resolve(__dirname, "public/img/lockup.svg"), "utf8").replace("<svg ", '<svg aria-hidden="true" ');

// Карточка ссылки в мессенджерах берёт og:description, а не description, поэтому дублируем.
function social(html) {
  if (html.includes('name="robots" content="noindex"')) return html;
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const add = [
    ['property="og:type"', '<meta property="og:type" content="website">'],
    ['property="og:site_name"', '<meta property="og:site_name" content="Основание">'],
    ['property="og:locale"', '<meta property="og:locale" content="ru_RU">'],
    ['property="og:description"', desc && `<meta property="og:description" content="${desc}">`],
    ['property="og:image:width"', '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'],
    ['name="twitter:card"', '<meta name="twitter:card" content="summary_large_image">'],
  ].filter(([k, tag]) => tag && !html.includes(k)).map(([, tag]) => tag).join("\n");
  return add ? html.replace(/(<meta property="og:image"[^>]*>)/, `$1\n${add}`) : html;
}

// Без предзагрузки Plex приходит после первой отрисовки, и текст перетекает (CLS на пульте был 0,53).
function preloadFonts(html) {
  const tag = (f) => `<link rel="preload" href="/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`;
  const add = ["ibm-plex-sans-cyrillic-wght-normal", "ibm-plex-mono-cyrillic-400-normal"].filter((f) => !html.includes(f)).map(tag).join("\n");
  return add ? html.replace("</head>", `${add}\n</head>`) : html;
}

// Шапки пульта и реплея заполняются из JSON после загрузки, и страница прыгала вниз (CLS 0,5).
// Вписываем те же строки на сборке; скрипт потом перезапишет их тем же текстом.
function prefill(html) {
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const put = (id, text) => { if (text) html = html.replace(new RegExp(`(id="${id}"[^>]*>)[^<]*(</[a-z0-9]+>)`), `$1${text}$2`); };
  const read = (f) => { try { return JSON.parse(readFileSync(resolve(__dirname, "public/data/ref", f), "utf8")); } catch { return null; } };
  if (html.includes('id="ptQ"')) {
    const P = read("pult.json")?.project;
    if (P) {
      put("ptTitle", esc(P.title)); put("ptQ", `«${esc(P.question)}»`); put("ptStage", `этап: ${esc(P.stage_label)}`);
      if (P.decision) put("ptDecision", `решение: <b>${esc(P.decision.option)}</b>`);
    }
  }
  if (html.includes('id="rpQ"')) {
    const R = read("replay.json");
    if (R) { put("rpTitle", esc(R.title || "Прогон")); if (R.run?.question) put("rpQ", `«${esc(R.run.question)}»`);
      if (R.run?.note) { put("rpNote", esc(R.run.note)); html = html.replace(/(id="rpNote") hidden/, "$1"); } }
  }
  return html;
}

function nav(current) {
  const items = links.map(([href, label, id]) => `<li><a href="${href}"${id === current ? ' aria-current="page"' : ""}>${label}</a></li>`).join("");
  return `<a class="skip" href="#main">К содержанию</a>
<header class="nav" id="nav">
  <a class="brand" href="/" aria-label="Основание — на главную">${lockup}</a>
  <ul id="menu">${items}</ul>
  <div class="tools">
    <button class="motion-toggle" id="motion" type="button" aria-pressed="false" aria-label="Без анимации"><i aria-hidden="true"></i><span>Без анимации</span></button>
    <a class="btn sm" href="/replay/">Смотреть прогон <span class="arr">→</span></a>
    <button class="menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Меню"><svg width="18" height="12" viewBox="0 0 18 12"><path d="M0 1h18M0 6h18M0 11h12" stroke="currentColor" stroke-width="1.5"/></svg></button>
  </div>
</header>
<div class="progress" id="progress"></div>`;
}

const foot = `<footer class="foot">
  <div class="wrap">
    <nav aria-label="Подвал">
      <div><h2>Продукт</h2><a href="/how/">Как работает</a><a href="/replay/">Реплей прогона</a><a href="/pult/">Пульт проекта</a></div>
      <div><h2>Проверка</h2><a href="/proof/">Доказательства</a><a href="/proof/#security">Защита от инъекций</a><a href="/proof/#criteria">Требования ТЗ</a></div>
      <div><h2>Начать</h2><a href="/guide/">Руководителю</a><a href="/guide/#engineer">Инженеру внедрения</a><a href="/guide/#faq">Вопросы</a></div>
      <div><h2>Интерфейсы</h2><a href="/guide/#cli">CLI osnovanie</a><a href="/guide/#mcp">MCP kb-state</a><a href="/guide/#http">HTTP только чтение</a></div>
    </nav>
    <p class="legal">Неофициальный концепт для MGIMO AI Challenge 2026, номинация «ИИ-проект». Это не материал ПАО «МегаФон». Используются только открытые данные со ссылками и датой снятия. Шрифт заголовков «Репер» нарисован для проекта; IBM Plex — SIL OFL 1.1; three.js — MIT; GSAP — стандартная бесплатная лицензия; Lenis, lottie-web — MIT.</p>
    <div class="big" aria-hidden="true" data-w="основание"></div>
  </div>
</footer>`;

function partials() {
  return {
    name: "partials",
    transformIndexHtml(html) {
      return prefill(preloadFonts(social(html))).replace(/<!--nav:(\w*)-->/, (_, id) => nav(id)).replace("<!--foot-->", foot);
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [partials()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: { input: Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, resolve(__dirname, v)])) },
  },
});
