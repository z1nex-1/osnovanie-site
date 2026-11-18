// Графика «Основания» в Illustrator: инженерная линия на тёмном, срезы 45°, растр для непрочитанного,
// зелёный только у того, что подтверждено цитатой. Подписи не рисуются: их координаты уходят в .labels.txt,
// post.py вставляет их в SVG живым текстом.
//   ax.py ai draw.jsx --arg lib=<kit/illo/ai.jsx> --arg out=<папка> [--arg only=graph,og] [--arg og=<og-text.svg>]
$.evalFile(new File(AX.args.lib));

var C = {
    bg: "#07100C", bg2: "#0C1812", rule: "#23362C", head: "#EEF4F0", ink: "#D8E3DC", mute: "#7E9488",
    ok: "#0CDC78", hyp: "#FFA717", obj: "#FF5A64", paper: "#DDE6E0", pink: "#0A140F", hit: "#C4EBD3", dim: "#3A5245"
};
var LAB = [];
var WID = [0.96, 0.88, 1, 0.72, 0.93, 0.81, 0.98, 0.64, 0.9, 0.85, 0.99, 0.77, 0.94, 0.7, 0.87, 1, 0.83, 0.92, 0.6, 0.95];
function wid(i, full) { return Math.round(full * WID[Math.round(i) % WID.length]); }

function st(p, w, hex, dash) {
    p.filled = false; p.stroked = true; p.strokeColor = D.color(hex); p.strokeWidth = w;
    p.strokeCap = StrokeCap.BUTTENDCAP; p.strokeJoin = StrokeJoin.MITERENDJOIN; p.strokeMiterLimit = 4;
    if (dash) p.strokeDashes = dash;
    return p;
}
function L(pts, w, hex, dash, name) { var p = st(D.trace(pts, false, 0), w, hex, dash); if (name) p.name = name; return p; }
function P(pts, w, hex, dash, name) { var p = st(D.trace(pts, true, 0), w, hex, dash); if (name) p.name = name; return p; }
function F(pts, hex, op, name) { var p = D.shape(pts, hex, op, 0); if (name) p.name = name; return p; }
function R(x, y, w, h, hex, op, name) { var p = D.rr(x, y, w, h, 0, hex, op); if (name) p.name = name; return p; }

// Прямоугольник со срезом 45°: tr, bl, tl, br или пара «tr+bl».
function cr(x, y, w, h, c, k) {
    k = k || "tr";
    var tl = k.indexOf("tl") >= 0, tr = k.indexOf("tr") >= 0, br = k.indexOf("br") >= 0, bl = k.indexOf("bl") >= 0, p = [];
    p.push(tl ? [x, y + c] : [x, y]); if (tl) p.push([x + c, y]);
    if (tr) { p.push([x + w - c, y]); p.push([x + w, y + c]); } else p.push([x + w, y]);
    if (br) { p.push([x + w, y + h - c]); p.push([x + w - c, y + h]); } else p.push([x + w, y + h]);
    if (bl) { p.push([x + c, y + h]); p.push([x, y + h - c]); } else p.push([x, y + h]);
    return p;
}

// Растр — то, что ещё не прочитано. Строка точек — один пунктир с круглыми концами: в SVG это одна линия, а не сотни кругов.
function dots(x, y, w, h, step, r, hex, op, name) {
    var g = D.group(function () {
        for (var j = y + step / 2; j < y + h; j += step) {
            var n = Math.floor(w / step), x0 = x + (w - (n - 1) * step) / 2;
            var p = L([[x0, j], [x0 + (n - 1) * step + 0.01, j]], 2 * r, hex, [0, step]);
            p.strokeCap = StrokeCap.ROUNDENDCAP;
            if (op !== undefined) p.opacity = D.op(op);
        }
    });
    if (name) g.name = name;
    return g;
}

// Штриховка 45° внутри фигуры.
function hatch(shape, step, w, hex, op) {
    var b = shape.geometricBounds, x0 = b[0], y0 = -b[1], x1 = b[2], y1 = -b[3];
    D.tone(shape, function () {
        for (var s = x0 - (y1 - y0); s < x1; s += step) L([[s, y1], [s + (y1 - y0), y0]], w, hex).opacity = D.op(op);
    });
}

