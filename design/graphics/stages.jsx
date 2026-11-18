// Шесть иллюстраций этапов «Основания» в Illustrator. Сетка 400×300, шаг 4, поля 16, шапка на y=26.
// Линии: основные #34503F 1,25, второстепенные #23362C 1,25, акценты 1,5. Подписи уходят в .labels.txt,
// post_stages.py вставляет их живым текстом.
//   ax.py ai stages.jsx --arg lib=/Users/z1nex/saiti/kit/illo/ai.jsx --arg out=<папка> [--arg only=intake,collect]
$.evalFile(new File(AX.args.lib));

var K = { l1: "#34503F", l2: "#23362C", mute: "#8AA094", head: "#EEF4F0", ok: "#0CDC78", hyp: "#FFA717", obj: "#FF5A64", card: "#0C1812" };
var LAB = [];
var W1 = 1.25, W2 = 1.5;

function st(p, w, hex, dash) {
    p.filled = false; p.stroked = true; p.strokeColor = D.color(hex); p.strokeWidth = w;
    p.strokeCap = StrokeCap.BUTTENDCAP; p.strokeJoin = StrokeJoin.MITERENDJOIN; p.strokeMiterLimit = 4;
    if (dash) p.strokeDashes = dash;
    return p;
}
function L(pts, w, hex, dash) { return st(D.trace(pts, false, 0), w, hex, dash); }
function P(pts, w, hex, dash, fill, op) {
    var p = st(D.trace(pts, true, 0), w, hex, dash);
    if (fill) { p.filled = true; p.fillColor = D.color(fill); if (op !== undefined) p.opacity = op; }
    return p;
}
function F(pts, hex, op) { var p = D.shape(pts, hex, op, 0); return p; }
function cr(x, y, w, h, c, k) {
    k = k || "";
    var tl = k.indexOf("tl") >= 0, tr = k.indexOf("tr") >= 0, br = k.indexOf("br") >= 0, bl = k.indexOf("bl") >= 0, p = [];
    p.push(tl ? [x, y + c] : [x, y]); if (tl) p.push([x + c, y]);
    if (tr) { p.push([x + w - c, y]); p.push([x + w, y + c]); } else p.push([x + w, y]);
    if (br) { p.push([x + w, y + h - c]); p.push([x + w - c, y + h]); } else p.push([x + w, y + h]);
    if (bl) { p.push([x + c, y + h]); p.push([x, y + h - c]); } else p.push([x, y + h]);
    return p;
}
function dia(cx, cy, r) { return [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]; }
function dot(cx, cy, r, hex) { return D.circle(cx, cy, r, hex); }
function ring(cx, cy, r, w, hex, dash, fill) {
    var e = D.ell(cx, cy, r, r, K.card, 1);
    e.filled = !!fill; if (fill) e.fillColor = D.color(fill);
    e.stroked = true; e.strokeColor = D.color(hex); e.strokeWidth = w;
    if (dash) e.strokeDashes = dash;
    return e;
}
function arrow(x, y, dir, s, w, hex) {
    if (dir === "r") return L([[x - s, y - s], [x, y], [x - s, y + s]], w, hex);
    if (dir === "u") return L([[x - s, y + s], [x, y], [x + s, y + s]], w, hex);
    if (dir === "d") return L([[x - s, y - s], [x, y], [x + s, y - s]], w, hex);
    return L([[x + s, y - s], [x, y], [x + s, y + s]], w, hex);
}
function hatch(pts, step, w, hex, op, x0, y0, x1, y1) {
    var shp = D.trace(pts, true, 0); shp.filled = false; shp.stroked = false;
    D.tone(shp, function () {
        for (var s = x0 - (y1 - y0); s < x1; s += step) L([[s, y1], [s + (y1 - y0), y0]], w, hex).opacity = op * 100;
    });
}
// Подпись: размер и цвет задаёт класс в post_stages.py.
function lab(x, y, text, cls, anchor) { LAB.push([x, y, cls || "m", anchor || "start", text].join("\t")); }
function head(code, name, gate, gcol) {
    var n = (code + " · " + name).length;
    lab(16, 29.5, code + " · " + name, "m");
    L([[16 + n * 6 + 8, 26], [gate ? 340 : 384, 26]], W1, K.l2);
    if (!gate) return;
    P(cr(344, 14, 40, 24, 7, "tr"), W2, gcol || K.head);
    lab(364, 30.5, gate, gcol === K.obj ? "rb" : "hb", "middle");
}
var ART = {};

