import html
W = "/Users/z1nex/mgimo_hackaton/osnovanie-site/web/guide/index.html"
E = html.escape

def win(w, h, title, body, cls=""):
    return (f'<svg class="ill {cls}" viewBox="0 0 {w} {h}" role="img" aria-label="{E(title)}" xmlns="http://www.w3.org/2000/svg">'
            f'<path class="bx" d="M.5 .5H{w-16}L{w-.5} 16V{h-.5}H.5Z"/>'
            f'<path class="ln" d="M.5 28.5H{w-.5}"/>'
            f'<rect class="sq" x="12" y="10" width="8" height="8"/><rect class="sq" x="26" y="10" width="8" height="8"/><rect class="sq on" x="40" y="10" width="8" height="8"/>'
            f'<text class="m mute" x="60" y="19" font-size="10.5">{E(title)}</text>{body}</svg>')

def bub(x, y, lines, kind="a", w=None):
    w = w or int(max(len(l) for l in lines) * 6.9 + 24)
    h = len(lines) * 17 + 14
    if kind == "u":
        x = x - w
    cut = 8
    p = f'M{x+.5} {y+.5}H{x+w-cut-.5}L{x+w-.5} {y+cut+.5}V{y+h-.5}H{x+.5}Z'
    t = "".join(f'<tspan x="{x+11}" dy="{0 if i==0 else 17}">{E(l)}</tspan>' for i, l in enumerate(lines))
    return f'<path class="bub {kind}" d="{p}"/><text class="t" x="{x+11}" y="{y+22}">{t}</text>', h

def chip(x, y, label, w=None, on=True):
    w = w or int(len(label) * 7.6 + 28)
    return (f'<path class="chip{" on" if on else ""}" d="M{x+.5} {y+.5}H{x+w-9.5}L{x+w-.5} {y+9.5}V{y+29.5}H{x+.5}Z"/>'
            f'<text class="m cl" x="{x+14}" y="{y+20}" font-size="12.5">{E(label)}</text>'), w

def g(*parts):
    return "".join(parts)

# ---------- иллюстрации ----------
def ill_open():
    b = []
    b.append('<text class="m mute" x="20" y="54" font-size="10.5">Папка</text>')
    rows = [("AGENTS.md", 70), ("bin/osnovanie", 92), ("projects/", 114), ("methods/", 136)]
    for n, y in rows:
        b.append(f'<path class="ln" d="M20.5 {y+6}H340.5"/><text class="m" x="20" y="{y+1}" font-size="12.5">{n}</text>')
    c, _ = chip(20, 150, "Открыть папку osnovanie", 230)
    b.append(c)
    b.append('<path class="draw acc" d="M262 168l10 10 18-22" fill="none"/>')
    return win(360, 200, "Claude Code", g(*b))

def ill_task():
    b1, h1 = bub(340, 46, ["Через полгода после запуска надо решить,", "кому и как продавать МегаНейросети", "и стоит ли продолжать направление"], "u")
    b2, h2 = bub(20, 46 + h1 + 14, ["Читаю папку. Первое действие:", "bin/osnovanie resume"], "a")
    return win(360, 200, "чат", g(b1, b2))

def ill_ask():
    b1, h1 = bub(20, 44, ["Два вопроса, без них не двигаюсь:", "1. Кто получит результат — вы или", "    совет директоров?", "2. Какие данные у вас уже есть?"], "a")
    b2, h2 = bub(340, 44 + h1 + 12, ["Совет директоров. Только", "открытые источники"], "u")
    return win(360, 210, "чат · пример", g(b1, b2))

def ill_card():
    b = ['<text class="m acc" x="20" y="54" font-size="11">ТОЧКА G1 · ПОСТАНОВКА ЗАДАЧИ</text>']
    rows = [("вопрос", "кому и как продавать МегаНейросети"), ("цель", "выбрать между четырьмя вариантами"), ("получатель", "руководитель направления"), ("ограничения", "только открытые данные"), ("данные", "27 цитат из открытых источников")]
    for i, (k, v) in enumerate(rows):
        y = 78 + i * 20
        b.append(f'<text class="m mute" x="20" y="{y}" font-size="10.5">{k}</text><text class="t" x="108" y="{y}" font-size="12">{E(v)}</text><path class="ln" d="M20.5 {y+6}H340.5"/>')
    c1, w1 = chip(20, 188, "G1 да"); c2, w2 = chip(20 + w1 + 10, 188, "G1 правка …", on=False)
    b += [c1, c2]
    return win(360, 232, "outputs/gates/G1.md", g(*b))

