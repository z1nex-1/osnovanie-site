import "../styles/guide.css";
import { boot, gsap, ScrollTrigger, still } from "./common.js";
import { loadFacts, applyFacts } from "./graph.js";

const GATES = {
  G1: {
    what: "Агент правильно понял задачу",
    card: `<h3>Точка G1: постановка задачи</h3><dl><dt>вопрос</dt><dd>Кому и как продавать МегаНейросети и продолжать ли направление?</dd><dt>цель</dt><dd>выбрать между сохранением, сдвигом в малый бизнес, продажей с тарифом и закрытием</dd><dt>получатель</dt><dd>руководитель направления</dd><dt>ограничения</dt><dd>только открытые данные на 14.11.2026</dd><dt>данные</dt><dd>27 цитат из открытых источников</dd></dl><p class="sp">Потрачено: $0.00 из бюджета $1.00</p>`,
    replies: [
      ["G1 да", "Точка G1 закрыта вашим сообщением. Дальше: вопросы и источники, точка G2."],
      ["G1 правка: получатель — совет директоров", "Принял правку. Перепишу постановку и покажу G1 ещё раз, пока вы её не закроете."],
    ],
  },
  G2: {
    what: "План вопросов, источники, бюджет",
    card: `<h3>Точка G2: источники и бюджет</h3><ul><li><b>q001</b><span>Кому продавать: корпоративным клиентам, малому бизнесу или частным абонентам?<em>меняет выбор между «как есть» и сдвигом</em></span></li><li><b>q002</b><span>Выдержит ли цена 299 ₽ давление бесплатных предложений?<em>меняет цену пакета и роль «Лайт»</em></span></li><li><b>q003</b><span>Достаточно ли велика аудитория, которая платит за нейросети?<em>меняет решение закрывать направление или нет</em></span></li></ul><p class="sp">Источники: moscow.megafon.ru, anti-malware.ru, tadviser.ru и другие. Потрачено $0.00 из $1.00</p>`,
    replies: [
      ["G2 да", "План принят. Иду собирать и проверять цитаты."],
      ["G2 да бюджет 8", "План принят, бюджет теперь $8. Остановлюсь, когда он кончится."],
      ["G2 правка: добавь отзывы из App Store", "Добавлю вопрос про отзывы и покажу G2 заново."],
    ],
  },
  G3: {
    what: "Какие варианты развивать в стратегию",
    card: `<h3>Точка G3: варианты</h3><ul><li><b>O1</b><span>Оставить как есть<span class="lead3">лидер в 0%</span><em>skeptic: число платящих не раскрыто</em></span></li><li><b>O2</b><span>Сместиться в малый бизнес<span class="lead3">лидер в 16%</span><em>skeptic: опросов малого бизнеса в открытых источниках нет</em></span></li><li><b>O3</b><span>Продавать вместе с тарифом связи<span class="lead3">лидер в 84%</span><em>skeptic: тариф «Персональный» уже даёт 20 бесплатных запросов в неделю</em></span></li><li><b>O4</b><span>Закрыть направление<span class="lead3">лидер в 0%</span><em>skeptic: выход отдаёт растущий рынок конкурентам</em></span></li></ul>`,
    replies: [
      ["G3 да O1 O3", "Беру в стратегию O1 и O3. Строю продуктовую и коммуникационную стратегии."],
      ["G3 правка: добавь вариант с партнёром", "Добавлю вариант, найду к нему возражения и покажу G3 заново."],
    ],
  },
  G4: {
    what: "Принять стратегию и назначить ответственного",
    card: `<h3>Точка G4: решение</h3><p>Готовы: outputs/product.md, outputs/communication.md, outputs/validation.md, outputs/trust-map.html.</p><p class="sp">Утверждения: факт 24, гипотеза 12, допущение 9, расчёт 2, прогноз 1, мнение 1</p>`,
    replies: [
      ["G4 да O3 ответственный Анна", "Решение принято: O3, ответственная Анна. Записка «что делать в понедельник» готова."],
      ["G4 правка: добавь вторую антиметрику", "Дополню план проверки и покажу G4 заново."],
    ],
  },
  R: {
    what: "Принять пересмотр после новых данных",
    card: `<h3>Точка R: пересмотр</h3><p>Причина: новый факт — Билайн начисляет 300 токенов в месяц без доплаты.</p><dl><dt>затронуто</dt><dd>утверждения c038, c047, c048, c049; величина модели bundle_price; обязательство k003</dd><dt>лидер O3</dt><dd>был 84% случаев, стал 51%. Лидер прежний.</dd></dl><p class="sp">Подробности: outputs/review-1.md</p>`,
    replies: [
      ["R да", "Пересмотр принят. Стратегия и записка обновлены."],
      ["R правка: проверь ещё тарифы МТС", "Добавлю источник и пересчитаю. Покажу R заново."],
    ],
  },
};