// ---------- 01 постановка ----------
ART["stage-intake"] = function () {
    D.doc(400, 300);
    head("01", "ВХОД", "G1");
    // окно чата
    P(cr(16, 56, 176, 224, 12, "tr"), W1, K.l1);
    L([[16, 80], [192, 80]], W1, K.l2);
    lab(28, 72, "руководитель", "m");
    P(cr(28, 94, 152, 58, 8, "tl"), W1, K.l1);
    lab(38, 117, "Запускать ли тариф", "h");
    lab(38, 133, "для малого бизнеса?", "h");
    P(cr(56, 168, 124, 44, 8, "bl"), W1, K.l2, [3, 3]);
    lab(66, 188, "агент · уточнить:", "m");
    lab(66, 202, "2 вопроса", "m");
    P(cr(28, 244, 152, 24, 0, ""), W1, K.l2);
    F(cr(36, 250, 6, 12, 0, ""), K.head);
    // переход
    L([[192, 168], [226, 168]], W1, K.l1);
    arrow(232, 168, "r", 5, W1, K.l1);
    // рамка постановки
    P(cr(240, 56, 144, 224, 14, "tr"), W1, K.l1);
    L([[384 - 14, 56], [384, 70]], W2, K.ok);
    lab(252, 82, "решение", "m");
    lab(252, 100, "запуск тарифа", "h");
    L([[240, 118], [384, 118]], W1, K.l2);
    lab(252, 140, "получатель", "m");
    lab(252, 158, "совет директоров", "h");
    L([[240, 176], [384, 176]], W1, K.l2);
    lab(252, 198, "ограничения", "m");
    lab(252, 216, "бюджет", "h");
    lab(252, 232, "срок: квартал", "h");
    L([[252, 250], [372, 250]], W1, K.l2, [3, 3]);
    lab(252, 266, "ждёт «да» или правку", "m");
};

// ---------- 02 сбор ----------
ART["stage-collect"] = function () {
    D.doc(400, 300);
    head("02", "ИСТОЧНИКИ", "G2");
    // стопка: три страницы со смещением
    var offs = [[60, 88, "b91e07 · 09.11"], [48, 104, "5d2c4a · 12.11"], [36, 120, ""]];
    for (var i = 0; i < 3; i++) {
        var o = offs[i];
        P(cr(o[0], o[1], 96, 148, 14, "tr"), W1, K.l1, null, K.card);
        if (o[2]) lab(o[0] + 8, o[1] + 12, o[2], "m9");
    }
    // фронтальная страница: штамп и строки
    P(cr(46, 134, 76, 30, 0, ""), W2, K.ok);
    lab(54, 147, "17.11.26", "h9");
    lab(54, 158, "sha a3f9c1", "o");
    var ys = [182, 196, 210, 224, 238];
    var ws = [76, 62, 76, 48, 68];
    for (var j = 0; j < 5; j++) L([[46, ys[j]], [46 + ws[j], ys[j]]], W1, K.l2);
    // путь в карантин
    L([[162, 190], [208, 190]], W1, K.l1);
    arrow(214, 190, "r", 5, W1, K.l1);
    // карантин
    P(cr(224, 72, 160, 208, 0, ""), W2, K.obj, [4, 3]);
    lab(234, 90, "карантин", "r");
    P(cr(248, 108, 96, 148, 14, "tr"), W1, K.l1, null, K.card);
    var yq = [130, 144, 158, 172, 186];
    var wq = [76, 60, 76, 44, 68];
    for (var q = 0; q < 5; q++) L([[258, yq[q]], [258 + wq[q], yq[q]]], W1, K.l2);
    L([[258, 204], [334, 204]], W1, K.obj, [2, 2]);
    L([[248, 108], [344, 256]], W2, K.obj);
    L([[344, 108], [248, 256]], W2, K.obj);
    lab(304, 272, "скрытый текст", "r", "middle");
};