def ill_wait():
    b = ['<text class="m mute" x="20" y="54" font-size="10.5">агент работает сам</text>']
    labels = ["источники", "проверка цитат", "варианты", "возражения", "модель"]
    for i, l in enumerate(labels):
        y = 72 + i * 22
        done = i < 3
        b.append(f'<rect class="sq{" on" if done else ""}" x="20" y="{y-9}" width="10" height="10"/><text class="m{"" if done else " mute"}" x="40" y="{y}" font-size="12">{l}</text>')
        b.append(f'<path class="ln" d="M180.5 {y-4}H340.5"/>' + (f'<path class="draw acc" d="M180.5 {y-4}H{180+ (160 if i<2 else 90 if i==2 else 0)}" />' if done else ""))
    b.append('<text class="m mute" x="20" y="196" font-size="10.5">потрачено $0,00 из бюджета $1,00 — видно в каждой точке</text>')
    return win(360, 212, "ход работы · пример", g(*b))

def ill_stop():
    b1, h1 = bub(340, 44, ["стоп"], "u", 80)
    b2, h2 = bub(20, 44 + h1 + 12, ["Остановился. Пока не напишете", "«продолжить», ничего не делаю."], "a")
    return win(360, 150, "чат", g(b1, b2))

def ill_fix():
    b1, h1 = bub(340, 44, ["Я знаю факт, которого нет в", "источниках: рейтинг приложения 4,6"], "u")
    b2, h2 = bub(20, 44 + h1 + 12, ["Записал утверждением c012.", "Подтвердите: подтверждаю c012"], "a")
    return win(360, 170, "чат · пример", g(b1, b2))

def ill_go():
    b1, h1 = bub(340, 44, ["продолжим"], "u", 110)
    b2, h2 = bub(20, 44 + h1 + 12, ["Читаю состояние с диска.", "Остановились на точке G3."], "a")
    return win(360, 150, "новый чат · пример", g(b1, b2))

def ill_new():
    b1, h1 = bub(340, 44, ["вышли новые данные", "https://…/тарифы-билайн"], "u")
    b2, h2 = bub(20, 44 + h1 + 12, ["Нашёл затронутые выводы: 4.", "Жду «R да» или «R правка: …»"], "a")
    return win(360, 170, "чат · пример", g(b1, b2))

def ill_hero():
    b1, h1 = bub(380, 50, ["Кому продавать МегаНейросети и", "продолжать ли направление?"], "u")
    b2, h2 = bub(24, 50 + h1 + 14, ["Постановку собрал. Читайте точку G1:", "outputs/gates/G1.md", "Ответьте: G1 да или G1 правка: …"], "a")
    y = 50 + h1 + 14 + h2 + 16
    c1, w1 = chip(24, y, "G1 да"); c2, w2 = chip(24 + w1 + 10, y, "G1 правка …", on=False)
    return win(404, y + 52, "чат Claude Code", g(b1, b2, c1, c2), "hero-ill")

def sheet_monday():
    b = ['<rect class="pg" x="0" y="0" width="340" height="248"/>', '<text class="d" x="24" y="40" font-size="22">Что делать в понедельник</text>']
    items = [("Запросить у владельца продукта число подписчиков «Про»", "c028, c029"), ("Собрать 10 интервью с закупщиками малого бизнеса", "c037"), ("Подготовить пилот «ИИ в тарифе» на 5\u00a0000 абонентов", "c034")]
    for i, (t, c) in enumerate(items):
        y = 84 + i * 52
        import textwrap
        ls = textwrap.wrap(t, 38)
        b.append(f'<rect class="pk" x="24" y="{y-10}" width="8" height="8"/>' + "".join(f'<text class="t pt" x="44" y="{y+16*k}" font-size="13">{E(l)}</text>' for k, l in enumerate(ls)) + f'<text class="m pc" x="44" y="{y+16*len(ls)+2}" font-size="11">[{c}]</text>')
    return f'<svg class="sheet" viewBox="0 0 340 248" role="img" aria-label="Записка: что делать в понедельник" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