function sim() {
  const root = document.getElementById("sim");
  if (!root) return;
  const nav = root.querySelector(".sim-nav");
  const chat = document.getElementById("simChat");
  const what = document.getElementById("simWhat");
  const box = document.getElementById("simReplies");
  const done = new Set();
  const keys = Object.keys(GATES);
  nav.innerHTML = keys.map((k) => `<button type="button" role="tab" data-g="${k}">${k}<i></i></button>`).join("");

  const mark = () => nav.querySelectorAll("button").forEach((b) => {
    const d = done.has(b.dataset.g);
    b.classList.toggle("done", d);
    b.querySelector("i").textContent = d ? "закрыта" : "";
  });
  const scroll = () => chat.scrollTo({ top: chat.scrollHeight, behavior: still() ? "auto" : "smooth" });
  const push = (cls, html) => {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.innerHTML = html;
    chat.append(d);
    if (!still()) gsap.from(d, { opacity: 0, y: 12, duration: 0.4, ease: "power3.out" });
    return d;
  };
  function show(k) {
    const g = GATES[k];
    nav.querySelectorAll("button").forEach((b) => { b.classList.toggle("on", b.dataset.g === k); b.setAttribute("aria-selected", String(b.dataset.g === k)); });
    document.querySelectorAll("#track .pt").forEach((p) => p.classList.toggle("on", p.dataset.g === k));
    chat.innerHTML = "";
    push("a", g.card);
    what.textContent = g.what;
    box.innerHTML = g.replies.map(([t], i) => `<button type="button" class="${i ? "alt" : ""}" data-i="${i}">${t}</button>`).join("") + '<button type="button" class="again" hidden>ответить заново</button>';
    box.dataset.g = k;
    box.querySelector(".again").className = "again sim-again";
  }
  box.addEventListener("click", (e) => {
    const k = box.dataset.g;
    if (e.target.closest(".sim-again")) { done.delete(k); mark(); show(k); return; }
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    const [text, answer] = GATES[k].replies[+b.dataset.i];
    box.querySelectorAll("button[data-i]").forEach((x) => (x.disabled = true));
    push("u", text);
    setTimeout(() => {
      push("a", answer);
      if (text.includes("правка")) push("status", "точка остаётся открытой");
      else { done.add(k); push("status", "точка " + k + " закрыта человеком"); }
      mark(); scroll();
      box.querySelector(".sim-again").hidden = false;
    }, still() ? 0 : 450);
    scroll();
  });
  nav.addEventListener("click", (e) => { const b = e.target.closest("button[data-g]"); if (b) show(b.dataset.g); });
  document.getElementById("track").addEventListener("click", (e) => { const p = e.target.closest(".pt"); if (p) show(p.dataset.g); });
  show("G1");
}

function track() {
  const t = document.getElementById("track");
  if (!t || still()) return;
  t.style.setProperty("--ln", 0);
  const o = { v: 0 };
  ScrollTrigger.create({ trigger: t, start: "top 85%", once: true, onEnter: () => {
    gsap.to(o, { v: 1, duration: 1.4, ease: "power2.inOut", onUpdate: () => t.style.setProperty("--ln", o.v) });
    gsap.from(t.querySelectorAll("li"), { opacity: 0, y: 16, duration: 0.6, stagger: 0.12, ease: "power3.out" });
  } });
}

function drawSvg() {
  document.querySelectorAll(".ill .draw, .ill .acc2").forEach((p) => {
    if (still() || !p.getTotalLength) return;
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    ScrollTrigger.create({ trigger: p.ownerSVGElement, start: "top 88%", once: true, onEnter: () => gsap.to(p, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out", delay: 0.3 }) });
  });
  if (still()) return;
  new Set([...document.querySelectorAll(".ill .bub")].map((b) => b.ownerSVGElement)).forEach((svg) => {
    ScrollTrigger.create({ trigger: svg, start: "top 88%", once: true, onEnter: () => {
      gsap.from(svg.querySelectorAll(".bub, .t, .chip, .chip + text"), { opacity: 0, y: 8, duration: 0.5, stagger: 0.12, ease: "power3.out" });
    } });
  });
}

function copyFeedback() {
  document.querySelectorAll(".term .copy").forEach((b) => b.setAttribute("aria-label", "Скопировать команды"));
}

(async () => {
  applyFacts(await loadFacts());
  boot();
  sim();
  track();
  drawSvg();
  copyFeedback();
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  ScrollTrigger.refresh();
})();