// ---------- 03 исследование ----------
ART["stage-research"] = function () {
    D.doc(400, 300);
    head("03", "УТВЕРЖДЕНИЯ", "");
    // страница источника
    P(cr(16, 56, 160, 224, 14, "tr"), W1, K.l1);
    lab(26, 72, "s04 · 17.11.26", "m9");
    var ys = [92, 106, 120, 134, 148, 162, 176, 190, 204, 218, 232, 246];
    var ws = [124, 108, 132, 96, 128, 112, 132, 88, 120, 130, 100, 116];
    for (var j = 0; j < ys.length; j++) {
        if (j === 5) continue;
        L([[28, ys[j]], [28 + ws[j], ys[j]]], W1, K.l2);
    }
    F(cr(24, 154, 144, 14, 0, ""), K.ok, 0.16);
    L([[28, 162], [28 + 128, 162]], 2, K.head);
    L([[24, 154], [24, 168]], W2, K.ok);
    // выноска
    L([[168, 161], [208, 161]], W1, K.ok);
    // карточка утверждения
    P(cr(208, 64, 176, 132, 18, "tr"), W1, K.l1, null, K.card);
    L([[384 - 18, 64], [384, 82]], W2, K.ok);
    P(cr(220, 76, 44, 16, 0, ""), W1, K.ok);
    lab(242, 88, "ФАКТ", "o", "middle");
    lab(220, 114, "«пакет включает доступ", "h");
    lab(220, 128, "к трём моделям»", "h");
    L([[220, 142], [372, 142]], W1, K.l2);
    lab(220, 160, "источник  s04", "m");
    lab(220, 174, "дата      17.11.26", "m");
    lab(220, 188, "sha256    a3f9c1", "m");
    // точки-утверждения
    L([[232, 196], [232, 226]], W1, K.ok);
    L([[232, 226], [352, 226]], W1, K.l2);
    var cx = [232, 292, 352], cc = [K.ok, K.hyp, K.obj], cl = ["c012 факт", "c013 допущение", "c014 возражение"];
    for (var k = 0; k < 3; k++) {
        dot(cx[k], 226, 5, cc[k]);
        lab(cx[k], 252, cl[k].split(" ")[0], "h9", "middle");
        lab(cx[k], 266, cl[k].split(" ")[1], "m9", "middle");
    }
};

// ---------- 04 варианты ----------
ART["stage-options"] = function () {
    D.doc(400, 300);
    head("04", "ВАРИАНТЫ", "G3");
    var cx = [62, 154, 246, 338], nm = ["оставить", "пилот", "запуск", "закрыть"];
    // линии к фактам
    for (var i = 0; i < 4; i++) {
        var x = cx[i];
        var col = i === 3 ? K.l2 : K.l1;
        L([[x, 108], [x - 14, 152]], W1, col);
        L([[x, 108], [x + 14, 152]], W1, i === 2 ? K.obj : col);
    }
    for (var i2 = 0; i2 < 4; i2++) {
        var x2 = cx[i2];
        var gray = i2 === 3;
        P(dia(x2, 84, 26), gray ? W1 : W2, gray ? K.l2 : K.l1, gray ? [3, 3] : null, K.card);
        lab(x2, 88, "O" + (i2 + 1), gray ? "m11" : "hb", "middle");
        dot(x2 - 14, 156, 4, gray ? K.l1 : K.ok);
        if (i2 === 2) {
            P(cr(x2 + 10, 152, 8, 8, 0, ""), W1, K.obj, null, K.obj);
        } else dot(x2 + 14, 156, 4, gray ? K.l1 : K.ok);
        // диапазон
        var by = 206;
        L([[x2 - 32, by], [x2 + 32, by]], W1, K.l2);
        var a = [-24, -10, -18, -4][i2], b = [10, 28, 22, 4][i2];
        L([[x2 + a, by], [x2 + b, by]], 4, gray ? K.l1 : K.head);
        L([[x2 + a, by - 5], [x2 + a, by + 5]], W1, gray ? K.l1 : K.head);
        L([[x2 + b, by - 5], [x2 + b, by + 5]], W1, gray ? K.l1 : K.head);
        lab(x2, 240, nm[i2], gray ? "m" : "h9", "middle");
    }
    lab(30, 226, "p10", "m9", "middle");
    lab(94, 226, "p90", "m9", "middle");
    lab(246, 266, "возражение", "r", "middle");
};

// ---------- 05 стратегия ----------
ART["stage-strategy"] = function () {
    D.doc(400, 300);
    head("05", "ЗАПИСКА", "G4");
    P(cr(16, 56, 200, 224, 16, "tr"), W1, K.l1);
    lab(28, 82, "Что делать в понедельник", "hb");
    L([[28, 94], [204, 94]], W1, K.l2);
    var rows = [["1  назначить ответственного", "[c012]", K.ok], ["2  запустить пилот", "[c031]", K.ok], ["3  собрать данные недели", "[h009]", K.hyp], ["4  стоп по порогу", "[c044]", K.ok]];
    for (var i = 0; i < 4; i++) {
        var y = 120 + i * 30;
        lab(28, y, rows[i][0], "h9");
        lab(204, y + 12, rows[i][1], rows[i][2] === K.ok ? "o" : "y", "end");
        L([[28, y + 18], [204, y + 18]], W1, K.l2);
    }
    L([[28, 258], [120, 258]], W2, K.ok);
    lab(28, 272, "каждая строка — на утверждение", "m9");
    // порог-шкала
    P(cr(280, 64, 28, 192, 0, ""), W1, K.l1);
    hatch(cr(280, 192, 28, 64, 0, ""), 6, W1, K.obj, 0.7, 280, 192, 308, 256);
    L([[216, 192], [384, 192]], W2, K.head);
    lab(318, 188, "порог", "h9");
    lab(318, 212, "стоп", "r");
    lab(318, 100, "дальше", "m9");
    F([[268, 132], [280, 138], [268, 144]], K.ok);
    L([[308, 138], [384, 138]], W1, K.l2, [3, 3]);
};