def sheet_strategy():
    b = ['<rect class="pg" x="0" y="0" width="340" height="248"/>', '<text class="d" x="24" y="40" font-size="22">Стратегия</text>']
    lines = ["Рекомендуем вариант O3: встроить ИИ в", "тариф связи как платный пакет и проверить", "пилотом. Решение держится на допущениях,", "не на фактах"]
    for i, l in enumerate(lines):
        b.append(f'<text class="t pt" x="24" y="{70+i*18}" font-size="13">{E(l)}</text>')
    b.append('<text class="m pc" x="24" y="150" font-size="11.5">[c054, c056]</text>')
    b.append('<rect class="mark" x="24" y="170" width="292" height="1"/>')
    b.append('<text class="t pt" x="24" y="192" font-size="13">Пилот на 5 000 абонентов, 28 дней.</text><text class="t pt" x="24" y="210" font-size="13">Стоп, если подключение ниже 4%</text><text class="m pc" x="24" y="230" font-size="11.5">[c053]</text>')
    return f'<svg class="sheet" viewBox="0 0 340 248" role="img" aria-label="Стратегия" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

def sheet_review():
    b = ['<rect class="pg" x="0" y="0" width="340" height="248"/>', '<text class="d" x="24" y="40" font-size="22">Пересмотр 1</text>']
    b.append('<text class="t pt" x="24" y="66" font-size="12.5">Новый факт: Билайн начисляет 300 токенов</text><text class="t pt" x="24" y="83" font-size="12.5">в месяц без доплаты</text>')
    b.append('<text class="m pc" x="24" y="114" font-size="10.5">вариант</text><text class="m pc" x="130" y="114" font-size="10.5">лидер был</text><text class="m pc" x="230" y="114" font-size="10.5">лидер стал</text><rect class="mark" x="24" y="120" width="292" height="1"/>')
    rows = [("O1", 0, 2), ("O2", 16, 43), ("O3", 84, 51), ("O4", 0, 4)]
    for i, (o, a, c) in enumerate(rows):
        y = 144 + i * 24
        b.append(f'<text class="m pt" x="24" y="{y}" font-size="12">{o}</text><rect class="bar0" x="130" y="{y-9}" width="{a*0.6}" height="9"/><text class="m pt" x="{134+a*0.6}" y="{y}" font-size="10.5">{a}%</text><rect class="bar1" x="230" y="{y-9}" width="{c*0.6}" height="9"/><text class="m pt" x="{234+c*0.6}" y="{y}" font-size="10.5">{c}%</text>')
    return f'<svg class="sheet" viewBox="0 0 340 248" role="img" aria-label="Отчёт пересмотра: как изменился расчёт" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

def ill_folders():
    # три зоны: правила (читает), состояние (только через CLI), результаты (пишет)
    b = []
    zones = [("правила", "instructions/  methods/  kb/", "агент читает", 0), ("состояние", "projects/<проект>/materials  state", "только через bin/osnovanie", 1), ("результаты", "projects/<проект>/outputs/", "здесь агент пишет сам", 2)]
    for n, p, r, i in zones:
        x = 10 + i * 250
        b.append(f'<path class="bub {"a" if i<2 else "u"}" d="M{x+.5} 40.5H{x+222.5}L{x+239.5} 57.5V150.5H{x+.5}Z"/>')
        b.append(f'<text class="m acc" x="{x+16}" y="68" font-size="11">{n.upper()}</text>')
        b.append(f'<text class="t" x="{x+16}" y="96" font-size="12.5">{E(p.split("  ")[0])}</text>')
        for j, part in enumerate(p.split("  ")[1:]):
            b.append(f'<text class="t" x="{x+16}" y="{114+j*18}" font-size="12.5">{E(part)}</text>')
        b.append(f'<text class="m mute" x="{x+16}" y="138" font-size="10.5">{E(r)}</text>')
    b.append('<path class="draw acc" d="M236 98H258M486 98H508" fill="none"/>')
    return f'<svg class="ill wide" viewBox="0 0 750 170" role="img" aria-label="Три зоны папки: правила, состояние, результаты" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

