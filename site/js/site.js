(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const data = JSON.parse($("#data").textContent);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => reduce.matches || root.dataset.motion === "off";
  const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  // Анимация выключается и запоминается
  const motionBtn = $("[data-motion-toggle]");
  const syncMotion = () => motionBtn.setAttribute("aria-pressed", String(root.dataset.motion === "off"));
  motionBtn.addEventListener("click", () => {
    const off = root.dataset.motion !== "off";
    if (off) root.dataset.motion = "off"; else delete root.dataset.motion;
    try { localStorage.setItem("osn-motion", off ? "off" : "on"); } catch (e) {}
    syncMotion();
  });
  syncMotion();

  // Полоса прочитанного и тень шапки
  const top = $(".top");
  const bar = $(".progress i");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = root.scrollHeight - innerHeight;
    bar.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
    top.classList.toggle("stuck", scrollY > 8);
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Сканер: номер строки под лучом идёт вместе с ним
  const scan = $(".scan");
  const beamLabel = $(".beam b");
  const readLine = () => {
    if (still()) { beamLabel.textContent = "чтение · строка 255"; return; }
    const t0 = performance.now() + 300;
    const step = (t) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 1600));
      const e = 1 - Math.pow(1 - k, 3);
      beamLabel.textContent = "чтение · строка " + Math.round(241 + e * 14);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  readLine();
  $("[data-rescan]").addEventListener("click", () => {
    const parts = $$(".beam,.read,.claim,.wire", scan);
    parts.forEach((el) => { el.style.animation = "none"; });
    void scan.offsetWidth;
    parts.forEach((el) => { el.style.animation = ""; });
    readLine();
  });

  // Поповер: число или цитата раскрываются до источника
  const pop = $("[data-pop]");
  const popH = $(".pop-h", pop), popQ = $(".pop-q", pop), popM = $(".pop-m", pop);
  let opener = null, pinned = false;
  const host = (u) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function fill(el) {
    const q = el.dataset.q, f = el.dataset.f;
    pop.classList.remove("stub");
    if (q && data.quotes[q]) {
      const [text, url, date] = data.quotes[q];
      popH.textContent = "Цитата #" + q.slice(1);
      popQ.textContent = text;
      popM.innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(host(url))}</a> · снято ${esc(date)} · <a href="#${q}">в реестре</a>`;
      return true;
    }
    const fact = f && data.facts[f];
    if (!fact) return false;
    const stub = fact.stub || fact.value == null;
    pop.classList.toggle("stub", stub);
    popH.textContent = (stub ? "Не измерено · " : "Число из реестра · ") + f;
    const ref = fact.q ? "q" + String(fact.q).padStart(2, "0") : null;
    popQ.textContent = ref && data.quotes[ref] ? data.quotes[ref][0] : "";
    const bits = [];
    if (stub) bits.push(esc(fact.why || "Число появится после прогона агента. До этого мы его не пишем."));
    if (fact.note) bits.push(esc(fact.note));
    if (fact.src) bits.push(esc(fact.src));
    if (fact.date) bits.push(esc(fact.date));
    if (ref) bits.push(`<a href="#${ref}">цитата #${ref.slice(1)}</a>`);
    bits.push(`<a href="#f-${f.replace(/[._]/g, "-")}">в реестре чисел</a>`);
    popM.innerHTML = bits.join(" · ");
    return true;
  }

  function place(el) {
    const r = el.getBoundingClientRect();
    pop.hidden = false;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let x = Math.min(Math.max(16, r.left), innerWidth - w - 16);
    let y = r.bottom + 10;
    if (y + h > innerHeight - 16) y = Math.max(16, r.top - h - 10);
    pop.style.left = x + "px";
    pop.style.top = y + "px";
  }

  function openPop(el, pin) {
    if (!fill(el)) return false;
    opener = el; pinned = pin;
    place(el);
    return true;
  }
  function closePop(back) {
    if (pop.hidden) return;
    pop.hidden = true; pinned = false;
    if (back && opener) opener.focus();
    opener = null;
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-q],.num[data-f]");
    if (el && !e.target.closest(".pop")) {
      if (openPop(el, true)) { e.preventDefault(); $(".pop-x", pop).focus({ preventScroll: true }); }
      return;
    }
    if (e.target.closest("[data-pop-close]")) { closePop(true); return; }
    if (!e.target.closest(".pop")) closePop(false);
  });
  pop.addEventListener("click", (e) => { if (e.target.closest("a[href^='#']")) closePop(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePop(true); });
  addEventListener("scroll", () => { if (!pinned) closePop(false); else if (opener) place(opener); }, { passive: true });
  addEventListener("resize", () => closePop(false));

  // Граф: шаги прокрутки собирают схему по слоям
  const fig = $(".g-fig");
  const svg = $(".il-graph");
  const narrow = matchMedia("(max-width: 760px)");
  $$("#gr-edges>*", svg).forEach((p) => {
    const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 700);
    p.style.setProperty("--len", len);
  });
  const steps = $$(".g-steps li");
  const setStep = (n) => {
    fig.dataset.step = n;
    steps.forEach((li) => li.classList.toggle("on", +li.dataset.step === n));
  };
  if ("IntersectionObserver" in window && !narrow.matches) {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) setStep(+en.target.dataset.step); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    steps.forEach((li) => io.observe(li));
    setStep(1);
  } else {
    root.classList.add("no-io");
    setStep(5);
  }
  narrow.addEventListener("change", (m) => { if (m.matches) setStep(5); });

  $$("[data-only-btn]").forEach((b) => b.addEventListener("click", () => {
    fig.dataset.only = b.dataset.onlyBtn;
    $$("[data-only-btn]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));

  // Узел утверждения: подсветить ребро и страницу, показать цитату
  const pages = $$("[id^=gr-p]", svg).filter((p) => /^gr-p\d+$/.test(p.id)).map((p) => [p, p.getBBox()]);
  const claims = $$("[id^=gr-c]", svg).filter((c) => /^gr-c\d+$/.test(c.id));
  claims.forEach((c) => {
    const n = +c.id.slice(4);
    const q = "q" + String(n).padStart(2, "0");
    const edge = $("#gr-e" + n, svg);
    let page = null;
    if (edge) {
      const p0 = edge.points && edge.points.numberOfItems ? edge.points.getItem(0) : { y: edge.y1.baseVal.value };
      const hit = pages.find(([, b]) => p0.y >= b.y - 1 && p0.y <= b.y + b.height + 1);
      page = hit && hit[0];
    }
    c.dataset.q = q;
    if (!narrow.matches) {
      c.setAttribute("tabindex", "0");
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", "Цитата #" + q.slice(1));
    }
    const on = (v) => {
      [c, edge, page].forEach((el) => el && el.classList.toggle("hot", v));
      $$("#gr-edges>*", svg).forEach((p) => p !== edge && p.classList.toggle("dim", v));
    };
    c.addEventListener("mouseenter", () => { on(true); if (!pinned) openPop(c, false); });
    c.addEventListener("mouseleave", () => { on(false); if (!pinned) closePop(false); });
    c.addEventListener("focus", () => on(true));
    c.addEventListener("blur", () => on(false));
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPop(c, true); $(".pop-x", pop).focus({ preventScroll: true }); }
    });
  });

  // Пересмотр: красная волна от Решения обратно к Утверждениям
  const wave = $(".w-fig");
  const out = $("[data-wave-out]");
  const play = $("[data-wave-play]"), reset = $("[data-wave-reset]");
  const say = [
    [0, "pl-s3", "Схема: новый факт попадает в «Утверждения» и помечает выводы, которые на нём стояли."],
    [900, "pl-s4", "Пересчитываются только варианты, задетые этими выводами. Остальные не трогаются."],
    [1800, "pl-s5", "Записка обновляется: изменённые числа подсвечены, старые сохранены в истории."],
    [2700, "pl-rnode", "Агент стоит в точке R. Принять новую версию может только человек."],
  ];
  let timers = [];
  play.addEventListener("click", () => {
    timers.forEach(clearTimeout);
    $$(".hit-r", wave).forEach((el) => el.classList.remove("hit-r"));
    wave.dataset.wave = "1";
    const k = still() ? 0 : 1;
    say.forEach(([t, id, text]) => timers.push(setTimeout(() => {
      const el = $("#" + id, wave);
      if (el && id !== "pl-rnode") el.classList.add("hit-r");
      out.textContent = text;
    }, t * k)));
    reset.hidden = false;
  });
  reset.addEventListener("click", () => {
    timers.forEach(clearTimeout);
    wave.dataset.wave = "0";
    $$(".hit-r", wave).forEach((el) => el.classList.remove("hit-r"));
    out.textContent = "";
    reset.hidden = true;
    play.focus();
  });

  // Калькулятор допущений
  const form = $("[data-calc]");
  const fmtRub = (v) => nf.format(Math.round(v)) + " ₽";
  const calc = () => {
    const price = +form.price.value, conv = +form.conv.value, churn = +form.churn.value;
    form.po.value = price;
    form.co.value = nf.format(conv);
    form.ch.value = churn;
    $$("input[type=range]", form).forEach((r) => {
      r.style.setProperty("--f", ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + "%");
    });
    const life = 100 / churn;
    $("[data-out=rev]").textContent = fmtRub(1000 * conv / 100 * price);
    $("[data-out=life]").textContent = nf.format(life) + " мес.";
    $("[data-out=ltv]").textContent = fmtRub(price * life);
  };
  form.addEventListener("input", calc);
  calc();

  // Копирование команд
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Скопировано"; }
    catch (e) { b.textContent = "Выделите вручную"; }
    b.classList.add("done");
    setTimeout(() => { b.textContent = "Копировать"; b.classList.remove("done"); }, 1800);
  }));

  // Крупные числа «досчитываются» при появлении, как показание прибора
  const counters = $$(".big .num:not(.stub),.mid .num:not(.stub),.sm .num:not(.stub)");
  const run = (el) => {
    const final = el.textContent;
    if (still() || !/\d/.test(final)) return;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 900);
      el.textContent = k < 1 ? final.replace(/\d/g, (d) => (Math.random() < k ? d : String((Math.random() * 10) | 0))) : final;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const reveal = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      if (en.target.matches("[data-reveal]")) en.target.classList.add("in"); else run(en.target);
      io2.unobserve(en.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    reveal.forEach((el) => io2.observe(el));
    counters.forEach((el) => io2.observe(el));
  } else reveal.forEach((el) => el.classList.add("in"));
})();