// ---------- R пересмотр ----------
ART["stage-review"] = function () {
    D.doc(400, 300);
    head("R", "ПЕРЕСМОТР", "R", K.obj);
    var rowsY = [248, 204, 160, 116, 72];
    var names = ["источники", "факты", "допущения", "варианты", "вывод"];
    for (var r = 0; r < 5; r++) {
        L([[84, rowsY[r]], [384, rowsY[r]]], W1, K.l2, [2, 4]);
        lab(16, rowsY[r] + 3, names[r], "m9");
    }
    var N = {
        s1: [108, 248], s2: [180, 248], s3: [252, 248], s4: [336, 248],
        f1: [132, 204], f2: [208, 204], f3: [288, 204], f4: [356, 204],
        a1: [156, 160], a2: [248, 160], a3: [320, 160],
        o1: [190, 116], o2: [284, 116],
        d: [236, 72]
    };
    var E = [["s1", "f1"], ["s2", "f1"], ["s2", "f2"], ["s3", "f2"], ["s3", "f3"], ["s4", "f4"], ["f1", "a1"], ["f2", "a1"], ["f2", "a2"], ["f3", "a2"], ["f4", "a3"], ["f3", "a3"], ["a1", "o1"], ["a2", "o1"], ["a2", "o2"], ["a3", "o2"], ["o1", "d"], ["o2", "d"]];
    var hot = { s3: 1, f2: 1, f3: 1, a2: 1, o1: 1, o2: 1, d: 1 };
    var i;
    for (i = 0; i < E.length; i++) {
        var a = N[E[i][0]], b = N[E[i][1]];
        if (!(hot[E[i][0]] && hot[E[i][1]])) L([a, b], W1, K.l2);
    }
    for (i = 0; i < E.length; i++) {
        var a2 = N[E[i][0]], b2 = N[E[i][1]];
        if (hot[E[i][0]] && hot[E[i][1]]) L([a2, b2], W2, K.obj);
    }
    for (var id in N) {
        var p = N[id], h = !!hot[id], t = id.charAt(0);
        var col = h ? K.obj : K.l1;
        if (t === "s") P(cr(p[0] - 7, p[1] - 7, 14, 14, 0, ""), h ? W2 : W1, col, null, K.card);
        else if (t === "f") ring(p[0], p[1], 6, h ? W2 : W1, h ? K.obj : K.ok);
        else if (t === "a") ring(p[0], p[1], 6, h ? W2 : W1, h ? K.obj : K.hyp, [2.5, 2]);
        else if (t === "o") P(dia(p[0], p[1], 10), h ? W2 : W1, col, null, K.card);
        else P(cr(p[0] - 14, p[1] - 12, 28, 24, 7, "tr"), W2, K.obj, null, K.card);
    }
    F(cr(246, 242, 12, 12, 0, ""), K.obj);
    lab(252, 276, "новые данные", "r", "middle");
};

function exportSVG(dir, name) {
    var o = new ExportOptionsSVG();
    o.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
    o.coordinatePrecision = 2;
    o.documentEncoding = SVGDocumentEncoding.UTF8;
    o.fontSubsetting = SVGFontSubsetting.None;
    D.d.exportFile(new File(dir + "/" + name + ".svg"), ExportType.SVG, o);
}
function writeLabels(dir, name) {
    var f = new File(dir + "/" + name + ".labels.txt");
    f.encoding = "UTF-8"; f.open("w"); f.write(LAB.join("\n")); f.close();
}
var out = AX.args.out, only = AX.args.only ? "," + AX.args.only + "," : "", done = [];
(new Folder(out)).create();
for (var k in ART) {
    if (only && only.indexOf("," + k.replace("stage-", "") + ",") < 0) continue;
    LAB = [];
    ART[k]();
    exportSVG(out, k);
    writeLabels(out, k);
    var ai = new IllustratorSaveOptions(); ai.compatibility = Compatibility.ILLUSTRATOR24;
    D.d.saveAs(new File(out + "/" + k + ".ai"), ai);
    D.d.close(SaveOptions.DONOTSAVECHANGES);
    done.push(k);
}
done.join(" ");