function arrow(x, y, dir, s, w, hex) {
    if (dir === "r") return L([[x - s, y - s], [x, y], [x - s, y + s]], w, hex);
    if (dir === "l") return L([[x + s, y - s], [x, y], [x + s, y + s]], w, hex);
    if (dir === "u") return L([[x - s, y + s], [x, y], [x + s, y + s]], w, hex);
    return L([[x - s, y - s], [x, y], [x + s, y - s]], w, hex);
}

function lab(x, y, text, cls, anchor) { LAB.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10, cls || "m", anchor || "start", text].join("\t")); }

function bg(hex) { var r = R(0, 0, D.w, D.h, hex); r.name = "bg"; return r; }

// ---------- Источники: страница, пресса, тариф, опрос (64) ----------
var ART = {};

ART["src-page"] = function () {
    D.doc(64, 64);
    P(cr(12, 6, 40, 52, 11, "tr"), 2, C.head);
    L([[41, 6], [41, 17], [52, 17]], 1.5, C.mute);
    L([[19, 25], [34, 25]], 2, C.ink); L([[19, 32], [44, 32]], 2, C.ink); L([[19, 39], [40, 39]], 2, C.ink);
    R(19, 45, 22, 4, C.ok);
};
ART["src-press"] = function () {
    D.doc(64, 64);
    P(cr(8, 6, 48, 52, 11, "bl"), 2, C.head);
    R(14, 12, 36, 6, C.head);
    L([[14, 26], [29, 26]], 2, C.ink); L([[14, 33], [29, 33]], 2, C.ink); L([[14, 40], [26, 40]], 2, C.ink);
    dots(34, 23, 16, 28, 4, 0.9, C.mute);
};
ART["src-tariff"] = function () {
    D.doc(64, 64);
    P([[8, 22], [22, 8], [56, 8], [56, 56], [22, 56], [8, 42]], 2, C.head);
    P(cr(16, 27, 8, 10, 0, ""), 1.5, C.mute);
    L([[32, 22], [48, 22]], 2, C.ink); R(32, 30, 16, 6, C.ok); L([[32, 44], [44, 44]], 2, C.ink);
};
ART["src-poll"] = function () {
    D.doc(64, 64);
    L([[6, 56], [58, 56]], 2, C.head);
    P(cr(10, 30, 10, 26, 4, "tr"), 2, C.head);
    P(cr(27, 14, 10, 42, 4, "tr"), 2, C.head);
    F(cr(27, 14, 10, 42, 4, "tr"), C.ok);
    P(cr(44, 38, 10, 18, 4, "tr"), 2, C.head);
    dots(44, 38, 10, 18, 3.4, 0.8, C.mute);
};

// ---------- Типы утверждений (48) ----------
ART["kind-fact"] = function () { D.doc(48, 48); F(cr(8, 8, 32, 32, 11, "tr"), C.ok); };
ART["kind-hyp"] = function () { D.doc(48, 48); P(cr(9, 9, 30, 30, 10, "tr"), 2, C.hyp, [5, 3]); };
ART["kind-assume"] = function () {
    D.doc(48, 48);
    P(cr(9, 9, 30, 30, 10, "tr"), 2, C.mute);
    dots(11, 11, 26, 26, 4.2, 0.9, C.mute);
};
ART["kind-forecast"] = function () {
    D.doc(48, 48);
    P(cr(5, 13, 22, 22, 8, "tr"), 2, C.ink);
    L([[27, 24], [43, 24]], 2, C.ink, [3, 2.5]);
    arrow(43, 24, "r", 5, 2, C.ink);
};
ART["kind-concl"] = function () {
    D.doc(48, 48);
    L([[4, 10], [16, 10], [28, 22]], 2, C.ink);
    L([[4, 24], [28, 24]], 2, C.ink);
    L([[4, 38], [16, 38], [28, 26]], 2, C.ink);
    F(cr(28, 16, 16, 16, 6, "tr"), C.head);
};

