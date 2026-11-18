// Ролик «Основание»: путь одного числа от источника до решения. After Effects 2027.
var ROOT = "/Users/z1nex/mgimo_hackaton/osnovanie-site/design/film/";
var W = 1920, H = 1080, FPS = 30, DUR = 20;
function hex(h) { return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255]; }
var BG = hex("#07100C"), BG2 = hex("#0C1812"), L1 = hex("#23362C"), L2 = hex("#34503F"),
    TX = hex("#D8E3DC"), HD = hex("#EEF4F0"), MU = hex("#8AA094"), FACT = hex("#0CDC78"), ASM = hex("#FFA717");
var REP = "Reper-Regular", MONO = "PTMono-Regular";
var CUT = 22;
var SC = [0.2, 2.8, 5.2, 8.6, 12.2, 16.4];
var SCN = ["ВОПРОС", "ИСТОЧНИК", "УТВЕРЖДЕНИЕ", "ДОПУЩЕНИЕ", "ВАРИАНТЫ", "РЕШЕНИЕ"];
var HELP = "function E(t0,d){var a=Math.min(Math.max((time-t0)/d,0),1);return a>=1?1:1-Math.pow(2,-10*a);}" +
           "function X(t0,d){var a=Math.min(Math.max((time-t0)/d,0),1);return a*a*a;}" +
           "var SC=[" + SC.join(",") + "];var cur=0;for(var k=0;k<SC.length;k++){if(time>=SC[k]-0.05)cur=k;}";