def ill_http():
    b = []
    b.append('<path class="bub a" d="M10.5 30.5H150.5V130.5H10.5Z"/><text class="m acc" x="26" y="56" font-size="11">КЛИЕНТ</text><text class="t" x="26" y="80" font-size="12.5">ваша система,</text><text class="t" x="26" y="98" font-size="12.5">панель, скрипт</text>')
    b.append('<path class="bub u" d="M330.5 30.5H470.5V130.5H330.5Z"/><text class="m acc" x="346" y="56" font-size="11">ОСНОВАНИЕ</text><text class="t" x="346" y="80" font-size="12.5">127.0.0.1:8765</text><text class="t" x="346" y="98" font-size="12.5">только чтение</text>')
    b.append('<path class="draw acc" d="M154 62H326" fill="none"/><path class="acc2" d="M318 56l8 6-8 6" fill="none"/><text class="m acc" x="190" y="54" font-size="11">GET /v1/status</text>')
    b.append('<path class="ln" d="M154 104H326" stroke-dasharray="4 4"/><path class="xx" d="M232 96l16 16M248 96l-16 16"/><text class="m obj" x="190" y="124" font-size="11">POST → 405</text>')
    return f'<svg class="ill wide" viewBox="0 0 480 150" role="img" aria-label="GET работает, POST отклоняется с кодом 405" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

def ill_mcp():
    b = []
    b.append('<path class="bub a" d="M10.5 20.5H150.5V150.5H10.5Z"/><text class="m acc" x="26" y="46" font-size="11">CLAUDE CODE</text><text class="t" x="26" y="70" font-size="12.5">.mcp.json</text><text class="t" x="26" y="88" font-size="12.5">kb-state</text>')
    b.append('<path class="draw acc" d="M154 56H246" fill="none"/><path class="draw acc" d="M154 100H246" fill="none"/>')
    b.append('<path class="bub u" d="M250.5 20.5H470.5V150.5H250.5Z"/><text class="m acc" x="266" y="46" font-size="11">12 ИНСТРУМЕНТОВ</text><text class="t" x="266" y="70" font-size="12.5">читать состояние, искать</text><text class="t" x="266" y="88" font-size="12.5">утверждения, записать факт</text><text class="m obj" x="266" y="128" font-size="11">закрыть точку — нельзя</text>')
    return f'<svg class="ill wide" viewBox="0 0 480 170" role="img" aria-label="MCP: двенадцать инструментов, точку закрыть нельзя" xmlns="http://www.w3.org/2000/svg">{g(*b)}</svg>'

# ---------- блоки ----------
def term(tid, lines, title="osnovanie/"):
    pre = "\n".join(lines)
    return (f'<div class="term" data-reveal><div class="bar"><i></i><i></i><i></i><span>{title}</span></div>'
            f'<pre id="{tid}">{pre}</pre><button class="copy" type="button" data-copy="{tid}">копировать</button></div>')

def cmd(c, comment=None):
    s = f'<span class="p">$</span> {E(c)}'
    if comment:
        s += f'  <span class="c"># {E(comment)}</span>'
    return s

def step(n, title, text, svg, extra=""):
    return (f'<li class="gd-step" data-reveal><span class="n num">{n}</span>'
            f'<div class="tx"><h3>{title}</h3><p>{text}</p>{extra}</div><div class="il">{svg}</div></li>')