// ---------- Входы: командная строка, MCP, HTTP (96) ----------
ART["entry-cli"] = function () {
    D.doc(96, 96);
    P(cr(6, 14, 84, 68, 16, "tr"), 2, C.head);
    L([[6, 28], [74, 28]], 1.5, C.mute);
    L([[18, 42], [28, 51], [18, 60]], 2.5, C.head);
    R(34, 57, 18, 5, C.ok, undefined, "cursor");
};
ART["entry-mcp"] = function () {
    D.doc(96, 96);
    P(cr(4, 20, 40, 56, 10, "tr"), 2, C.head);
    L([[4, 32], [34, 32]], 1.5, C.mute);
    L([[12, 44], [30, 44]], 2, C.ink); L([[12, 52], [26, 52]], 2, C.ink);
    L([[44, 42], [60, 42]], 3, C.ok); L([[44, 56], [60, 56]], 2, C.mute);
    for (var i = 0; i < 3; i++) P(cr(60, 22 + i * 19, 32, 14, i === 0 ? 6 : 0, "tr"), 2, C.head);
    R(66, 27, 6, 4, C.ok);
};
ART["entry-http"] = function () {
    D.doc(96, 96);
    P(cr(8, 8, 44, 60, 12, "tr"), 2, C.head);
    L([[16, 24], [36, 24]], 2, C.ink); L([[16, 32], [42, 32]], 2, C.ink); L([[16, 40], [32, 40]], 2, C.ink);
    L([[40, 52], [86, 52]], 2, C.ok); arrow(86, 52, "r", 6, 2, C.ok);
    L([[88, 80], [62, 80]], 2, C.mute, [4, 3]); arrow(62, 80, "l", 5, 2, C.mute);
    L([[56, 72], [56, 88]], 3, C.obj);
};

// ---------- Путь прогона с точками человека G1–G4 и пересмотром R (1200×220) ----------
ART["pipeline"] = function () {
    D.doc(1200, 220);
    var names = ["Вопрос", "План", "Источники", "Утверждения", "Варианты", "Записка", "Решение"];
    var cx = [], i, y0 = 64, h = 52, w = 124;
    for (i = 0; i < 7; i++) cx.push(82 + i * 172.7);
    L([[20, y0 + h / 2], [1180, y0 + h / 2]], 1.5, C.rule, undefined, "rail");
    L([[20, y0 + h / 2], [1180, y0 + h / 2]], 2, C.ok, undefined, "flow");
    for (i = 0; i < 7; i++) {
        var box = F(cr(cx[i] - w / 2, y0, w, h, 14, "tr"), C.bg, undefined, "s" + i);
        st(box, i === 3 ? 2 : 1.5, i === 3 ? C.ok : C.ink);
        box.filled = true; box.fillColor = D.color(C.bg);
        lab(cx[i], y0 + h / 2 + 5, names[i], "s", "middle");
    }
    var gates = [[0, "G1"], [1, "G2"], [4, "G3"], [5, "G4"]];
    for (i = 0; i < gates.length; i++) {
        var gx = (cx[gates[i][0]] + cx[gates[i][0] + 1]) / 2;
        D.group(function () {
            R(gx - 7, y0 - 18, 4, h + 36, C.head);
            R(gx + 3, y0 - 18, 4, h + 36, C.head);
            F([[gx - 7, y0 - 18], [gx + 7, y0 - 18], [gx + 7, y0 - 26], [gx + 1, y0 - 32], [gx - 7, y0 - 32]], C.head);
        }).name = "g" + (i + 1);
        lab(gx, y0 - 42, gates[i][1], "g", "middle");
    }
    var ry = 186;
    L([[cx[6], y0 + h], [cx[6], ry - 10], [cx[6] - 10, ry], [cx[3] + 10, ry], [cx[3], ry - 10], [cx[3], y0 + h + 8]], 2, C.obj, [7, 5], "rloop");
    arrow(cx[3], y0 + h + 4, "u", 7, 2, C.obj);
    F(cr(cx[6] - 40, ry - 14, 28, 28, 9, "tr"), C.obj, undefined, "rnode");
    lab(cx[6] - 26, ry + 6, "R", "r", "middle");
    lab((cx[3] + cx[6]) / 2, ry - 10, "новый факт → пересчёт только зависимых выводов", "m", "middle");
};