function LOG(x){var f=new File(ROOT+"log.txt");f.open("a");f.writeln(x);f.close();}
function main() {
    var proj = app.project;
    if (proj.numItems > 0) { return "ERR: проект не пуст"; }
    var comp = proj.items.addComp("film", W, H, 1, DUR, FPS);
    comp.bgColor = BG;

    function T(name, str, font, size, color, x, y, just, track, lead) {
        LOG("T "+name);var l = comp.layers.addText(str); l.name = name;
        var tp = l.property("Source Text"); var d = tp.value;
        d.resetCharStyle(); d.font = font; d.fontSize = size; d.fillColor = color;
        d.applyFill = true; d.applyStroke = false;
        d.justification = just == "c" ? ParagraphJustification.CENTER_JUSTIFY : (just == "r" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.LEFT_JUSTIFY);
        d.tracking = track || 0;
        if (lead) { d.autoLeading = false; d.leading = lead; }
        tp.setValue(d);
        l.property("Transform").property("Position").setValue([x, y]);
        return l;
    }
    function S(name, pts, closed, fill, fillOp, stroke, sw, x, y) {
        LOG("S "+name);var l = comp.layers.addShape(); l.name = name;
        var g = l.property("Contents").addProperty("ADBE Vector Group");
        var gc = g.property("Contents");
        var p = gc.addProperty("ADBE Vector Shape - Group");
        var s = new Shape(); s.vertices = pts; s.closed = closed;
        p.property("ADBE Vector Shape").setValue(s);
        if (fill) {
            var f = gc.addProperty("ADBE Vector Graphic - Fill");
            f.property("ADBE Vector Fill Color").setValue([fill[0], fill[1], fill[2], 1]);
            f.property("ADBE Vector Fill Opacity").setValue(fillOp);
        }
        if (stroke) {
            var st = gc.addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue([stroke[0], stroke[1], stroke[2], 1]);
            st.property("ADBE Vector Stroke Width").setValue(sw);
            st.property("ADBE Vector Stroke Line Join").setValue(1);
        }
        l.property("Transform").property("Position").setValue([x || 0, y || 0]);
        return l;
    }
    function trim(l, expr) {
        var gc = l.property("Contents").property(1).property("Contents");
        var t = gc.addProperty("ADBE Vector Filter - Trim");
        t.property("ADBE Vector Trim End").expression = HELP + expr;
    }
    function CTRL(name, x, y, tin, din, tout, dout, o) {
        o = o || {};
        LOG("N "+name);var n = comp.layers.addNull(); n.name = name;
        var rise = o.rise === undefined ? 26 : o.rise;
        var fall = o.fall === undefined ? 18 : o.fall;
        n.property("Transform").property("Position").expression = o.pos ? HELP + o.pos :
            HELP + "[" + x + "," + y + "+" + rise + "*(1-E(" + tin + "," + din + "))-" + fall + "*X(" + tout + "," + dout + ")]";
        n.property("Transform").property("Opacity").expression = HELP + "100*E(" + tin + "," + din + ")*(1-X(" + tout + "," + dout + "))*(" + (o.op || "1") + ")";
        return n;
    }
    function kid(l, ctl, extra) {
        l.parent = ctl;
        l.property("Transform").property("Opacity").expression = HELP + "thisComp.layer(\"" + ctl.name + "\").transform.opacity*(" + (extra || "1") + ")";
        return l;
    }
    function BAR(name, ctl, x, y, w, h, col, op, t0, d) {
        var l = S(name, [[0, 0], [w, 0], [w, h], [0, h]], true, col, op, null, 0, x, y);
        kid(l, ctl);
        l.property("Transform").property("Scale").expression = HELP + "[100*E(" + t0 + "," + d + "),100]";
        return l;
    }
    function typed(l, s, t0, cps, cursor) {
        var q = s.replace(/\r/g, "\\r");
        l.property("Source Text").expression = "var s=\"" + q + "\";var n=Math.floor(Math.min(Math.max((time-" + t0 + ")*" + cps + ",0),s.length));" +
            (cursor ? "var c=(n<s.length||Math.floor(time*2.4)%2==0)?\"_\":\"\\u2002\";s.substr(0,n)+c" : "s.substr(0,n)");
    }
    function CARD(id, x, y, w, h, accent, tag, body, size, lh, tin, tout, o) {
        o = o || {};
        var ctl = CTRL("ctl_" + id, x, y, tin, 0.7, tout, 0.5, o);
        var pts = [[0, 0], [w - CUT, 0], [w, CUT], [w, h], [0, h]];
        var bg = S(id + "_bg", pts, true, BG2, 100, null, 0, 0, 0); kid(bg, ctl);
        var ol = S(id + "_ol", pts, true, null, 0, L2, 1.5, 0, 0); kid(ol, ctl);
        trim(ol, "100*E(" + tin + ",0.9)");
        var ac = S(id + "_ac", [[0, 0], [72, 0]], false, null, 0, accent, 3, 0, 0); kid(ac, ctl, "E(" + (tin + 0.25) + ",0.4)");
        var tg = T(id + "_tag", tag, MONO, 22, accent, 36, 62, "l", 60); kid(tg, ctl, "E(" + (tin + 0.2) + ",0.5)");
        var bd = T(id + "_body", body, REP, size, HD, 36, 132, "l", 0, lh); kid(bd, ctl, "E(" + (tin + 0.3) + ",0.6)");
        return ctl;
    }

    // фон и постоянная рамка
    var bgl = comp.layers.addSolid(BG, "bg", W, H, 1); bgl.property("Transform").property("Opacity").setValue(100);
    var hl = S("hairline", [[120, 124], [1800, 124]], false, null, 0, L1, 1.5, 0, 0);
    trim(hl, "100*E(0,1.2)");
    var hdr = T("hdr", "01 / 06 · ВОПРОС", MONO, 20, MU, 120, 96, "l", 80);
    hdr.property("Source Text").expression = "var SC=[" + SC.join(",") + "];var N=" + JSON_ARR(SCN) + ";var i=0;for(var k=0;k<SC.length;k++){if(time>=SC[k]-0.05)i=k;}\"0\"+(i+1)+\" / 06 · \"+N[i]";
    hdr.property("Transform").property("Opacity").expression = HELP + "var t=SC[cur];(100*E(t,0.4)*(1-X(16.0,0.4)))";
    var brand = T("brand", "Основание", REP, 30, HD, 1800, 98, "r", 0);
    brand.property("Transform").property("Opacity").expression = HELP + "100*E(0.2,0.8)*(1-X(16.0,0.4))";

    // рельса сцен
    var RY = 992, rx = [];
    for (var i = 0; i < 6; i++) rx.push(120 + i * 336);
    var rl = S("rail", [[120, RY], [1800, RY]], false, null, 0, L1, 1.5, 0, 0);
    rl.property("Transform").property("Opacity").expression = HELP + "100*E(0.2,0.8)*(1-X(16.0,0.4))";
    var rp = S("rail_fill", [[120, RY], [1800, RY]], false, null, 0, FACT, 1.5, 0, 0);
    trim(rp, "var p0=Math.max(cur-1,0)/5;var p1=cur/5;100*(p0+(p1-p0)*E(SC[cur],0.8))");
    rp.property("Transform").property("Opacity").expression = HELP + "100*E(0.2,0.8)*(1-X(16.0,0.4))";
    for (var k = 0; k < 6; k++) {
        var nd = S("node" + k, [[-6, -6], [6, -6], [6, 6], [-6, 6]], true, L1, 100, null, 0, rx[k], RY);
        nd.property("Contents").property(1).property("Contents").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").expression =
            HELP + "var k=" + k + ";cur==k?[0.047,0.863,0.471,1]:(cur>k?[0.541,0.627,0.580,1]:[0.137,0.212,0.173,1])";
        nd.property("Transform").property("Opacity").expression = HELP + "100*E(0.2,0.8)*(1-X(16.0,0.4))";
        var lb = T("lbl_d" + k, SCN[k], MONO, 15, MU, rx[k], RY + 38, "c", 60);
        lb.property("Transform").property("Opacity").expression = HELP + "var k=" + k + ";(cur==k?0:70)*E(0.2,0.8)*(1-X(16.0,0.4))";
        var lbb = T("lbl_b" + k, SCN[k], MONO, 15, HD, rx[k], RY + 38, "c", 60);
        lbb.property("Transform").property("Opacity").expression = HELP + "var k=" + k + ";(cur==k?100:0)*E(SC[k],0.4)*(1-X(16.0,0.4))";
    }

    // 1. вопрос
    var c1 = CTRL("ctl_q", 0, 0, 0.3, 0.6, 2.6, 0.4, { pos: "[0,0-22*X(2.6,0.4)]" });
    var q1 = T("q_tag", "ЗАПРОС РУКОВОДИТЕЛЯ", MONO, 22, MU, 240, 410, "l", 80); kid(q1, c1, "E(0.3,0.6)");
    var qb = S("q_bar", [[0, 0], [0, 170]], false, null, 0, L2, 3, 180, 440); kid(qb, c1);
    trim(qb, "100*E(0.35,0.9)");
    var qt = T("q_text", "Кому и как продавать МегаНейросети\rи продолжать ли направление?", MONO, 60, HD, 240, 500, "l", 0, 90);
    typed(qt, "Кому и как продавать МегаНейросети\rи продолжать ли направление?", 0.6, 40, true); kid(qt, c1);

    // 2. снимок источника
    var SX = 120, SY = 280, SW = 760, SH = 520;
    var posS = "var m=E(5.2,0.8);[580+(" + SX + "-580)*m," + SY + "+26*(1-E(2.8,0.7))-18*X(8.6,0.5)]";
    var cs = CARD("src", SX, SY, SW, SH, MU, "", "", 20, 30, 2.8, 8.6, { pos: posS });
    // у карточки источника своё содержимое: убираем тег и тело
    comp.layer("src_tag").remove(); comp.layer("src_body").remove();
    var cap = T("src_cap", "s002 · moscow.megafon.ru · 14.11.2026", MONO, 22, TX, 36, 62, "l", 0); kid(cap, cs);
    typed(cap, "s002 · moscow.megafon.ru · 14.11.2026", 3.35, 46, false);
    var sh = T("src_sha", "sha256 5da1af1747…", MONO, 18, MU, 36, 104, "l", 0); kid(sh, cs);
    sh.property("Source Text").expression =
        "var t0=3.75,dur=1.5,L0=44;var fin=\"5da1af1747\";var hx=\"0123456789abcdef\";var p=Math.min(Math.max((time-t0)/dur,0),1);var out=\"\";" +
        "if(time>=t0){var L=p<0.6?L0:Math.round(L0-(L0-10)*Math.min(1,(p-0.6)/0.4));var k=Math.min(10,Math.floor(p/0.6*10));" +
        "for(var i=0;i<L;i++){if(i<k){out+=fin.charAt(i);}else{seedRandom(i*13+Math.floor(time*30),true);out+=hx.charAt(Math.floor(random()*16));}}" +
        "out=\"sha256 \"+out+(p>=1?\"…\":\"\");}out";
    var dv = S("src_div", [[36, 138], [724, 138]], false, null, 0, L1, 1.5, 0, 0); kid(dv, cs);
    trim(dv, "100*E(3.5,0.8)");
    BAR("src_b1", cs, 36, 176, 640, 8, L1, 100, 3.8, 0.7);
    BAR("src_b2", cs, 36, 206, 560, 8, L1, 100, 3.9, 0.7);
    BAR("src_b3", cs, 36, 446, 600, 8, L1, 100, 4.0, 0.7);
    BAR("src_b4", cs, 36, 476, 420, 8, L1, 100, 4.1, 0.7);
    var QL = "Про 10 моделей нейросети для работы\rс текстом и изображениями.\rДо 50 запросов в сутки";
    // подсветка за текстом
    var hi = S("src_hi", [[0, 0], [704, 0], [704, 168], [0, 168]], true, FACT, 14, null, 0, 28, 238); kid(hi, cs);
    hi.property("Transform").property("Scale").expression = HELP + "[100*E(6.0,0.7),100]";
    var hb = S("src_hibar", [[0, 0], [0, 168]], false, null, 0, FACT, 3, 28, 238); kid(hb, cs, "E(6.0,0.3)");
    var q0 = T("src_quote", QL, REP, 34, MU, 48, 290, "l", 0, 46); kid(q0, cs);
    var q1b = T("src_quote_hi", QL, REP, 34, HD, 48, 290, "l", 0, 46); kid(q1b, cs, "E(6.1,0.6)");

    // связь цитаты с утверждением
    var LY = SY + 322;
    var cl = CTRL("ctl_link", 0, 0, 6.5, 0.4, 8.6, 0.4, { rise: 0, fall: 0 });
    var ln = S("link", [[0, 0], [212, 0]], false, null, 0, FACT, 1.5, SX + 732, LY); kid(ln, cl, "1");
    trim(ln, "100*E(6.5,0.7)");
    var d0 = S("link_dot", [[-5, -5], [5, -5], [5, 5], [-5, 5]], true, FACT, 100, null, 0, SX + 732, LY); kid(d0, cl, "E(6.5,0.3)");
    var d1 = S("link_dot2", [[-5, -5], [5, -5], [5, 5], [-5, 5]], true, FACT, 100, null, 0, SX + 944, LY); kid(d1, cl, "E(7.1,0.3)");

    // 3. утверждение
    var CW = 740, CH = 300;
    var posC = "var a=[1064," + (LY - 150) + "],b=[120,300];var m=E(8.6,0.8);[a[0]+(b[0]-a[0])*m,a[1]+(b[1]-a[1])*m+26*(1-E(6.8,0.6))-18*X(12.0,0.4)]";
    var cc = CARD("clm", 1064, LY - 150, CW, CH, FACT, "c002 · ФАКТ", "Тариф «Про»: 10 моделей,\rдо 50 запросов в сутки,\r299 ₽ в месяц", 40, 56, 6.8, 12.0, { pos: posC });
    var st = CTRL("ctl_stamp", 0, 0, 7.7, 0.2, 99, 0.1, { pos: "[620,238]" });
    st.property("Transform").property("Opacity").expression = HELP + "thisComp.layer(\"ctl_clm\").transform.opacity*E(7.7,0.18)";
    st.property("Transform").property("Rotation").setValue(-4);
    st.property("Transform").property("Scale").expression = HELP + "var s=100*(1+0.4*(1-E(7.7,0.4)));[s,s]";
    st.parent = cc;
    var sb = S("stamp_box", [[-92, -26], [78, -26], [92, -12], [92, 26], [-92, 26]], true, null, 0, FACT, 1.5, 0, 0); kid(sb, st);
    var sbi = S("stamp_box2", [[-86, -20], [74, -20], [86, -8], [86, 20], [-86, 20]], true, null, 0, FACT, 1, 0, 0); kid(sbi, st);
    var stt = T("stamp_txt", "ПРОВЕРЕНО", MONO, 22, FACT, 0, 8, "c", 60); kid(stt, st);

    // 4. допущение
    var ca = CARD("asm", 1064, 300, CW, CH, ASM, "c028 · ДОПУЩЕНИЕ", "к «Лайт» подключилось\r20 000 абонентов", 40, 56, 9.2, 12.0, {});
    var X0 = 1064, X1 = 1804, TY = 770;
    var cr = CTRL("ctl_scale", 0, 0, 9.9, 0.6, 12.0, 0.4, { rise: 0, fall: 0 });
    var sct = T("sc_cap", "ДИАПАЗОН ДОПУЩЕНИЯ", MONO, 18, MU, X0, TY - 52, "l", 80); kid(sct, cr);
    var trk = S("sc_track", [[0, 0], [X1 - X0, 0], [X1 - X0, 16], [0, 16]], true, ASM, 16, ASM, 1.5, X0, TY - 8); kid(trk, cr);
    trim(trk, "100*E(9.9,1.0)");
    var tkA = S("sc_tkA", [[0, -14], [0, 30]], false, null, 0, ASM, 2, X0, TY); kid(tkA, cr);
    var tkB = S("sc_tkB", [[0, -14], [0, 30]], false, null, 0, ASM, 2, X1, TY); kid(tkB, cr);
    var tkP = S("sc_tkP", [[0, 6], [0, 30]], false, null, 0, MU, 1.5, X0 + (X1 - X0) * (15000 / 55000), TY); kid(tkP, cr, "E(10.4,0.4)");
    var la = T("sc_la", "5 000", MONO, 24, MU, X0, TY + 64, "l", 0); kid(la, cr);
    var lb2 = T("sc_lb", "60 000", MONO, 24, MU, X1, TY + 64, "r", 0); kid(lb2, cr);
    var lp = T("sc_lp", "20 000", MONO, 18, MU, X0 + (X1 - X0) * (15000 / 55000), TY + 52, "c", 0); kid(lp, cr, "E(10.4,0.4)");
    var run = S("sc_run", [[0, -26], [10, 0], [0, 26], [-10, 0]], true, ASM, 100, null, 0, X0, TY);
    run.property("Transform").property("Position").expression = HELP +
        "var f0=15000/55000;var f=f0+(0.5-f0)*E(10.3,0.6)+0.4*Math.sin((time-10.3)*2.0)*E(10.5,0.8);f=Math.min(Math.max(f,0.03),0.97);[" + X0 + "+" + (X1 - X0) + "*f," + TY + "]";
    run.property("Transform").property("Opacity").expression = HELP + "thisComp.layer(\"ctl_scale\").transform.opacity*E(10.3,0.3)";
    var rv = T("sc_val", "20 000", MONO, 26, HD, X0, TY - 52, "c", 0);
    rv.property("Transform").property("Position").expression = "[thisComp.layer(\"sc_run\").transform.position[0]," + (TY - 44) + "]";
    rv.property("Transform").property("Opacity").expression = HELP + "thisComp.layer(\"ctl_scale\").transform.opacity*E(10.3,0.3)";
    rv.property("Source Text").expression = "var f=(thisComp.layer(\"sc_run\").transform.position[0]-" + X0 + ")/" + (X1 - X0) + ";var v=Math.round((5000+f*55000)/100)*100;var s=String(v);s.substr(0,s.length-3)+\" \"+s.substr(s.length-3)";

    // 5. варианты
    var OX = [330, 750, 1170, 1590], OW = ["оставить", "малый бизнес", "с тарифом", "закрыть"], OY = 430;
    var SP = [[0.22, 0.70], [0.35, 0.92], [0.40, 0.78], [0.12, 0.50]];
    for (var i = 0; i < 4; i++) {
        var ti = 12.5 + i * 0.14;
        var dim = i == 2 ? "1" : (i == 0 ? "(1-0.55*E(13.7,0.5)*(1-E(15.3,0.5)))" : "(1-0.55*E(13.7,0.5))");
        var co = CTRL("ctl_o" + (i + 1), OX[i], 0, ti, 0.7, 16.0, 0.4, { op: dim, pos: "[" + OX[i] + ",26*(1-E(" + ti + ",0.7))-18*X(16.0,0.4)]" });
        var dm = S("o" + (i + 1) + "_d", [[0, -76], [76, 0], [0, 76], [-76, 0]], true, BG2, 100, L2, 1.5, 0, OY); kid(dm, co);
        var ds = S("o" + (i + 1) + "_dsel", [[0, -76], [76, 0], [0, 76], [-76, 0]], true, FACT, 16, FACT, 1.5, 0, OY);
        kid(ds, co, i == 2 ? "E(13.7,0.5)" : (i == 0 ? "E(15.3,0.5)*0.6" : "0"));
        var ol2 = S("o" + (i + 1) + "_dol", [[0, -76], [76, 0], [0, 76], [-76, 0]], true, null, 0, MU, 1.5, 0, OY); kid(ol2, co, "(1-E(13.7,0.01))");
        var on = T("o" + (i + 1) + "_n", "O" + (i + 1), MONO, 34, HD, 0, OY + 12, "c", 0); kid(on, co);
        var ow = T("o" + (i + 1) + "_w", OW[i], REP, 38, HD, 0, 590, "c", 0); kid(ow, co);
        var tr = S("o" + (i + 1) + "_tr", [[-150, 0], [150, 0]], false, null, 0, L2, 1.5, 0, 668); kid(tr, co);
        var a0 = -150 + 300 * SP[i][0], a1 = -150 + 300 * SP[i][1];
        var sg = S("o" + (i + 1) + "_sg", [[0, -7], [a1 - a0, -7], [a1 - a0, 7], [0, 7]], true, MU, 100, null, 0, a0, 668); kid(sg, co);
        sg.property("Transform").property("Scale").expression = HELP + "[100*E(" + (ti + 0.5) + ",0.7),100]";
        var sgs = S("o" + (i + 1) + "_sgs", [[0, -7], [a1 - a0, -7], [a1 - a0, 7], [0, 7]], true, FACT, 100, null, 0, a0, 668);
        kid(sgs, co, i == 2 ? "E(13.8,0.5)" : "0");
        var sl = T("o" + (i + 1) + "_sl", "разброс", MONO, 17, MU, -150, 712, "l", 40); kid(sl, co, "E(" + (ti + 0.6) + ",0.5)");
    }
    // плашка ожидания
    var cg = CTRL("ctl_g3", 120, 790, 14.1, 0.6, 16.0, 0.4, { op: "(1-0.5*E(15.0,0.5))" });
    var gp = [[0, 0], [600 - 14, 0], [600, 14], [600, 84], [0, 84]];
    var gb = S("g3_bg", gp, true, ASM, 12, null, 0, 0, 0); kid(gb, cg);
    var go = S("g3_ol", gp, true, null, 0, ASM, 1.5, 0, 0); kid(go, cg); trim(go, "100*E(14.1,0.8)");
    var gt = T("g3_t", "G3 · ждёт решения человека", MONO, 28, ASM, 32, 53, "l", 0); kid(gt, cg, "E(14.3,0.5)");
    // сообщение человека
    var MW = 320;
    var cm = CTRL("ctl_msg", 0, 0, 15.0, 0.5, 16.0, 0.4, { pos: "[1800-" + MW + "+40*(1-E(15.0,0.6))-18*X(16.0,0.4),790]" });
    var mp = [[0, 0], [MW, 0], [MW, 70], [MW - 16, 84], [0, 84]];
    var mb = S("msg_bg", mp, true, FACT, 100, null, 0, 0, 0); kid(mb, cm);
    var mt = T("msg_t", "G3 да O1 O3", MONO, 32, BG, 32, 55, "l", 0); kid(mt, cm);
    typed(mt, "G3 да O1 O3", 15.3, 26, false);

    // 6. финал
    var cf = CTRL("ctl_fin", 0, 0, 16.5, 0.8, 999, 0.4, { rise: 0, fall: 0 });
    var fr = S("fin_rule", [[0, 0], [96, 0]], false, null, 0, FACT, 3, 912, 372); kid(fr, cf); trim(fr, "100*E(16.5,0.7)");
    var f1 = T("fin_1", "Решение держится на утверждениях,", REP, 92, HD, 960, 480, "c", 0);
    var f2 = T("fin_2", "а не на словах.", REP, 92, HD, 960, 590, "c", 0);
    kid(f1, cf, "E(16.7,0.7)"); kid(f2, cf, "E(16.9,0.7)");
    f1.property("Transform").property("Position").expression = HELP + "[960,480+34*(1-E(16.7,0.8))]";
    f2.property("Transform").property("Position").expression = HELP + "[960,590+34*(1-E(16.9,0.8))]";
    var lk = proj.importFile(new ImportOptions(new File(ROOT + "lockup.png")));
    var lkl = comp.layers.add(lk); lkl.name = "lockup";
    var ls = 640 / 2400 * 100;
    lkl.property("Transform").property("Scale").setValue([ls, ls]);
    lkl.property("Transform").property("Position").expression = HELP + "[960,800+30*(1-E(17.7,0.9))]";
    lkl.property("Transform").property("Opacity").expression = HELP + "100*E(17.7,0.8)";

    comp.openInViewer();
    proj.save(new File(ROOT + "film.aep"));
    return "ok layers=" + comp.numLayers;
}
function JSON_ARR(a) { var o = []; for (var i = 0; i < a.length; i++) o.push("\"" + a[i] + "\""); return "[" + o.join(",") + "]"; }
app.beginUndoGroup("film");
var __res;
try { __res = main(); } catch (e) { __res = "ERR line " + e.line + ": " + e.toString(); }
app.endUndoGroup();
__res;