FAQ = [
    ("Агент может ответить за меня в точке?", "Нет. Точку закрывает только хук на ваше сообщение в чате. Текст страницы, файла или вызов инструмента её не закрывает. После 48 тестовых атак G1 осталась открытой: <a href=\"/proof/#security\">доказательства</a>."),
    ("Что делать, если я не согласен с вариантами?", "Напишите <code>G3 правка: …</code> и скажите, что не так. Агент перепишет варианты и покажет точку заново. Среди вариантов всегда есть «оставить как есть» и «закрыть направление»."),
    ("Откуда агент берёт числа?", "Каждое число в стратегии ведёт к утверждению вида <code>[c012]</code>, а оно к дословной цитате и адресу страницы. Утверждение без цитаты фактом не становится. В карте доверия цвет абзаца показывает: факт, расчёт, гипотеза или допущение."),
    ("Сколько это стоит?", "Бюджет вы называете в точке G2. Агент показывает потраченное в каждой точке и останавливается, когда бюджет кончился. Цена полного прогона с моделью пока не измерена: на эталонном проекте 0 ₽, потому что модель в нём не вызывалась. <a href=\"/proof/#cost\">Подробнее</a>."),
    ("Можно загрузить внутренние данные компании?", "Нет. Агент работает с открытыми источниками и материалами, которые вы положили сами. Прочие домены вы утверждаете на G2, внутренние адреса и <code>file://</code> запрещены."),
    ("Закрыл чат или прошла неделя. Что дальше?", "Откройте новый чат в той же папке и напишите «продолжим». Всё состояние лежит на диске, агент прочитает его командой <code>resume</code> и скажет, где остановились."),
    ("Пришли новые данные. Как пересмотреть решение?", "Напишите «вышли новые данные» и дайте ссылку или файл. Агент найдёт выводы, которые на них держались, покажет, что меняется, и попросит <code>R да</code> или <code>R правка: …</code>."),
    ("Агент напишет кому-нибудь от моего имени?", "Нет. Сообщения вне чата, отправка работ и публикация — только по вашей прямой просьбе. Так записано в правилах агента."),
    ("Работает ли это в Cursor или Codex?", "Файлы для них подготовлены (<code>.cursor/</code>, <code>.codex/</code>, общий вход <code>AGENTS.md</code>), но сами программы на нашей машине не стоят, поэтому мы не проверяли. Проверено в Claude Code."),
    ("Что если агент ошибся?", "Ошибиться он может. Поэтому у каждого варианта есть возражение скептика, у числа есть цитата, а решение принимаете вы. Чего скрипт не видит (аудитории продукта и коммуникации расходятся, гипотеза подана как факт), ловит рубрика судьи и вы на G4."),
]

faq = "".join(f'<details data-reveal><summary><span>{q}</span><i aria-hidden="true"></i></summary><div class="a"><p>{a}</p></div></details>' for q, a in FAQ)

CLI_GROUPS = [
    ("Проект", ["new", "use", "list", "status", "resume", "log", "brief", "budget"]),
    ("Знания", ["source", "claim", "verify", "question", "search"]),
    ("Анализ", ["options", "objection", "model", "check", "whatif", "data", "ux", "interview"]),
    ("Точки и пересмотр", ["gate", "advance", "decide", "commit", "review", "watch"]),
    ("Результат", ["map", "deck", "score", "export", "import", "replay"]),
    ("Служебное", ["doctor", "facts", "rules", "cost", "route", "judge", "step", "serve", "mcp", "demo"]),
]
cli_groups = "".join(f'<div class="grp" data-reveal><h4>{n}</h4><p>{"".join(f"<code>{c}</code>" for c in cs)}</p></div>' for n, cs in CLI_GROUPS)

MCP_TOOLS = [
    ("kb_status", "этап, точки, счётчики, бюджет"), ("kb_resume", "сводка для нового чата"), ("claims_search", "поиск утверждений по словам, смыслу и связям"),
    ("claim_get", "одно утверждение с цитатой"), ("claim_add", "записать утверждение; факт без цитаты отклоняется"), ("claim_supersede", "заменить утверждение, старое остаётся в журнале"),
    ("verify_claims", "проверить дословность цитат и числа"), ("options_list", "варианты с возражениями"), ("model_run", "пересчитать модель вариантов"),
    ("review_preview", "что затронут изменения, без записи"), ("cost_report", "стоимость проекта"), ("gate_status", "состояние точек; подтвердить точку нельзя"),
]
mcp_rows = "".join(f'<tr><td><code>{n}</code></td><td>{d}</td></tr>' for n, d in MCP_TOOLS)

HTTP_ROWS = [("/health", "жив ли сервер; без токена"), ("/v1/openapi.json", "описание интерфейса"), ("/v1/status", "этап, точки, счётчики"), ("/v1/claims", "все утверждения"), ("/v1/claims/{id}", "одно утверждение"),
             ("/v1/options", "варианты с возражениями"), ("/v1/cost", "стоимость"), ("/v1/gates", "состояние точек"), ("/v1/next", "что делать дальше"), ("/v1/map", "карта доверия, HTML")]