// ---------- Карантин: текст источника не становится командой (960×420) ----------
ART["quarantine"] = function () {
    D.doc(960, 420);
    F(cr(32, 40, 236, 320, 32, "tr"), C.paper);
    var ys = [84, 112, 140, 168, 196, 224, 252, 280, 308];
    for (var i = 0; i < ys.length; i++) {
        if (i === 5) continue;
        var wl = [180, 196, 150, 188, 170, 0, 160, 192, 120][i];
        if (i >= 6) dots(56, ys[i] - 6, wl, 10, 3.2, 0.9, C.pink, 0.55);
        else L([[56, ys[i]], [56 + wl, ys[i]]], 4, C.pink, undefined).opacity = 75;
    }
    R(52, ys[5] - 11, 200, 20, C.obj, 0.22);
    L([[56, ys[5]], [236, ys[5]]], 4, "#B3202B", undefined, "inject");
    R(52, ys[2] - 11, 190, 20, C.hit);
    L([[56, ys[2]], [206, ys[2]]], 4, C.pink);
    lab(32, 26, "источник: текст страницы", "m");
    lab(32, 384, "строка 6 — скрытая инструкция", "m");

    var q = F(cr(340, 72, 260, 256, 28, "tr+bl"), C.bg2, undefined, "qbox");
    hatch(q, 12, 1, C.rule, 1);
    P(cr(340, 72, 260, 256, 28, "tr+bl"), 2, C.mute, [8, 5]);
    lab(340, 58, "карантин: текст читается как данные", "m");
    L([[268, ys[2]], [340, ys[2]]], 2, C.ok, undefined, "w1");
    L([[268, ys[5]], [340, ys[5]]], 2, C.obj, undefined, "w2");
    F(cr(372, 118, 196, 44, 12, "tr"), C.bg, undefined);
    P(cr(372, 118, 196, 44, 12, "tr"), 1.5, C.ink);
    lab(386, 145, "«…299 ₽ в месяц»", "q");
    F(cr(372, 212, 196, 44, 12, "tr"), C.bg, undefined);
    P(cr(372, 212, 196, 44, 12, "tr"), 1.5, C.obj, [4, 3]);
    lab(386, 239, "«игнорируй правила…»", "q");

    L([[600, 140], [700, 140]], 2, C.ok, undefined, "w3");
    arrow(700, 140, "r", 7, 2, C.ok);
    F(cr(712, 92, 216, 96, 28, "tr"), C.bg2, undefined, "claim");
    P(cr(712, 92, 216, 96, 28, "tr"), 1.5, C.rule);
    L([[900, 92], [928, 120]], 3, C.ok);
    lab(730, 124, "утверждение", "s");
    lab(730, 150, "цитата · дата · sha256", "m");

    L([[600, 234], [672, 234]], 2, C.obj, [6, 4], "w4");
    L([[672, 210], [672, 258]], 4, C.obj, undefined, "stop");
    P(cr(712, 196, 216, 76, 0, ""), 1.5, C.dim, [4, 4]);
    dots(714, 198, 212, 72, 6, 1, C.dim, 0.9);
    lab(730, 300, "команда агенту — не создаётся", "m");
};

// ---------- Граф: 18 страниц, 27 цитат, 4 варианта (1200×760) ----------
// Данные — osnovanie/demo/meganeuroseti-sources.md: страница каждой цитаты, группа, расхождения.
var PAGES = [
    ["megafon.ru/help", 0], ["megafon.ru/mega_ai", 0], ["anti-malware.ru", 1], ["itspeaker.ru", 1], ["tadviser.ru", 1],
    ["allweb.ru", 1], ["mobile-review.com", 2], ["lenta.ru", 2], ["checkroi.ru", 2], ["3dnews.ru", 2], ["gogpt.ru", 2],
    ["chadgpt.ru", 2], ["bothub.chat", 2], ["wciom.ru", 3], ["expert.ru", 3], ["hse.ru", 3], ["adindex.ru", 3], ["iphones.ru", 3]
];
var ROWPAGE = [0, 1, 1, 1, 2, 3, 3, 4, 5, 6, 6, 6, 7, 7, 8, 9, 10, 11, 12, 13, 13, 13, 14, 14, 15, 16, 17];
var FORECAST = { 7: 1 };
var OPTS = ["Оставить как есть", "Малый бизнес", "Вместе с тарифом", "Закрыть направление"];
var GROUP = ["МегаФон", "Пресса", "Конкуренты", "Рынок"];

ART["graph"] = function () {
    D.doc(1200, 760);
    var i, j, py = [], cy = [], top = 60, x0 = 196, xc = 600, xo = 940;
    var gy = 0, prev = -1;
    for (i = 0; i < PAGES.length; i++) {
        if (PAGES[i][1] !== prev) { if (prev >= 0) gy += 22; prev = PAGES[i][1]; lab(24, top + i * 34 + gy - 18, GROUP[prev], "gr"); }
        py.push(top + i * 34 + gy + 4);
    }
    for (j = 0; j < 27; j++) cy.push(top + 6 + j * 24.6);

    D.group(function () {
        for (j = 0; j < 27; j++) {
            var p = ROWPAGE[j], ya = py[p], yb = cy[j], xm = 252 + p * 15, d = yb > ya ? 1 : -1, c = Math.min(8, Math.abs(yb - ya) / 2);
            var pts = [[x0 + 12, ya], [xm - c, ya], [xm, ya + d * c], [xm, yb - d * c], [xm + c, yb], [xc - 4, yb]];
            if (Math.abs(yb - ya) < 1) pts = [[x0 + 12, ya], [xc - 4, yb]];
            L(pts, 1.25, C.ok, undefined, "e" + (j + 1)).opacity = 70;
        }
    }).name = "edges";

    for (i = 0; i < PAGES.length; i++) {
        var pn = F(cr(x0 - 12, py[i] - 8, 24, 16, 6, "tr"), C.bg, undefined, "p" + (i + 1));
        st(pn, 1.5, C.ink); pn.filled = true; pn.fillColor = D.color(C.bg);
        lab(x0 - 22, py[i] + 4.5, PAGES[i][0], "h", "end");
    }

    D.group(function () {
        for (j = 0; j < 27; j++) {
            var n;
            if (FORECAST[j + 1]) { n = P(cr(xc - 4, cy[j] - 8, 16, 16, 5, "tr"), 1.5, C.ink); n.name = "c" + (j + 1); }
            else F(cr(xc - 4, cy[j] - 8, 16, 16, 5, "tr"), C.ok, undefined, "c" + (j + 1));
            lab(xc + 22, cy[j] + 4.5, "#" + (j + 1 < 10 ? "0" : "") + (j + 1), "id");
        }
    }).name = "claims";

    // Расхождения в источниках МегаФона: «25» против «20+» (C-001/C-002), сегменты (C-001/C-004), «Стандарт» без цены (C-002).
    D.group(function () {
        L([[xc - 6, cy[0]], [xc - 24, cy[0]], [xc - 24, cy[1]], [xc - 6, cy[1]]], 2, C.obj, undefined, "x1");
        L([[xc - 6, cy[0] - 3], [xc - 36, cy[0] - 3], [xc - 36, cy[3]], [xc - 6, cy[3]]], 2, C.obj, undefined, "x2");
        R(xc + 74, cy[0] - 1.5, 22, 3, C.obj); R(xc + 74, cy[1] - 1.5, 22, 3, C.obj); R(xc + 74, cy[3] - 1.5, 22, 3, C.obj);
    }).name = "contra";
    lab(xc + 104, cy[0] + 4.5, "«25» против «20+»", "x");
    lab(xc + 104, cy[1] + 4.5, "«Стандарт» без цены", "x");
    lab(xc + 104, cy[3] + 4.5, "студенты против B2B", "x");

    var oh = 104, og = 44, otop = 104;
    for (i = 0; i < 4; i++) {
        var oy = otop + i * (oh + og);
        L([[xo - 48, oy + oh / 2], [xo, oy + oh / 2]], 1.25, C.mute, [3, 4], "w" + (i + 1));
        F(cr(xo, oy, 224, oh, 24, "tr"), C.bg2, undefined, "o" + (i + 1));
        P(cr(xo, oy, 224, oh, 24, "tr"), 1.5, i === 3 ? C.obj : C.ink);
        lab(xo + 18, oy + 34, "V" + (i + 1), "id");
        lab(xo + 18, oy + 64, OPTS[i], "o");
        lab(xo + 18, oy + 88, "опоры — после прогона", "m");
    }
    L([[xo - 48, cy[0] + 40], [xo - 48, cy[26]]], 1.25, C.mute, [3, 4], "bus");
    lab(xo - 56, cy[26] + 4.5, "связи — из прогона", "m", "end");
    lab(xc - 4, 30, "27 цитат", "gr");
    lab(x0 - 12, 30, "18 страниц", "gr");
    lab(xo, 30, "4 варианта", "gr");
};

// ---------- Швы секций: ступень 45° (1440×56) ----------
function seam(hex, tick) {
    D.doc(1440, 56);
    F([[0, 56], [0, 28], [692, 28], [720, 0], [1440, 0], [1440, 56]], hex, undefined, "fill");
    if (tick) L([[692, 28], [720, 0]], 3, C.ok, undefined, "tick");
}
ART["seam-dark"] = function () { seam(C.bg2, true); };
ART["seam-paper"] = function () { seam(C.paper, false); };
ART["seam-back"] = function () { seam(C.bg, true); };