http_rows = "".join(f'<tr><td><code>GET {p}</code></td><td>{d}</td></tr>' for p, d in HTTP_ROWS)

page = f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Инструкция — Основание</title>
<meta name="description" content="Как пользоваться «Основанием» без терминала: что написать агенту, как отвечать в точках G1–G4 и R, как остановить и продолжить. Для инженера: установка, тесты, CLI, MCP и HTTP.">
<meta property="og:title" content="Инструкция — Основание">
<meta property="og:image" content="/img/og.png">
<meta name="theme-color" content="#07100c">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/Reper-Regular.woff2" as="font" type="font/woff2" crossorigin>
</head>
<body class="gd-page">
<!--nav:guide-->
<main id="main">

  <section class="gd-hero wrap">
    <div class="hero-tx">
      <p class="kicker">Инструкция</p>
      <h1 data-split data-split-now>Руководителю<br>без терминала</h1>
      <p class="lead">Папку открываете в Claude Code, задачу пишете как аналитику. Дальше агент работает сам и останавливается в пяти местах, где решать вам. Отвечать нужно двумя словами: «G1 да».</p>
      <nav class="gd-jump" aria-label="Разделы инструкции">
        <a class="btn" href="#start">Начать <span class="arr">↓</span></a>
        <span class="gd-or mono">или сразу: <a href="#engineer">инженеру</a> · <a href="#cli">интерфейсы</a> · <a href="#faq">вопросы</a></span>
      </nav>
    </div>
    <div class="hero-il" data-reveal>{ill_hero()}</div>
  </section>

  <section class="gd-sec paper seam-top" id="start" aria-labelledby="startH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Руководителю</p><h2 id="startH">Начать за три шага</h2></div>
      <ol class="gd-steps">
        {step(1, "Откройте папку", "В Claude Code выберите папку <code>osnovanie</code>. Больше ничего устанавливать не нужно. Агент сам начнёт с команды <code>resume</code>.", ill_open())}
        {step(2, "Напишите задачу", "Своими словами, как аналитику: про что решение, к какому сроку, для кого. Подойдёт пример справа.", ill_task())}
        {step(3, "Ответьте на 1–3 вопроса", "Агент спросит только то, без чего нельзя двигаться. Остальное не отнимет у вас времени.", ill_ask(), '<p class="mono note">Вопросы здесь — пример. Обязательны пять полей: вопрос, цель, получатель, ограничения, данные.</p>')}
      </ol>
    </div>
  </section>

  <section class="gd-sec gd-gates" id="gates" aria-labelledby="gatesH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Где вы нужны</p><h2 id="gatesH">Пять точек.<br>Между ними агент работает сам</h2>
        <p class="lead">Перед каждой точкой агент кладёт короткий пакет в <code>outputs/gates/</code> и ждёт. Нажмите на точку и попробуйте ответить.</p></div>
      <ol class="gd-track" id="track" aria-label="Этапы работы">
        <li><span class="st">Постановка</span><b class="pt" data-g="G1">G1</b></li>
        <li><span class="st">План и источники</span><b class="pt" data-g="G2">G2</b></li>
        <li><span class="st">Исследование</span><i class="auto">сам</i></li>
        <li><span class="st">Варианты</span><b class="pt" data-g="G3">G3</b></li>
        <li><span class="st">Стратегии</span><b class="pt" data-g="G4">G4</b></li>
        <li><span class="st">Сопровождение</span><b class="pt" data-g="R">R</b></li>
      </ol>
      <div class="gd-sim" id="sim">
        <div class="sim-nav" role="tablist" aria-label="Точка"></div>
        <div class="sim-chat" id="simChat" aria-live="polite"></div>
        <div class="sim-side">
          <p class="mono k">Что решаете</p><p class="what" id="simWhat"></p>
          <p class="mono k">Как ответить</p>
          <div class="replies" id="simReplies"></div>
          <p class="mono note">Ответ принимает только ваше сообщение в чате. Реплики агента здесь — пример, карточки точек настоящие, из эталонного проекта.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="gd-sec paper" id="control" aria-labelledby="ctrlH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Управление</p><h2 id="ctrlH">Остановить, поправить,<br>продолжить</h2></div>
      <ol class="gd-steps compact">
        {step("—", "<code>стоп</code>", "Агент останавливается сразу. Любые действия запрещены, пока вы не напишете «продолжить».", ill_stop())}
        {step("—", "Сказать то, чего нет в источниках", "Назовите факт агенту. Он запишет его утверждением, а вы подтвердите: <code>подтверждаю c012</code>.", ill_fix())}
        {step("—", "Вернуться через неделю", "Новый чат, слово «продолжим». Состояние лежит на диске, агент прочитает его и скажет, где остановились.", ill_go())}
        {step("—", "Пришли новые данные", "Дайте ссылку или файл. Агент найдёт выводы, которые на них держались, и попросит <code>R да</code>.", ill_new())}
      </ol>
    </div>
  </section>

  <section class="gd-sec gd-out" id="results" aria-labelledby="outH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Что получите</p><h2 id="outH">Три документа<br>и карта доверия</h2>
        <p class="lead">Страницы ниже — настоящие фрагменты эталонного проекта <code>meganeuroseti-ref</code>. Агент собрал их по правилам, но это не прогон модели.</p></div>
      <div class="gd-docs">
        <figure class="big" data-reveal>{sheet_monday()}<figcaption><b>outputs/monday.md</b> Записка «что делать в понедельник»: решение, первые шаги, кто отвечает. Одна страница.</figcaption></figure>
        <figure data-reveal style="--d:.08s">{sheet_strategy()}<figcaption><b>outputs/strategy.md</b> Стратегия. У каждого числа ссылка на цитату.</figcaption></figure>
        <figure data-reveal style="--d:.16s">{sheet_review()}<figcaption><b>outputs/review-1.md</b> Отчёт пересмотра: что изменилось и кто потерял лидерство.</figcaption></figure>
      </div>
      <p class="gd-more">Ещё в <code>outputs/</code>: <code>trust-map.html</code> (вся стратегия в браузере, цвет абзаца показывает опору), <code>situation.md</code>, <code>options.md</code>, <code>product.md</code>, <code>communication.md</code>, <code>validation.md</code>. <a href="/pult/">Пульт проекта</a> показывает то же на сайте.</p>
    </div>
  </section>

  <section class="gd-sec paper" id="engineer" aria-labelledby="engH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Инженеру внедрения</p><h2 id="engH">Развернуть и проверить<br>за три минуты</h2>
        <p class="lead">Нужны Python 3.11+, uv и Claude Code. Ключи не обязательны: без них агент работает на вашей подписке.</p></div>
      <ol class="eng">
        <li data-reveal><span class="n num">1</span><div><h3>Проверить окружение</h3><p>Команда смотрит Python, <code>claude</code>, <code>uv</code>, списки доменов, хуки, навыки и хеши правил.</p>
          {term("e1", [cmd("make doctor", "окружение, хуки, навыки, хеши правил")])}
          <p class="mono note">Если doctor пишет, что правила не совпадают с зафиксированными, это защита от тихой правки. Фиксирует человек в терминале: <code>bin/osnovanie rules lock</code>.</p></div></li>
        <li data-reveal><span class="n num">2</span><div><h3>Прогнать тесты и оценки</h3><p><span data-fact="agent.tests">79</span> тестов и замеры защиты. Отчёт ложится в <code>evals/report.md</code>.</p>
          {term("e2", [cmd("make test", "79 тестов"), cmd("make eval", "инъекции, дефекты стратегии")])}</div></li>
        <li data-reveal><span class="n num">3</span><div><h3>Посмотреть эталонный проект</h3><p>Движок собирает проект из 27 цитат без сети и без модели. Точки закрыты каналом <code>demo-seed</code>.</p>
          {term("e3", [cmd("bin/osnovanie demo seed"), cmd("bin/osnovanie score", "индекс обоснованности"), cmd("bin/osnovanie map", "карта доверия"), cmd("bin/osnovanie deck", "презентация из 14 слайдов")])}</div></li>
        <li data-reveal><span class="n num">4</span><div><h3>Запустить настоящий прогон</h3><p>Чистый профиль Claude Code: без личных инструкций, навыков и хуков. Журналы сессии ложатся в <code>~/.claude-osnovanie/projects/</code>, оттуда их берёт сборка реплея.</p>
          {term("e4", [cmd("make demo-shell", "войти через /login и написать задачу"), cmd("bin/osnovanie replay build", "реплей прогона из журналов")])}
          <p class="mono note">Живого прогона на этих материалах ещё нет: сайт показывает эталонный проект и говорит об этом.</p></div></li>
      </ol>
      <div class="gd-zones" data-reveal>
        <h3>Куда агент может писать</h3>
        {ill_folders()}
        <p class="mono note">Запись только в <code>outputs/</code>, остальное через CLI. Это проверяет хук и тест <code>test_security.py::Guard</code>. Необязательные ключи — в <code>.env.example</code>: <code>TYPESAFE_API_KEY</code> (классификатор для маршрутизации; без него судья откатывается на haiku, потом sonnet), <code>WHISPER_MODEL</code>, <code>OSNOVANIE_API_TOKEN</code>.</p>
      </div>
    </div>
  </section>

  <section class="gd-sec gd-if" id="interfaces" aria-labelledby="ifH">
    <div class="wrap">
      <div class="gd-head"><p class="kicker">Интерфейсы</p><h2 id="ifH">Три способа<br>работать с состоянием</h2>
        <p class="lead">Одни и те же данные проекта: руками, из Claude Code и из ваших систем.</p></div>

      <div class="if-block" id="cli">
        <div class="if-tx"><h3>CLI <code>osnovanie</code></h3>
        <p><b class="num" data-fact="agent.cli_commands">43</b> команды в шести группах. Флаг <code>--json</code> даёт вывод для программ, <code>--project имя</code> выбирает проект вместо активного.</p></div>
        <div class="if-body">
          <div class="grps">{cli_groups}</div>
          {term("c1", [cmd("bin/osnovanie status", "где мы сейчас"), cmd("bin/osnovanie --json cost", "стоимость для программы"), cmd("bin/osnovanie score --badge score.svg"), cmd("bin/osnovanie export site --out DIR", "пакет для сайта-витрины")])}
        </div>
      </div>

      <div class="if-block" id="mcp">
        <div class="if-tx"><h3>MCP <code>kb-state</code></h3>
        <p>Сервер подключается к Claude Code через <code>.mcp.json</code>. Он читает состояние и пишет утверждения, но <b>закрыть точку не может</b>.</p>{ill_mcp()}</div>
        <div class="if-body">
          {term("m1", ['{', '  "mcpServers": {', '    "kb-state": {', '      "command": "python3",', '      "args": ["bin/osnovanie", "mcp"]', '    }', '  }', '}'], ".mcp.json")}
          <table class="gd-table"><thead><tr><th>Инструмент</th><th>Что делает</th></tr></thead><tbody>{mcp_rows}</tbody></table>
        </div>
      </div>

      <div class="if-block" id="http">
        <div class="if-tx"><h3>HTTP, только чтение</h3>
        <p>Для панелей и отчётов. Слушает только <code>127.0.0.1</code>; запись не поддерживается. Если задан <code>OSNOVANIE_API_TOKEN</code>, нужен заголовок <code>Authorization: Bearer …</code>.</p>{ill_http()}</div>
        <div class="if-body">
          {term("h1", [cmd("bin/osnovanie serve --port 8765"), cmd("curl http://127.0.0.1:8765/v1/status"), cmd("curl -H 'Authorization: Bearer $OSNOVANIE_API_TOKEN' http://127.0.0.1:8765/v1/gates")])}
          <table class="gd-table"><thead><tr><th>Запрос</th><th>Ответ</th></tr></thead><tbody>{http_rows}</tbody></table>
        </div>
      </div>
    </div>
  </section>

  <section class="gd-sec paper" id="faq" aria-labelledby="faqH">
    <div class="wrap faq-wrap">
      <div class="gd-head"><p class="kicker">Вопросы</p><h2 id="faqH">Что обычно спрашивают</h2>
        <p class="lead">Где проверки нет, так и сказано: про Cursor и цену прогона. <a href="/proof/#criteria">Что проверено</a>.</p></div>
      <div class="faq">{faq}</div>
    </div>
  </section>

</main>
<!--foot-->
<script type="module" src="/src/js/guide.js"></script>
</body>
</html>
'''
open(W, "w").write(page)
print(len(page))