// ---------- 404: строка прочитана, утверждения нет (600×360) ----------
ART["e404"] = function () {
    D.doc(600, 360);
    F(cr(300, 0, 300, 360, 0, ""), C.paper);
    for (var y = 28; y < 360; y += 28) {
        var wl = wid(y / 28, 260);
        if (y <= 168) L([[324, y], [324 + wl, y]], 5, C.pink).opacity = 70;
        else dots(324, y - 6, wl, 11, 3.4, 1, C.pink, 0.5);
    }
    R(320, 168 - 13, 260, 24, C.hit, undefined, "hitline");
    L([[324, 168], [500, 168]], 5, C.pink);
    L([[0, 184], [600, 184]], 2, C.ok, undefined, "beam");
    R(0, 182, 600, 1, C.ok, 0.35);
    P(cr(40, 214, 236, 108, 28, "tr"), 1.5, C.mute, [6, 5], "empty");
    dots(190, 222, 80, 92, 7, 1, C.dim, 1);
    L([[300, 168], [276, 168], [276, 214]], 1.5, C.obj, [4, 3]);
    R(270, 210, 12, 4, C.obj);
    lab(56, 252, "#??", "id");
    lab(56, 284, "нет в реестре", "m");
};

// ---------- OG 1200×630: открывает og-text.svg (слова контуром «Репера») и рисует сцену под ними ----------
ART["og"] = function () {
    var d = app.open(new File(AX.args.og));
    D.d = d; D.w = 1200; D.h = 630; D.stack = [];
    var ab = d.artboards[0].artboardRect, words = d.layers[0];
    d.artboards[0].artboardRect = [0, 0, 1200, -630];
    for (var t = 0; t < words.pageItems.length; t++) words.pageItems[t].translate(-ab[0], -ab[1]);
    var back = d.layers.add(); back.name = "scene"; back.zOrder(ZOrderMethod.SENDTOBACK);
    D.C = back;
    R(0, 0, 1200, 630, C.bg);
    var sx = 700;
    R(sx, 0, 500, 630, C.paper);
    for (var y = 42; y < 630; y += 30) {
        var wl = wid(y / 30 + 3, 444);
        if (y <= 282) L([[sx + 28, y], [sx + 28 + wl, y]], 6, C.pink).opacity = 72;
        else dots(sx + 28, y - 7, wl, 13, 4, 1.25, C.pink, 0.45);
    }
    R(sx + 20, 252 - 16, 440, 30, C.hit);
    L([[sx + 28, 252], [sx + 300, 252]], 6, C.pink);
    R(sx - 40, 296, 540, 2, C.ok);
    F(cr(sx + 60, 330, 360, 150, 36, "tr"), C.bg2);
    P(cr(sx + 60, 330, 360, 150, 36, "tr"), 1.5, C.rule);
    L([[sx + 384, 330], [sx + 420, 366]], 4, C.ok);
    R(sx + 88, 360, 120, 6, C.ok);
    R(sx + 88, 390, 280, 6, C.ink, 0.85);
    R(sx + 88, 408, 230, 6, C.ink, 0.85);
    R(sx + 88, 444, 160, 5, C.mute);
    L([[sx + 140, 252], [sx + 140, 330]], 2, C.ok);
};

function exportSVG(dir, name) {
    var o = new ExportOptionsSVG();
    o.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
    o.coordinatePrecision = 2;
    o.documentEncoding = SVGDocumentEncoding.UTF8;
    o.fontSubsetting = SVGFontSubsetting.None;
    o.embedRasterImages = true;
    D.d.exportFile(new File(dir + "/" + name + ".svg"), ExportType.SVG, o);
}

function writeLabels(dir, name) {
    var f = new File(dir + "/" + name + ".labels.txt");
    f.encoding = "UTF-8"; f.open("w"); f.write(LAB.join("\n")); f.close();
}

var out = AX.args.out, only = AX.args.only ? "," + AX.args.only + "," : "", done = [];
(new Folder(out)).create();
for (var k in ART) {
    if (only && only.indexOf("," + k + ",") < 0) continue;
    LAB = [];
    ART[k]();
    exportSVG(out, k);
    writeLabels(out, k);
    done.push(D.save(out, k, k.indexOf("src") === 0 || k.indexOf("kind") === 0 || k.indexOf("entry") === 0 ? 256 : Math.min(D.w * 1.5, 1800)));
}
done.join(" ");
