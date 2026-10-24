/* ============================================================
   FIN 4060 — Inline SVG figure library
   Renders conceptual diagrams into <div class="fig" data-fig="NAME">
   Figures are drawn as vector SVG: crisp, tiny, offline-safe.
   Layout contract: viewBox 0 0 680 H. Keep text boxes disjoint.
   ============================================================ */
(function () {
  "use strict";

  var C = {
    navy: "#0f2b52", blue: "#1d4ed8", blueSoft: "#eaf1ff", blueLine: "#c7d9ff",
    amber: "#b45309", amberSoft: "#fff7ed", amberLine: "#fed7aa",
    green: "#047857", greenSoft: "#ecfdf5", greenLine: "#a7f3d0",
    purple: "#6d28d9", purpleSoft: "#f5f3ff", purpleLine: "#ddd6fe",
    red: "#b91c1c", redSoft: "#fef2f2", redLine: "#fecaca",
    gray: "#94a3b8", graySoft: "#f8fafc",
    ink: "#1b2430", muted: "#6b7787", axis: "#94a3b8", grid: "#e8edf4"
  };
  var FONT = "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function n(v) { return Math.round(v * 10) / 10; }

  function txt(x, y, s, o) {
    o = o || {};
    return "<text x='" + n(x) + "' y='" + n(y) + "' text-anchor='" + (o.anchor || "middle") +
      "' font-family=\"" + FONT + "\" font-size='" + (o.size || 12) +
      "' fill='" + (o.fill || C.ink) + "' font-weight='" + (o.weight || 400) + "'" +
      (o.italic ? " font-style='italic'" : "") + ">" + esc(s) + "</text>";
  }
  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return "<line x1='" + n(x1) + "' y1='" + n(y1) + "' x2='" + n(x2) + "' y2='" + n(y2) +
      "' stroke='" + (o.stroke || C.axis) + "' stroke-width='" + (o.w || 1.5) + "'" +
      (o.dash ? " stroke-dasharray='" + o.dash + "'" : "") +
      (o.cap ? " stroke-linecap='round'" : "") + "/>";
  }
  function path(d, o) {
    o = o || {};
    return "<path d='" + d + "' fill='" + (o.fill || "none") + "' stroke='" + (o.stroke || C.blue) +
      "' stroke-width='" + (o.w || 2) + "'" + (o.dash ? " stroke-dasharray='" + o.dash + "'" : "") +
      (o.opacity ? " opacity='" + o.opacity + "'" : "") + " stroke-linejoin='round'/>";
  }
  function dot(x, y, r, o) {
    o = o || {};
    return "<circle cx='" + n(x) + "' cy='" + n(y) + "' r='" + (r || 4.5) + "' fill='" + (o.fill || C.blue) +
      "'" + (o.stroke ? " stroke='" + o.stroke + "' stroke-width='2'" : "") + "/>";
  }
  function rect(x, y, w, h, o) {
    o = o || {};
    return "<rect x='" + n(x) + "' y='" + n(y) + "' width='" + n(w) + "' height='" + n(h) +
      "' rx='" + (o.rx || 5) + "' fill='" + (o.fill || C.blueSoft) + "' stroke='" + (o.stroke || C.blueLine) +
      "' stroke-width='" + (o.sw || 1) + "'" + (o.opacity ? " opacity='" + o.opacity + "'" : "") + "/>";
  }
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var col = o.stroke || C.blue, w = o.w || 2;
    var ang = Math.atan2(y2 - y1, x2 - x1), hs = o.head || 7;
    var ax = x2 - hs * Math.cos(ang - 0.42), ay = y2 - hs * Math.sin(ang - 0.42);
    var bx = x2 - hs * Math.cos(ang + 0.42), by = y2 - hs * Math.sin(ang + 0.42);
    return line(x1, y1, x2, y2, { stroke: col, w: w, dash: o.dash }) +
      "<path d='M" + n(x2) + "," + n(y2) + " L" + n(ax) + "," + n(ay) + " L" + n(bx) + "," + n(by) +
      " Z' fill='" + col + "'/>";
  }
  function biArrow(x1, y1, x2, y2, o) {
    o = o || {};
    return arrow(x1, y1, x2, y2, o) + arrow(x2, y2, x1, y1, o);
  }

  function textW(s, size) {
    var w = 0, i, c;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      w += (c > 0x2E7F) ? size : size * 0.56;
    }
    return w;
  }
  /* shrink font until the string fits the given width */
  function fitSize(s, maxW, start) {
    var sz = start || 12;
    while (textW(s, sz) > maxW && sz > 8) sz -= 0.5;
    return sz;
  }

  /* ---- axis frame ----
     Bottom band layout (never overlap):
       B ... axis        B+16 ... tick labels
       B+37 ... axis title   B+59 ... (free: per-figure caption)  */
  function frame(o) {
    var H = o.h || 300, L = 74, R = 644, T = 34, B = H - 66;
    var sx = function (v) { return L + (v - o.xMin) / (o.xMax - o.xMin) * (R - L); };
    var sy = function (v) { return B - (v - o.yMin) / (o.yMax - o.yMin) * (B - T); };
    var s = "";
    (o.yTicks || []).forEach(function (t) {
      var y = sy(t.v);
      s += line(L, y, R, y, { stroke: C.grid, w: 1 });
      s += txt(L - 8, y + 4, t.l, { anchor: "end", size: 10.5, fill: C.muted });
    });
    (o.xTicks || []).forEach(function (t) {
      var x = sx(t.v);
      s += line(x, T, x, B, { stroke: C.grid, w: 1 });
      s += txt(x, B + 16, t.l, { size: 10.5, fill: C.muted });
    });
    s += line(L, T, L, B, { stroke: C.axis, w: 1.6 });
    s += line(L, B, R, B, { stroke: C.axis, w: 1.6 });
    s += txt((L + R) / 2, B + 37, o.xLabel || "", { size: 12, weight: 600, fill: C.navy });
    s += "<text x='16' y='" + n((T + B) / 2) + "' text-anchor='middle' font-family=\"" + FONT +
      "\" font-size='12' fill='" + C.navy + "' font-weight='600' transform='rotate(-90 16 " +
      n((T + B) / 2) + ")'>" + esc(o.yLabel || "") + "</text>";
    return { svg: s, sx: sx, sy: sy, L: L, R: R, T: T, B: B, H: H, capY: B + 59 };
  }

  function wrap(H, inner) {
    return "<svg viewBox='0 0 680 " + H + "' width='100%' role='img' style='display:block;max-width:680px;margin:0 auto'>" +
      "<rect x='0' y='0' width='680' height='" + H + "' fill='#fbfcfe' rx='10'/>" + inner + "</svg>";
  }

  function legend(items, x, y) {
    var s = "", cx = x;
    items.forEach(function (it) {
      s += line(cx, y, cx + 22, y, { stroke: it.color, w: 2.6, dash: it.dash });
      if (it.dot) s += dot(cx + 11, y, 4, { fill: it.color });
      s += txt(cx + 27, y + 4, it.label, { anchor: "start", size: 11, fill: C.ink });
      cx += 27 + textW(it.label, 11) + 22;
    });
    return s;
  }

  /* labelled box with auto-fitted centered text (title + optional subtitle) */
  function box(x, y, w, h, title, sub, o) {
    o = o || {};
    var s = rect(x, y, w, h, { fill: o.fill || C.blueSoft, stroke: o.stroke || C.blueLine, rx: o.rx || 8 });
    var ts = fitSize(title, w - 14, o.size || 12.5);
    var ty = sub ? y + h / 2 - 3 : y + h / 2 + 4;
    s += txt(x + w / 2, ty, title, { size: ts, fill: o.color || C.navy, weight: o.weight || 600 });
    if (sub) {
      var ss = fitSize(sub, w - 12, 10.5);
      s += txt(x + w / 2, y + h / 2 + 14, sub, { size: ss, fill: o.subColor || C.muted });
    }
    return s;
  }

  function band(x, y, w, h, label, o) {
    o = o || {};
    var s = rect(x, y, w, h, { fill: o.fill, stroke: o.stroke, rx: 6 });
    var sz = fitSize(label, w - 12, o.size || 11.5);
    s += txt(x + w / 2, y + h / 2 + 4, label, { size: sz, fill: o.color || C.ink, weight: o.weight || 600 });
    return s;
  }

  /* ============================================================
     FIGURES
     ============================================================ */
  var FIG = {};

  /* ---------- 1. Market classification tree ---------- */
  FIG.marketStructure = function () {
    var s = "";
    s += txt(340, 24, "金融市场的分类：先按「是否新发行」，再按「期限」", { size: 13, weight: 700, fill: C.navy });
    s += box(250, 38, 180, 40, "Financial Markets", "", { fill: C.navy, color: "#fff", stroke: C.navy });
    /* level 1 */
    s += box(60, 112, 240, 52, "一级市场 Primary", "发行人获得资金", { fill: C.blueSoft, stroke: C.blue });
    s += box(380, 112, 240, 52, "二级市场 Secondary", "提供流动性与定价", { fill: C.greenSoft, stroke: C.green });
    s += arrow(310, 62, 190, 110, { stroke: C.gray });
    s += arrow(370, 62, 490, 110, { stroke: C.gray });
    /* level 2 */
    s += box(20, 190, 140, 46, "货币市场", "期限 ≤ 1 年", { fill: C.amberSoft, stroke: C.amber });
    s += box(175, 190, 140, 46, "资本市场", "期限 > 1 年", { fill: C.purpleSoft, stroke: C.purple });
    s += box(330, 190, 140, 46, "交易所", "竞价撮合", { fill: C.graySoft, stroke: C.gray });
    s += box(485, 190, 140, 46, "场外 OTC", "做市商报价", { fill: C.graySoft, stroke: C.gray });
    s += arrow(125, 166, 90, 188, { stroke: C.gray, w: 1.4 });
    s += arrow(205, 166, 245, 188, { stroke: C.gray, w: 1.4 });
    s += arrow(455, 166, 400, 188, { stroke: C.gray, w: 1.4 });
    s += arrow(515, 166, 555, 188, { stroke: C.gray, w: 1.4 });
    /* notes */
    s += rect(20, 252, 640, 54, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(36, 272, "判断口诀：", { anchor: "start", size: 11.5, weight: 700, fill: C.amber });
    s += txt(110, 272, "看「谁收到钱」——发行人收到钱 = 一级市场；原投资者收到钱 = 二级市场。", { anchor: "start", size: 11.5, fill: C.ink });
    s += txt(36, 293, "股票虽无到期日，仍属资本市场（长期融资工具）。", { anchor: "start", size: 11.5, fill: C.muted });
    return wrap(320, s);
  };

  /* ---------- 2. Direct vs intermediated flow of funds ---------- */
  FIG.flowOfFunds = function () {
    var s = "";
    s += txt(340, 24, "直接融资 vs 间接融资：资金最终都到企业，但中间多了一层资产转换", { size: 12.5, weight: 700, fill: C.navy });

    /* --- direct --- */
    s += txt(160, 52, "Direct Financing 直接融资", { size: 12, weight: 700, fill: C.blue });
    s += box(30, 66, 120, 46, "资金盈余方", "Households", { fill: C.blueSoft, stroke: C.blue });
    s += box(200, 66, 120, 46, "资金短缺方", "Corporations", { fill: C.amberSoft, stroke: C.amber });
    s += arrow(150, 89, 198, 89, { stroke: C.blue });
    s += txt(174, 82, "现金", { size: 10, fill: C.blue });
    s += arrow(198, 105, 150, 105, { stroke: C.amber, dash: "4 3" });
    s += txt(174, 122, "证券（股/债）", { size: 10, fill: C.amber });

    /* --- intermediated --- */
    s += txt(505, 52, "Intermediated Financing 间接融资", { size: 12, weight: 700, fill: C.green });
    s += box(350, 66, 96, 46, "资金盈余方", "Households", { fill: C.blueSoft, stroke: C.blue });
    s += box(468, 60, 110, 58, "金融中介 FIs", "存款 / 保单", { fill: C.greenSoft, stroke: C.green });
    s += box(600, 66, 78, 46, "资金短缺方", "Corporations", { fill: C.amberSoft, stroke: C.amber });
    s += arrow(446, 89, 466, 89, { stroke: C.blue });
    s += txt(456, 80, "现金", { size: 10, fill: C.blue });
    s += arrow(578, 89, 598, 89, { stroke: C.green });
    s += txt(588, 80, "贷款", { size: 10, fill: C.green });
    s += arrow(598, 105, 578, 105, { stroke: C.amber, dash: "4 3" });
    s += txt(588, 126, "还本付息", { size: 10, fill: C.amber });
    s += arrow(468, 105, 448, 105, { stroke: C.blue, dash: "4 3" });

    /* divider */
    s += line(340, 46, 340, 140, { stroke: C.grid, w: 1, dash: "5 4" });

    /* why intermediaries */
    s += rect(20, 152, 640, 158, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(36, 174, "为什么需要中介？五大功能", { anchor: "start", size: 12, weight: 700, fill: C.navy });
    var fns = [
      ["降低监控成本", "Delegated monitoring"],
      ["提高流动性", "降低价格风险"],
      ["降低交易成本", "规模经济"],
      ["期限转换", "Maturity intermediation"],
      ["面额转换", "Denomination intermediation"]
    ];
    fns.forEach(function (f, i) {
      var x = 34 + (i % 3) * 208, y = 188 + Math.floor(i / 3) * 58;
      s += band(x, y, 196, 36, f[0], { fill: C.purpleSoft, stroke: C.purpleLine, color: C.purple });
      s += txt(x + 98, y + 48, f[1], { size: 10, fill: C.muted });
    });
    return wrap(322, s);
  };

  /* ---------- 3. Financial institution categories ---------- */
  FIG.fiCategories = function () {
    var s = "";
    s += txt(340, 24, "金融机构四大类：同一家机构可跨多个类别", { size: 13, weight: 700, fill: C.navy });
    var cats = [
      { t: "存款类 Depository", sub: "商业银行 · 信用社 · 储蓄机构", items: ["吸收存款并发放贷款", "主要资产是贷款与证券"], c: C.blue, f: C.blueSoft, l: C.blueLine },
      { t: "契约储蓄 Contractual savings", sub: "寿险 · 财险 · 养老金", items: ["按合约定期收付", "负债久期长、可预测"], c: C.green, f: C.greenSoft, l: C.greenLine },
      { t: "投资集合 Investment pools", sub: "共同基金 · ETF · 对冲基金", items: ["把小额资金集合起来", "投资证券组合"], c: C.purple, f: C.purpleSoft, l: C.purpleLine },
      { t: "市场中介 Intermediaries", sub: "投行 · 经纪商 · 做市商 · 交易所", items: ["撮合、承销、做市", "未必承担资产负债表风险"], c: C.amber, f: C.amberSoft, l: C.amberLine }
    ];
    cats.forEach(function (k, i) {
      var x = 20 + i * 165, w = 152;
      s += rect(x, 40, w, 118, { fill: k.f, stroke: k.l, rx: 9 });
      var ts = fitSize(k.t, w - 12, 12);
      s += txt(x + w / 2, 62, k.t, { size: ts, weight: 700, fill: k.c });
      s += line(x + 12, 70, x + w - 12, 70, { stroke: k.l, w: 1 });
      var ss = fitSize(k.sub, w - 12, 10.5);
      s += txt(x + w / 2, 88, k.sub, { size: ss, fill: C.ink });
      var is1 = fitSize(k.items[0], w - 14, 9.8);
      s += txt(x + w / 2, 118, k.items[0], { size: is1, fill: C.muted });
      var is2 = fitSize(k.items[1], w - 14, 9.8);
      s += txt(x + w / 2, 136, k.items[1], { size: is2, fill: C.muted });
    });
    /* risk strip */
    s += rect(20, 172, 640, 86, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(36, 194, "金融机构面临的十大风险", { anchor: "start", size: 12, weight: 700, fill: C.navy });
    var risks = ["信用风险", "利率风险", "市场风险", "流动性风险", "汇率风险",
                 "国家/主权风险", "表外风险", "技术风险", "操作风险", "资不抵债风险"];
    risks.forEach(function (r, i) {
      var x = 34 + (i % 5) * 125, y = 206 + Math.floor(i / 5) * 28;
      s += band(x, y, 116, 24, r, { fill: C.redSoft, stroke: C.redLine, color: C.red, size: 10.5 });
    });
    return wrap(272, s);
  };

  /* ---------- 4. China access channels ---------- */
  FIG.chinaAccess = function () {
    var s = "";
    s += txt(340, 24, "中国资本市场的跨境通道：QFII / QDII 与互联互通", { size: 13, weight: 700, fill: C.navy });

    s += box(30, 46, 150, 54, "境外投资者", "Foreign investors", { fill: C.blueSoft, stroke: C.blue });
    s += box(500, 46, 150, 54, "境内投资者", "Domestic investors", { fill: C.amberSoft, stroke: C.amber });
    s += box(230, 40, 220, 66, "中国境内市场", "A 股（人民币计价）· 银行间债市", { fill: C.navy, color: "#fff", stroke: C.navy });

    /* QFII: foreign -> domestic */
    s += arrow(182, 66, 228, 66, { stroke: C.blue });
    s += txt(205, 56, "QFII", { size: 11.5, weight: 700, fill: C.blue });
    s += txt(205, 82, "投境内", { size: 9.5, fill: C.blue });
    /* QDII: domestic -> foreign */
    s += arrow(498, 88, 452, 88, { stroke: C.amber });
    s += txt(475, 78, "QDII", { size: 11.5, weight: 700, fill: C.amber });
    s += txt(475, 104, "投境外", { size: 9.5, fill: C.amber });
    /* Stock connect: two-way with HK */
    s += box(230, 130, 220, 46, "香港市场 (HKEX)", "互联互通的对接端", { fill: C.greenSoft, stroke: C.green });
    s += biArrow(340, 108, 340, 128, { stroke: C.green, w: 2 });
    s += txt(458, 122, "沪港通 / 深港通", { anchor: "start", size: 10.5, weight: 700, fill: C.green });
    s += txt(458, 138, "双向额度 + 标的名单", { anchor: "start", size: 9.5, fill: C.muted });

    /* A vs B share */
    s += rect(20, 192, 310, 84, { fill: C.blueSoft, stroke: C.blueLine, rx: 8 });
    s += txt(36, 214, "A 股 vs B 股", { anchor: "start", size: 12, weight: 700, fill: C.blue });
    s += txt(36, 236, "A 股：以人民币计价交易", { anchor: "start", size: 11, fill: C.ink });
    s += txt(36, 254, "B 股：上海以美元、深圳以港币", { anchor: "start", size: 11, fill: C.ink });
    s += txt(36, 270, "A 股 ≠ 只有境内投资者持有", { anchor: "start", size: 10.5, fill: C.red, weight: 600 });

    s += rect(350, 192, 310, 84, { fill: C.purpleSoft, stroke: C.purpleLine, rx: 8 });
    s += txt(366, 214, "交易所格局", { anchor: "start", size: 12, weight: 700, fill: C.purple });
    s += txt(366, 236, "上交所 SSE：主板 + 科创板 STAR", { anchor: "start", size: 11, fill: C.ink });
    s += txt(366, 254, "深交所 SZSE：主板 + 创业板 ChiNext", { anchor: "start", size: 11, fill: C.ink });
    s += txt(366, 270, "北交所 BSE：创新型中小企业", { anchor: "start", size: 11, fill: C.ink });
    return wrap(292, s);
  };

  /* ---------- 5. Margin leverage ---------- */
  FIG.marginLeverage = function () {
    var s = "";
    s += txt(340, 24, "杠杆如何放大收益与亏损：同一资产变动，自有资金回报被倍数放大", { size: 12.5, weight: 700, fill: C.navy });

    var f = frame({
      h: 320, xMin: -0.15, xMax: 0.15, yMin: -30, yMax: 30,
      xLabel: "股价变动幅度", yLabel: "自有资金回报率 (%)",
      xTicks: [{ v: -0.10, l: "−10%" }, { v: -0.05, l: "−5%" }, { v: 0, l: "0" }, { v: 0.05, l: "+5%" }, { v: 0.10, l: "+10%" }],
      yTicks: [{ v: -25, l: "−25" }, { v: -10, l: "−10" }, { v: 0, l: "0" }, { v: 10, l: "10" }, { v: 25, l: "25" }]
    });
    s += f.svg;
    /* unlevered: slope 1 (10% -> 10) */
    var p1 = { x: f.sx(-0.12), y: f.sy(-12) }, p2 = { x: f.sx(0.12), y: f.sy(12) };
    s += line(p1.x, p1.y, p2.x, p2.y, { stroke: C.gray, w: 2, dash: "6 4" });
    s += txt(f.sx(0.118), f.sy(13) - 6, "不借资：斜率 1", { anchor: "end", size: 10.5, fill: C.muted });
    /* levered: slope 2.5 */
    var q1 = { x: f.sx(-0.12), y: f.sy(-30) }, q2 = { x: f.sx(0.12), y: f.sy(30) };
    s += line(q1.x, q1.y, q2.x, q2.y, { stroke: C.red, w: 2.6 });
    s += txt(f.sx(0.118), f.sy(31) + 4, "借资 2.5×：斜率 2.5", { anchor: "end", size: 10.5, fill: C.red, weight: 600 });
    /* marked points */
    [[-0.10, 10, C.green], [0.10, 10, C.green]].forEach(function () {});
    s += dot(f.sx(0.10), f.sy(25), 5, { fill: C.red });
    s += txt(f.sx(0.10) + 8, f.sy(25) - 6, "+25%", { anchor: "start", size: 11, weight: 700, fill: C.red });
    s += dot(f.sx(-0.10), f.sy(-25), 5, { fill: C.red });
    s += txt(f.sx(-0.10) - 8, f.sy(-25) + 14, "−25%", { anchor: "end", size: 11, weight: 700, fill: C.red });
    s += dot(f.sx(0.10), f.sy(10), 5, { fill: C.gray });
    s += txt(f.sx(0.10) + 8, f.sy(10) + 14, "+10%", { anchor: "start", size: 11, fill: C.muted });
    s += dot(f.sx(-0.10), f.sy(-10), 5, { fill: C.gray });
    s += txt(f.sx(-0.10) - 8, f.sy(-10) + 14, "−10%", { anchor: "end", size: 11, fill: C.muted });
    s += line(f.L, f.sy(0), f.R, f.sy(0), { stroke: C.ink, w: 1.2 });
    /* note */
    s += rect(f.L, f.capY - 12, 570, 34, { fill: C.amberSoft, stroke: C.amberLine, rx: 7 });
    s += txt(f.L + 12, f.capY + 6, "自有资金 ¥40,000 + 借入 ¥60,000 → 资产敞口 ¥100,000 = 2.5 倍", { anchor: "start", size: 11, weight: 600, fill: C.amber });
    return wrap(f.H + 18, s);
  };

  /* ---------- 6. Margin spiral ---------- */
  FIG.marginSpiral = function () {
    var s = "";
    s += txt(340, 24, "下跌螺旋：保证金追缴 → 强制平仓 → 更深的跌幅", { size: 13, weight: 700, fill: C.navy });
    var steps = [
      ["股价开始下跌", "资产市值缩水，账户权益下降"],
      ["保证金比例不足", "触发 Margin Call 追缴通知"],
      ["投资者补仓或卖出", "无现金则被迫卖出持仓"],
      ["卖压压低价格", "成交价进一步下跌"],
      ["更多账户被追缴", "螺旋自我强化，流动性枯竭"]
    ];
    steps.forEach(function (st, i) {
      var x = 30 + i * 126, w = 112;
      s += box(x, 44, w, 56, st[0], "", { fill: C.redSoft, stroke: C.redLine, color: C.red, size: 11 });
      var sz = fitSize(st[1], w - 8, 9.6);
      s += txt(x + w / 2, 118, st[1], { size: sz, fill: C.muted });
      s += txt(x + w / 2, 134, "", { size: 9 });
      if (i < steps.length - 1) s += arrow(x + w + 2, 72, x + 122, 72, { stroke: C.red, w: 2 });
    });
    /* the loop-back */
    s += path("M 620 78 C 660 78 664 150 620 150", { stroke: C.red, w: 1.8, dash: "5 4" });
    s += arrow(620, 150, 600, 128, { stroke: C.red, w: 1.8, dash: "5 4" });
    s += txt(596, 168, "自我强化", { size: 10, fill: C.red, weight: 600 });

    s += rect(20, 176, 640, 88, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(36, 198, "课件要点：2014–2016 中国股市的杠杆链条", { anchor: "start", size: 12, weight: 700, fill: C.navy });
    s += txt(36, 220, "融资融券（场内、受监管） + 场外配资 / 伞形信托 / HOMS 分仓系统（不受监管、杠杆更高）", { anchor: "start", size: 11, fill: C.ink });
    s += txt(36, 240, "资金面宽松 + 羊群效应 → 上涨自我强化；但「最近涨了」不构成基本面价值的证据。", { anchor: "start", size: 11, fill: C.ink });
    s += txt(36, 258, "熔断机制在极端行情下反而可能加剧流动性枯竭，被迫暂停交易。", { anchor: "start", size: 10.5, fill: C.muted });
    return wrap(278, s);
  };

  /* ---------- 7. Loanable funds ---------- */
  FIG.loanableFunds = function () {
    var s = "";
    var f = frame({
      h: 322, xMin: 0, xMax: 120, yMin: 0, yMax: 10,
      xLabel: "可贷资金数量 Quantity of loanable funds", yLabel: "实际利率 Real interest rate (%)",
      xTicks: [{ v: 0, l: "0" }, { v: 40, l: "40" }, { v: 60, l: "60" }, { v: 80, l: "80" }, { v: 110, l: "110" }],
      yTicks: [{ v: 0, l: "0" }, { v: 3, l: "3" }, { v: 5, l: "5" }, { v: 7, l: "7" }, { v: 9, l: "9" }]
    });
    s += f.svg;
    /* S: upward, D: downward. Intersection at (60, 5) */
    s += line(f.sx(8), f.sy(1.2), f.sx(112), f.sy(8.4), { stroke: C.green, w: 2.6 });
    s += txt(f.sx(112), f.sy(8.4) - 10, "S（储蓄供给）", { anchor: "end", size: 11.5, weight: 700, fill: C.green });
    s += line(f.sx(8), f.sy(8.4), f.sx(112), f.sy(1.2), { stroke: C.blue, w: 2.6 });
    s += txt(f.sx(112), f.sy(1.2) + 16, "D（投资需求）", { anchor: "end", size: 11.5, weight: 700, fill: C.blue });
    /* shifted S' (more saving) */
    s += line(f.sx(8), f.sy(0.4), f.sx(112), f.sy(7.6), { stroke: C.green, w: 2, dash: "6 4" });
    s += txt(f.sx(112), f.sy(7.6) - 12, "S′（储蓄增加 → 右移）", { anchor: "end", size: 10.5, fill: C.green });
    /* shifted D' (more investment) */
    s += line(f.sx(26), f.sy(9.2), f.sx(120), f.sy(2.4), { stroke: C.blue, w: 2, dash: "6 4" });
    s += txt(f.sx(120), f.sy(2.4) + 18, "D′（投资需求增加 → 右移）", { anchor: "end", size: 10.5, fill: C.blue });

    /* equilibrium markers */
    s += dot(f.sx(60), f.sy(5), 5.5, { fill: C.navy });
    s += txt(f.sx(60) + 12, f.sy(5) - 8, "E₀", { anchor: "start", size: 11.5, weight: 700, fill: C.navy });
    s += line(f.L, f.sy(5), f.sx(60), f.sy(5), { stroke: C.navy, w: 1.2, dash: "4 3" });
    s += line(f.sx(60), f.B, f.sx(60), f.sy(5), { stroke: C.navy, w: 1.2, dash: "4 3" });
    /* new equilibria */
    s += dot(f.sx(78), f.sy(3.9), 4.5, { fill: C.green });
    s += dot(f.sx(82), f.sy(6.0), 4.5, { fill: C.blue });
    s += txt(f.sx(78) + 8, f.sy(3.9) + 16, "E₁", { anchor: "start", size: 10.5, weight: 700, fill: C.green });
    s += txt(f.sx(82) + 8, f.sy(6.0) - 6, "E₂", { anchor: "start", size: 10.5, weight: 700, fill: C.blue });
    /* movement-along arrow on S */
    s += arrow(f.sx(60), f.sy(5), f.sx(72), f.sy(5.9), { stroke: C.amber, w: 2 });
    s += txt(f.sx(66), f.sy(4.4), "沿曲线移动", { size: 9.5, fill: C.amber, weight: 600 });
    return wrap(f.H + 8, s);
  };

  /* ---------- 8. Interest rate decomposition ---------- */
  FIG.rateDecomposition = function () {
    var s = "";
    s += txt(340, 24, "名义利率的加总分解：每一层都是对一类风险/成本的补偿", { size: 12.5, weight: 700, fill: C.navy });
    var parts = [
      { t: "实际利率", en: "r_real", v: 1.5, c: C.green, f: C.greenSoft, l: C.greenLine, d: "剔除通胀后的真实资金成本" },
      { t: "通胀溢价", en: "IP", v: 2.5, c: C.blue, f: C.blueSoft, l: C.blueLine, d: "补偿购买力损失（费雪效应）" },
      { t: "违约风险溢价", en: "DRP", v: 1.2, c: C.amber, f: C.amberSoft, l: C.amberLine, d: "借款人可能不按约偿付" },
      { t: "流动性溢价", en: "LRP", v: 0.4, c: C.purple, f: C.purpleSoft, l: C.purpleLine, d: "难以按可预期价格快速变现" },
      { t: "期限风险溢价", en: "MRP", v: 0.4, c: C.red, f: C.redSoft, l: C.redLine, d: "承担长期利率不确定性" }
    ];
    var x = 40, y = 52, scale = 92;
    s += line(40, y + 92, 40, y + 130, { stroke: C.axis, w: 1.4 });
    s += line(40, y + 130, 640, y + 130, { stroke: C.axis, w: 1.4 });
    parts.forEach(function (p, i) {
      var w = Math.max(p.v * scale, 58);
      s += rect(x, y, w, 78, { fill: p.f, stroke: p.l, rx: 4 });
      var ts = fitSize(p.t, w - 8, 11.5);
      s += txt(x + w / 2, y + 30, p.t, { size: ts, weight: 700, fill: p.c });
      s += txt(x + w / 2, y + 48, p.en, { size: 11, weight: 700, fill: p.c });
      s += txt(x + w / 2, y + 66, "+" + p.v.toFixed(1) + "%", { size: 10.5, fill: C.ink });
      s += txt(x + w / 2, y + 144, p.en, { size: 10.5, weight: 700, fill: C.muted });
      x += w;
    });
    s += arrow(40, y + 158, 640, y + 158, { stroke: C.navy, w: 1.6 });
    s += txt(340, y + 178, "名义利率 r = r_real + IP + DRP + LRP + MRP", { size: 13, weight: 700, fill: C.navy });
    /* Fisher strip */
    s += rect(40, y + 190, 600, 44, { fill: C.blueSoft, stroke: C.blueLine, rx: 8 });
    s += txt(340, y + 210, "费雪效应 Fisher Effect：r_nominal ≈ r_real + E(π)", { size: 12, weight: 700, fill: C.blue });
    s += txt(340, y + 228, "实际利率不变时，预期通胀上升 1% → 名义利率约上升 1%", { size: 10.5, fill: C.muted });
    return wrap(300, s);
  };

  /* ---------- 9. Yield curve shapes ---------- */
  FIG.yieldCurveShapes = function () {
    var s = "";
    s += txt(340, 24, "收益率曲线的三种基本形状（以 1/2/5/10 年为例）", { size: 13, weight: 700, fill: C.navy });
    var m = [1, 2, 5, 10];
    var series = [
      { name: "向上倾斜 Upward", ys: [1.20, 1.45, 1.95, 2.40], c: C.green, dy: 18 },
      { name: "平坦 Flat", ys: [4.20, 4.25, 4.38, 4.55], c: C.gray, dy: 16 },
      { name: "倒挂 Inverted", ys: [5.80, 5.45, 5.00, 4.72], c: C.red, dy: -10 }
    ];
    var f = frame({
      h: 316, xMin: 0.5, xMax: 10.5, yMin: 0.8, yMax: 6.2,
      xLabel: "期限 Maturity（年）", yLabel: "收益率 Yield (%)",
      xTicks: m.map(function (v) { return { v: v, l: v + "Y" }; }),
      yTicks: [{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }, { v: 4, l: "4" }, { v: 5, l: "5" }, { v: 6, l: "6" }]
    });
    s += f.svg;
    series.forEach(function (se) {
      var d = m.map(function (v, i) { return (i ? "L" : "M") + n(f.sx(v)) + "," + n(f.sy(se.ys[i])); }).join(" ");
      s += path(d, { stroke: se.c, w: 2.8 });
      m.forEach(function (v, i) { s += dot(f.sx(v), f.sy(se.ys[i]), 4, { fill: se.c }); });
      var last = m.length - 1;
      s += txt(f.R - 4, f.sy(se.ys[last]) + se.dy, se.name, { anchor: "end", size: 10.5, weight: 700, fill: se.c });
    });
    s += txt(340, f.capY + 4, "期限价差 Term Spread = y₁₀ − y₁；>0.20% 向上，±0.20% 内平坦，<−0.20% 倒挂", { size: 11, weight: 600, fill: C.navy });
    return wrap(f.H + 8, s);
  };

  /* ---------- 10. Term structure theories ---------- */
  FIG.termStructureTheories = function () {
    var s = "";
    s += txt(340, 24, "期限结构三大理论：对同一条曲线的三种解释", { size: 13, weight: 700, fill: C.navy });
    var th = [
      { t: "无偏预期理论 UET", c: C.blue, f: C.blueSoft, l: C.blueLine,
        core: "长端 = 未来短端预期的几何平均",
        fml: "(1+z_n)^n = Π(1+i_t^e)",
        ok: "解释：同向变动、倒挂", no: "无法解释：曲线通常向上" },
      { t: "流动性溢价理论", c: C.green, f: C.greenSoft, l: C.greenLine,
        core: "长端 = 预期 + 正的期限溢价",
        fml: "z_n = 预期均值 + LRP_n",
        ok: "解释：向上倾斜、同向变动", no: "假设：溢价随期限单调上升" },
      { t: "市场分割理论", c: C.purple, f: C.purpleSoft, l: C.purpleLine,
        core: "各期限独立，由自身供需决定",
        fml: "偏好决定价格，非套利",
        ok: "解释：特定区段的异常", no: "忽略：跨期限的替代与套利" }
    ];
    th.forEach(function (k, i) {
      var x = 20 + i * 220, w = 208;
      s += rect(x, 40, w, 158, { fill: k.f, stroke: k.l, rx: 9 });
      var ts = fitSize(k.t, w - 12, 12.5);
      s += txt(x + w / 2, 62, k.t, { size: ts, weight: 700, fill: k.c });
      s += line(x + 12, 70, x + w - 12, 70, { stroke: k.l, w: 1 });
      var cs = fitSize(k.core, w - 14, 11);
      s += txt(x + w / 2, 90, k.core, { size: cs, fill: C.ink, weight: 600 });
      s += rect(x + 14, 100, w - 28, 30, { fill: "#fff", stroke: k.l, rx: 5 });
      s += txt(x + w / 2, 120, k.fml, { size: 11, weight: 700, fill: k.c });
      s += txt(x + w / 2, 144, "✓ " + k.ok, { size: 10.2, fill: C.green });
      s += txt(x + w / 2, 162, "✗ " + k.no, { size: 10.2, fill: C.red });
      s += txt(x + w / 2, 182, "", { size: 9 });
    });
    s += rect(20, 212, 640, 56, { fill: C.amberSoft, stroke: C.amberLine, rx: 8 });
    s += txt(340, 234, "考试口径：流动性溢价理论 = UET + 正的期限溢价，是三理论中最常被要求使用的版本", { size: 11.5, weight: 600, fill: C.amber });
    s += txt(340, 256, "曲线向上倾斜 ⟹ 不等于预期短期利率上升（溢价也能造成）", { size: 11, fill: C.ink });
    return wrap(284, s);
  };

  /* ---------- 11. Forward rate timeline ---------- */
  FIG.forwardRate = function () {
    var s = "";
    s += txt(340, 24, "远期利率：由两条即期利率隐含解出的「未来一年」利率", { size: 12.5, weight: 700, fill: C.navy });
    var y0 = 96, x0 = 90, x2 = 590;
    s += line(x0, y0, x2, y0, { stroke: C.axis, w: 1.6 });
    [x0, 340, x2].forEach(function (x, i) {
      s += line(x, y0 - 8, x, y0 + 8, { stroke: C.navy, w: 1.6 });
      s += txt(x, y0 + 26, ["今天 (t=0)", "第 1 年末", "第 2 年末"][i], { size: 11, fill: C.navy, weight: 600 });
    });
    /* z1 segment */
    s += rect(100, 52, 230, 30, { fill: C.blueSoft, stroke: C.blueLine, rx: 6 });
    s += txt(215, 72, "z₁ = 4.0%（第 1 年即期利率）", { size: 11.5, weight: 700, fill: C.blue });
    /* z2 segment */
    s += rect(100, 122, 480, 30, { fill: C.greenSoft, stroke: C.greenLine, rx: 6 });
    s += txt(340, 142, "z₂ = 4.5%（两年期即期利率，按年复利）", { size: 11.5, weight: 700, fill: C.green });
    /* forward segment */
    s += rect(350, 52, 230, 30, { fill: C.amberSoft, stroke: C.amberLine, rx: 6 });
    s += txt(465, 72, "f₁,₂ = ?（隐含远期利率）", { size: 11.5, weight: 700, fill: C.amber });
    s += arrow(465, 88, 465, 118, { stroke: C.amber, w: 1.6, dash: "4 3" });

    s += rect(90, 176, 500, 44, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(340, 196, "(1 + z₂)² = (1 + z₁)(1 + f₁,₂)", { size: 14, weight: 700, fill: C.navy });
    s += txt(340, 214, "两条路径在两年末必须给出相同的复利结果", { size: 10.5, fill: C.muted });

    s += rect(90, 230, 500, 62, { fill: C.purpleSoft, stroke: C.purpleLine, rx: 8 });
    s += txt(340, 250, "把 f₁,₂ 读成「预期未来即期利率」需要额外假设", { size: 11.5, weight: 700, fill: C.purple });
    s += txt(340, 268, "该假设 = 不存在期限/流动性溢价（即 UET 成立）", { size: 11, fill: C.ink });
    s += txt(340, 286, "复利恒等式本身只是一个恒等式，不构成预测。", { size: 10.5, fill: C.muted });
    return wrap(304, s);
  };

  /* ---------- 12. Curve move classification ---------- */
  FIG.curveMoves = function () {
    var s = "";
    s += txt(340, 24, "曲线移动的四种组合：牛/熊（水平）× 陡/平（斜率）", { size: 13, weight: 700, fill: C.navy });
    var cells = [
      { t: "牛陡 Bull steepening", d: "收益率整体下行，短端降更多 → 价差扩大", c: C.green, f: C.greenSoft, l: C.greenLine, up: false, st: true },
      { t: "牛平 Bull flattening", d: "收益率整体下行，长端降更多 → 价差收窄", c: C.blue, f: C.blueSoft, l: C.blueLine, up: false, st: false },
      { t: "熊陡 Bear steepening", d: "收益率整体上行，长端升更多 → 价差扩大", c: C.amber, f: C.amberSoft, l: C.amberLine, up: true, st: true },
      { t: "熊平 Bear flattening", d: "收益率整体上行，短端升更多 → 价差收窄", c: C.red, f: C.redSoft, l: C.redLine, up: true, st: false }
    ];
    cells.forEach(function (c, i) {
      var x = 20 + (i % 2) * 330, y = 40 + Math.floor(i / 2) * 128, w = 316, h = 116;
      s += rect(x, y, w, h, { fill: c.f, stroke: c.l, rx: 9 });
      var ts = fitSize(c.t, 160, 12);
      s += txt(x + 12, y + 22, c.t, { anchor: "start", size: ts, weight: 700, fill: c.c });
      /* mini curve: old vs new */
      var mx = x + 176, my = y + 92, mw = 128, mh = 56;
      s += line(mx, my, mx + mw, my, { stroke: C.axis, w: 1 });
      s += line(mx, my, mx, my - mh, { stroke: C.axis, w: 1 });
      function plot(shift, steep, color, dash) {
        var a = c.up ? 0.30 : 0.70, b = c.up ? 0.62 : 0.34;
        if (!steep) b = c.up ? 0.72 : 0.28;
        return line(mx + 8, my - mh * (a + shift), mx + mw - 8, my - mh * (b + shift * (steep ? 0.05 : 0.0)),
          { stroke: color, w: 2, dash: dash });
      }
      s += plot(0.16, c.st, C.gray, "5 3");
      s += plot(0, c.st, c.c, null);
      s += txt(x + 12, y + 44, c.d, { anchor: "start", size: 10.2, fill: C.ink });
      s += txt(x + 12, y + 62, "虚线 = 原曲线，实线 = 新曲线", { anchor: "start", size: 9.5, fill: C.muted });
    });
    return wrap(304, s);
  };

  /* ---------- 13. Price-yield curve with convexity ---------- */
  FIG.bondPriceYield = function () {
    var s = "";
    var f = frame({
      h: 330, xMin: 0.01, xMax: 0.09, yMin: 700, yMax: 1300,
      xLabel: "到期收益率 YTM", yLabel: "债券价格 Price ($)",
      xTicks: [{ v: 0.02, l: "2%" }, { v: 0.03, l: "3%" }, { v: 0.04, l: "4%" }, { v: 0.05, l: "5%" }, { v: 0.06, l: "6%" }, { v: 0.07, l: "7%" }, { v: 0.08, l: "8%" }],
      yTicks: [{ v: 800, l: "800" }, { v: 900, l: "900" }, { v: 1000, l: "1000" }, { v: 1100, l: "1100" }, { v: 1200, l: "1200" }]
    });
    s += f.svg;
    /* convex price curve: P(y) approx via convex function through (0.04, 1000) */
    function P(y) {
      /* 5-year 4% coupon, annual: price as function of yield (scaled) */
      var pv = 0;
      for (var t = 1; t <= 5; t++) pv += (t < 5 ? 40 : 1040) / Math.pow(1 + y, t);
      return pv;
    }
    var pts = [], i, y;
    for (i = 0; i <= 60; i++) {
      y = 0.01 + (0.09 - 0.01) * i / 60;
      pts.push([f.sx(y), f.sy(P(y))]);
    }
    var d = pts.map(function (p, k) { return (k ? "L" : "M") + n(p[0]) + "," + n(p[1]); }).join(" ");
    s += path(d, { stroke: C.blue, w: 2.8 });

    /* tangent at y0 = 4% */
    var y0 = 0.04, p0 = P(0.04);
    var h = 0.0005, slope = (P(y0 + h) - P(y0 - h)) / (2 * h);
    function tan(y) { return p0 + slope * (y - y0); }
    s += line(f.sx(0.018), f.sy(tan(0.018)), f.sx(0.082), f.sy(tan(0.082)), { stroke: C.amber, w: 2, dash: "6 4" });
    s += dot(f.sx(y0), f.sy(p0), 5.5, { fill: C.navy });
    s += txt(f.sx(y0) + 14, f.sy(p0) - 10, "y₀ = 4%，P = $1000（平价）", { anchor: "start", size: 10.5, weight: 700, fill: C.navy });

    /* the asymmetry: +1% vs -1% */
    var yUp = 0.05, yDn = 0.03;
    s += line(f.sx(yUp), f.sy(P(yUp)), f.sx(yUp), f.sy(tan(yUp)), { stroke: C.red, w: 1.6 });
    s += line(f.sx(yDn), f.sy(P(yDn)), f.sx(yDn), f.sy(tan(yDn)), { stroke: C.green, w: 1.6 });
    s += dot(f.sx(yUp), f.sy(P(yUp)), 4.5, { fill: C.red });
    s += dot(f.sx(yUp), f.sy(tan(yUp)), 4, { fill: C.amber });
    s += dot(f.sx(yDn), f.sy(P(yDn)), 4.5, { fill: C.green });
    s += dot(f.sx(yDn), f.sy(tan(yDn)), 4, { fill: C.amber });
    s += txt(f.sx(yUp) + 10, f.sy(tan(yUp)) - 8, "久期线性估计（切线）高估损失", { anchor: "start", size: 9.8, fill: C.red });
    s += txt(f.sx(yDn) - 10, f.sy(tan(yDn)) + 14, "低估收益", { anchor: "end", size: 9.8, fill: C.green });

    s += legend([
      { label: "真实价格—收益率曲线（凸）", color: C.blue },
      { label: "久期线性近似", color: C.amber, dash: "6 4" }
    ], f.L + 4, 24);
    s += txt(340, f.capY + 4, "凸性 = 曲线的弯曲程度：收益上升时的损失 < 收益同幅下降时的收益", { size: 11, weight: 600, fill: C.navy });
    return wrap(f.H + 10, s);
  };

  /* ---------- 14. Pull to par ---------- */
  FIG.pullToPar = function () {
    var s = "";
    var f = frame({
      h: 316, xMin: 0, xMax: 10, yMin: 820, yMax: 1180,
      xLabel: "距到期的剩余年限", yLabel: "债券价格 Price ($)",
      xTicks: [{ v: 0, l: "0" }, { v: 2, l: "2" }, { v: 4, l: "4" }, { v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }],
      yTicks: [{ v: 850, l: "850" }, { v: 900, l: "900" }, { v: 950, l: "950" }, { v: 1000, l: "1000" }, { v: 1050, l: "1050" }, { v: 1100, l: "1100" }, { v: 1150, l: "1150" }]
    });
    s += f.svg;
    function price(T, c, y) {
      var pv = 0;
      for (var t = 1; t <= Math.round(T); t++) pv += (t < Math.round(T) ? c * 1000 : c * 1000 + 1000) / Math.pow(1 + y, t);
      return pv;
    }
    function curve(c, y, color, label, dash, ly) {
      var pts = [], T;
      for (T = 10; T >= 1; T--) pts.push([f.sx(T), f.sy(price(T, c, y))]);
      var d = pts.map(function (p, k) { return (k ? "L" : "M") + n(p[0]) + "," + n(p[1]); }).join(" ");
      var out = path(d, { stroke: color, w: 2.6, dash: dash });
      pts.forEach(function (p) { out += dot(p[0], p[1], 3.2, { fill: color }); });
      out += txt(f.sx(10) - 8, ly, label, { anchor: "end", size: 10.2, weight: 700, fill: color });
      return out;
    }
    s += curve(0.06, 0.04, C.blue, "溢价债（c=6% > y=4%）", null, f.sy(price(10, 0.06, 0.04)) - 6);
    s += curve(0.04, 0.04, C.gray, "平价债（c=y=4%）", "5 4", f.sy(1000) + 18);
    s += curve(0.02, 0.04, C.amber, "折价债（c=2% < y=4%）", null, 251);
    s += line(f.L, f.sy(1000), f.R, f.sy(1000), { stroke: C.navy, w: 1.4, dash: "5 4" });
    s += txt(f.R - 4, f.sy(1000) - 8, "面值 $1,000", { anchor: "end", size: 10.5, weight: 700, fill: C.navy });
    s += txt(340, f.capY + 2, "收益率不变时，溢价随到期临近收敛至 0（pull to par）；折价同理向上收敛", { size: 11, weight: 600, fill: C.navy });
    return wrap(f.H + 6, s);
  };

  /* ---------- 15. Duration vs maturity / coupon ---------- */
  FIG.durationSensitivity = function () {
    var s = "";
    s += txt(340, 22, "久期随期限上升但增速递减；票息越高久期越短", { size: 12.5, weight: 700, fill: C.navy });
    /* left: maturity effect */
    var f1 = frame({
      h: 300, xMin: 0, xMax: 32, yMin: 0, yMax: 32,
      xLabel: "期限 Maturity（年）", yLabel: "麦考利久期（年）",
      xTicks: [{ v: 5, l: "5" }, { v: 10, l: "10" }, { v: 15, l: "15" }, { v: 20, l: "20" }, { v: 25, l: "25" }, { v: 30, l: "30" }],
      yTicks: [{ v: 0, l: "0" }, { v: 5, l: "5" }, { v: 10, l: "10" }, { v: 15, l: "15" }, { v: 20, l: "20" }, { v: 25, l: "25" }, { v: 30, l: "30" }]
    });
    var s1 = f1.svg;
    function macDur(T, c, y) {
      var pv = 0, wsum = 0, t;
      for (t = 1; t <= T; t++) {
        var cf = (t < T ? c * 1000 : c * 1000 + 1000);
        var pv_t = cf / Math.pow(1 + y, t);
        pv += pv_t; wsum += t * pv_t;
      }
      return wsum / pv;
    }
    var ds = [], T;
    for (T = 5; T <= 30; T += 5) ds.push([f1.sx(T), f1.sy(macDur(T, 0.06, 0.06))]);
    s1 += path(ds.map(function (p, k) { return (k ? "L" : "M") + n(p[0]) + "," + n(p[1]); }).join(" "), { stroke: C.blue, w: 3 });
    ds.forEach(function (p) { s1 += dot(p[0], p[1], 4.5, { fill: C.blue }); });
    s1 += line(f1.sx(5), f1.sy(5), f1.sx(30), f1.sy(30), { stroke: C.gray, w: 1.6, dash: "5 4" });
    s1 += txt(f1.sx(26), f1.sy(26) - 8, "零息债：久期 = 期限（虚线）", { anchor: "end", size: 9.6, fill: C.muted });
    /* increment brackets: show decreasing step sizes */
    var prev = null;
    ds.forEach(function (p, k) {
      if (prev) {
        s1 += line(p[0], prev[1], p[0], p[1], { stroke: C.red, w: 1.4 });
        var inc = (macDur(5 + k * 5, 0.06, 0.06) - macDur(5 + (k - 1) * 5, 0.06, 0.06)).toFixed(2);
        s1 += txt(p[0] + 8, (prev[1] + p[1]) / 2 + 4, "+" + inc, { anchor: "start", size: 9.2, fill: C.red });
      }
      prev = p;
    });
    s1 += txt(340, f1.capY + 2, "票息 6%、收益率 6%：久期随期限递增，但每 5 年的增量递减", { size: 10.5, weight: 600, fill: C.navy });

    /* right panel content is rendered as a separate frame below */
    var f2 = frame({
      h: 300, xMin: 0, xMax: 0.14, yMin: 0, yMax: 12,
      xLabel: "票息率 c（期限固定 10 年）", yLabel: "麦考利久期（年）",
      xTicks: [{ v: 0, l: "0%" }, { v: 0.03, l: "3%" }, { v: 0.06, l: "6%" }, { v: 0.09, l: "9%" }, { v: 0.12, l: "12%" }],
      yTicks: [{ v: 0, l: "0" }, { v: 4, l: "4" }, { v: 6, l: "6" }, { v: 8, l: "8" }, { v: 10, l: "10" }]
    });
    var s2 = f2.svg;
    var cs2 = [], c;
    for (c = 0; c <= 0.1201; c += 0.03) {
      cs2.push([f2.sx(c), f2.sy(macDur(10, c, 0.06))]);
    }
    s2 += path(cs2.map(function (p, k) { return (k ? "L" : "M") + n(p[0]) + "," + n(p[1]); }).join(" "), { stroke: C.amber, w: 3 });
    cs2.forEach(function (p) { s2 += dot(p[0], p[1], 4.5, { fill: C.amber }); });
    s2 += txt(340, f2.capY + 2, "期限固定时票息越高，现金流回本越快，久期越短 → 利率风险越小", { size: 10.5, weight: 600, fill: C.navy });

    return wrap(f1.H + f2.H + 20, s1 + "<g transform='translate(0," + (f1.H + 6) + ")'>" + s2 + "</g>");
  };

  /* ---------- 16. Duration approximation error ---------- */
  FIG.durationApprox = function () {
    var s = "";
    var f = frame({
      h: 316, xMin: 0.03, xMax: 0.07, yMin: 960, yMax: 1045,
      xLabel: "到期收益率 YTM", yLabel: "债券价格 Price ($)",
      xTicks: [{ v: 0.035, l: "3.5%" }, { v: 0.045, l: "4.5%" }, { v: 0.05, l: "5.0%" }, { v: 0.055, l: "5.5%" }, { v: 0.065, l: "6.5%" }],
      yTicks: [{ v: 970, l: "970" }, { v: 990, l: "990" }, { v: 1000, l: "1000" }, { v: 1010, l: "1010" }, { v: 1030, l: "1030" }]
    });
    s += f.svg;
    function P(y) { return 50 / (1 + y) + 1050 / Math.pow(1 + y, 2); }
    var pts = [], i, y;
    for (i = 0; i <= 50; i++) {
      y = 0.035 + (0.065 - 0.035) * i / 50;
      pts.push([f.sx(y), f.sy(P(y))]);
    }
    s += path(pts.map(function (p, k) { return (k ? "L" : "M") + n(p[0]) + "," + n(p[1]); }).join(" "), { stroke: C.blue, w: 2.8 });

    var y0 = 0.05, p0 = P(0.05);
    var h = 0.0002, slope = (P(y0 + h) - P(y0 - h)) / (2 * h);
    function tan(y) { return p0 + slope * (y - y0); }
    s += line(f.sx(0.038), f.sy(tan(0.038)), f.sx(0.062), f.sy(tan(0.062)), { stroke: C.amber, w: 2, dash: "6 4" });
    s += dot(f.sx(y0), f.sy(p0), 5.5, { fill: C.navy });
    s += txt(f.sx(y0) - 12, f.sy(p0) - 10, "y=5%，P=$1,000", { anchor: "end", size: 10, weight: 700, fill: C.navy });

    var y1 = 0.055;
    s += line(f.sx(y1), f.sy(P(y1)), f.sx(y1), f.sy(tan(y1)), { stroke: C.red, w: 2 });
    s += dot(f.sx(y1), f.sy(P(y1)), 4.5, { fill: C.blue });
    s += dot(f.sx(y1), f.sy(tan(y1)), 4.5, { fill: C.amber });
    s += txt(f.sx(y1) + 12, f.sy(P(y1)) + 4, "真实 $990.77", { anchor: "start", size: 10, weight: 700, fill: C.blue });
    s += txt(f.sx(y1) + 12, f.sy(tan(y1)) - 8, "估计 $990.70", { anchor: "start", size: 10, weight: 700, fill: C.amber });
    s += txt(f.sx(y1) + 12, f.sy(tan(y1)) + 12, "误差仅 $0.07（凸性修正）", { anchor: "start", size: 9.5, fill: C.muted });
    s += legend([{ label: "真实价格", color: C.blue }, { label: "久期近似", color: C.amber, dash: "6 4" }], f.L + 4, 24);
    s += txt(340, f.capY + 4, "ΔP/P ≈ −D_mod × Δy：Δy 越小越准；大幅变动必须补凸性项", { size: 11, weight: 600, fill: C.navy });
    return wrap(f.H + 10, s);
  };

  /* ---------- 17. DDM timeline ---------- */
  FIG.ddmTimeline = function () {
    var s = "";
    s += txt(340, 24, "股利折现模型：从 D₁ 开始折现，终值在拐点处折回", { size: 12.5, weight: 700, fill: C.navy });
    var y0 = 110;
    s += line(60, y0, 620, y0, { stroke: C.axis, w: 1.6 });
    var xs = [110, 250, 390, 530];
    xs.forEach(function (x, i) {
      s += line(x, y0 - 7, x, y0 + 7, { stroke: C.navy, w: 1.6 });
      s += txt(x, y0 + 24, ["t=0", "t=1", "t=2", "t=3 …"][i], { size: 11, fill: C.navy, weight: 600 });
      s += arrow(x, y0 - 12, x, y0 - 46, { stroke: C.blue, w: 1.8 });
    });
    var labels = ["买入 P₀ = ?", "D₁", "D₂", "D₃ 起以 g 永续增长"];
    var fills = [C.navy, C.blueSoft, C.blueSoft, C.greenSoft];
    var cols = ["#fff", C.blue, C.blue, C.green];
    var strokes = [C.navy, C.blueLine, C.blueLine, C.greenLine];
    xs.forEach(function (x, i) {
      s += rect(x - 62, y0 - 84, 124, 36, { fill: fills[i], stroke: strokes[i], rx: 6 });
      var sz = fitSize(labels[i], 116, 10.8);
      s += txt(x, y0 - 62, labels[i], { size: sz, fill: cols[i], weight: 700 });
    });
    /* terminal value box */
    s += rect(420, y0 + 34, 220, 44, { fill: C.purpleSoft, stroke: C.purpleLine, rx: 8 });
    s += txt(530, y0 + 54, "终值 TV₂ = D₃ /(r − g)", { size: 11.5, weight: 700, fill: C.purple });
    s += txt(530, y0 + 72, "位于 t=2，需再折现 2 期", { size: 10, fill: C.muted });
    s += arrow(500, y0 + 34, 400, y0 + 10, { stroke: C.purple, w: 1.6, dash: "4 3" });

    s += rect(60, y0 + 96, 580, 62, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(340, y0 + 118, "固定增长：P₀ = D₁ /(r − g)，其中 D₁ = D₀(1+g)", { size: 12.5, weight: 700, fill: C.navy });
    s += txt(340, y0 + 138, "必须用「下一期」股利；r 必须严格大于 g，否则分母为负 / 级数不收敛", { size: 10.8, fill: C.ink });
    s += txt(340, y0 + 154, "由价格反解：r = D₁/P₀ + g（股利收益率 + 增长率）", { size: 10.8, fill: C.muted });
    return wrap(300, s);
  };

  /* ---------- 18. CAPM / SML ---------- */
  FIG.sml = function () {
    var s = "";
    var f = frame({
      h: 316, xMin: 0, xMax: 2.0, yMin: 0, yMax: 16,
      xLabel: "Beta β（系统性风险暴露）", yLabel: "期望收益 E(r) (%)",
      xTicks: [{ v: 0, l: "0" }, { v: 0.5, l: "0.5" }, { v: 1.0, l: "1.0" }, { v: 1.5, l: "1.5" }, { v: 2.0, l: "2.0" }],
      yTicks: [{ v: 0, l: "0" }, { v: 3, l: "3" }, { v: 6, l: "6" }, { v: 9, l: "9" }, { v: 12, l: "12" }, { v: 15, l: "15" }]
    });
    s += f.svg;
    /* SML: E(r) = 3 + beta*(8-3) */
    s += line(f.sx(0), f.sy(3), f.sx(1.9), f.sy(3 + 1.9 * 5), { stroke: C.blue, w: 2.8 });
    s += txt(f.sx(1.9) - 6, f.sy(3 + 1.9 * 5) - 10, "SML", { anchor: "end", size: 12, weight: 700, fill: C.blue });
    /* rf marker */
    s += dot(f.sx(0), f.sy(3), 5, { fill: C.navy });
    s += txt(f.sx(0) + 8, f.sy(3) + 16, "r_f = 3%", { anchor: "start", size: 10.5, weight: 700, fill: C.navy });
    /* market point */
    s += dot(f.sx(1), f.sy(8), 5, { fill: C.green });
    s += txt(f.sx(1) + 10, f.sy(8) - 8, "市场组合 E(r_M)=8%", { anchor: "start", size: 10.5, weight: 700, fill: C.green });
    /* stock C */
    s += dot(f.sx(1.2), f.sy(3 + 1.2 * 5), 5, { fill: C.amber });
    s += txt(f.sx(1.2) + 10, f.sy(3 + 1.2 * 5) + 14, "β=1.2 → 9.00%", { anchor: "start", size: 10.5, weight: 700, fill: C.amber });
    /* above/below SML */
    s += dot(f.sx(0.8), f.sy(9.2), 5, { fill: C.purple });
    s += txt(f.sx(0.8) - 10, f.sy(9.2) - 8, "SML 上方 = 正 alpha（低估）", { anchor: "end", size: 9.8, fill: C.purple });
    s += line(f.sx(0.8), f.sy(9.2), f.sx(0.8), f.sy(3 + 0.8 * 5), { stroke: C.purple, w: 1.4, dash: "4 3" });

    s += rect(f.L, f.capY - 10, 570, 34, { fill: C.amberSoft, stroke: C.amberLine, rx: 7 });
    s += txt(f.L + 12, f.capY + 8, "CAPM 只对 beta（系统性风险）给溢价；个体波动可通过分散化消除，不获溢价", { anchor: "start", size: 10.8, weight: 600, fill: C.amber });
    return wrap(f.H + 20, s);
  };

  /* ---------- 19. Factor model ---------- */
  FIG.factorModel = function () {
    var s = "";
    s += txt(340, 24, "Fama-French 三因子 + 动量：把收益拆解成因子暴露 × 因子溢价", { size: 12.5, weight: 700, fill: C.navy });
    var facs = [
      { t: "MKTRF", d: "市场收益 − 无风险利率", c: C.blue, f: C.blueSoft, l: C.blueLine, b: "b_M = 1.1" },
      { t: "SMB", d: "Small minus Big（规模）", c: C.green, f: C.greenSoft, l: C.greenLine, b: "b_S = 0.5" },
      { t: "HML", d: "High minus Low B/M（价值）", c: C.purple, f: C.purpleSoft, l: C.purpleLine, b: "b_H = −0.2" },
      { t: "MOM", d: "Momentum（动量，课件提及）", c: C.amber, f: C.amberSoft, l: C.amberLine, b: "近期赢家 − 近期输家" }
    ];
    facs.forEach(function (k, i) {
      var x = 20 + i * 165, w = 152;
      s += rect(x, 42, w, 96, { fill: k.f, stroke: k.l, rx: 9 });
      s += txt(x + w / 2, 64, k.t, { size: 13, weight: 700, fill: k.c });
      var ds = fitSize(k.d, w - 12, 9.8);
      s += txt(x + w / 2, 84, k.d, { size: ds, fill: C.ink });
      s += line(x + 12, 92, x + w - 12, 92, { stroke: k.l, w: 1 });
      var bs = fitSize(k.b, w - 12, 10.5);
      s += txt(x + w / 2, 112, k.b, { size: bs, weight: 700, fill: k.c });
      s += txt(x + w / 2, 128, "", { size: 9 });
    });
    s += rect(20, 152, 640, 40, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(340, 172, "r − r_f = α + b_M·MKTRF + b_S·SMB + b_H·HML + ε", { size: 13, weight: 700, fill: C.navy });
    s += txt(340, 188, "共同因子 = 跨资产共享的收益时间序列；账面市值比 = 公司特征，用于构造因子组合", { size: 10, fill: C.muted });

    s += rect(20, 200, 640, 62, { fill: C.purpleSoft, stroke: C.purpleLine, rx: 8 });
    s += txt(340, 220, "CAPM 回归出现正 alpha，加入规模与价值因子后 alpha ≈ 0", { size: 11.5, weight: 700, fill: C.purple });
    s += txt(340, 238, "说明此前的 alpha 由因子暴露解释，而非管理能力；注意仍需统计检验才能断言", { size: 10.5, fill: C.ink });
    s += txt(340, 256, "SMB 载荷为正 = 偏小盘；HML 载荷为负 = 偏成长风格", { size: 10.5, fill: C.muted });
    return wrap(278, s);
  };

  /* ---------- 20. Money multiplier ---------- */
  FIG.moneyMultiplier = function () {
    var s = "";
    s += txt(340, 24, "存款创造：每一轮贷款都变成下一家银行的存款（准备金率 10%）", { size: 12.5, weight: 700, fill: C.navy });
    var rounds = [
      { r: "第 1 家", d: "100", rr: "10", l: "90" },
      { r: "第 2 家", d: "90", rr: "9", l: "81" },
      { r: "第 3 家", d: "81", rr: "8.1", l: "72.9" },
      { r: "…", d: "…", rr: "…", l: "…" }
    ];
    var colX = [30, 180, 300, 420, 540];
    var colW = [140, 110, 110, 110, 110];
    var headY = 46;
    s += rect(colX[0], headY, colW[0], 30, { fill: C.navy, stroke: C.navy, rx: 5 });
    s += txt(colX[0] + colW[0] / 2, headY + 20, "银行 / 轮次", { size: 11.5, weight: 700, fill: "#fff" });
    ["新增存款", "法定准备金", "可放贷款"].forEach(function (h, i) {
      s += rect(colX[i + 1], headY, colW[i + 1], 30, { fill: C.navy, stroke: C.navy, rx: 5 });
      s += txt(colX[i + 1] + colW[i + 1] / 2, headY + 20, h, { size: 11.5, weight: 700, fill: "#fff" });
    });
    rounds.forEach(function (r, i) {
      var y = 84 + i * 34;
      var fill = i === 3 ? C.graySoft : (i % 2 ? "#fff" : C.blueSoft);
      s += rect(colX[0], y, colW[0], 30, { fill: fill, stroke: C.grid, rx: 5 });
      s += txt(colX[0] + colW[0] / 2, y + 20, r.r, { size: 11, weight: 600, fill: C.ink });
      [r.d, r.rr, r.l].forEach(function (v, j) {
        s += rect(colX[j + 1], y, colW[j + 1], 30, { fill: fill, stroke: C.grid, rx: 5 });
        s += txt(colX[j + 1] + colW[j + 1] / 2, y + 20, v, { size: 11, fill: C.ink });
      });
      if (i < 3) s += arrow(colX[3] + colW[3] + 6, y + 15, colX[0] + colW[0] - 4, y + 42, { stroke: C.green, w: 1.6, dash: "4 3" });
    });
    s += txt(470, 214, "贷款 → 支出 → 再存款", { size: 9.6, fill: C.green });
    s += rect(20, 222, 640, 60, { fill: C.amberSoft, stroke: C.amberLine, rx: 8 });
    s += txt(340, 242, "最大存款增量 = 初始准备金 ÷ 准备金率 = 100 ÷ 0.10 = 1,000（百万）", { size: 12, weight: 700, fill: C.amber });
    s += txt(340, 262, "最大贷款增量 = 1,000 − 100 = 900（百万）；准备金率 20% 时存款增量降为 500", { size: 10.8, fill: C.ink });
    s += txt(340, 278, "现金漏损与超额准备金持有都会让实际倍数小于理论值", { size: 10.2, fill: C.muted });
    return wrap(298, s);
  };

  /* ---------- 21. Policy transmission ---------- */
  FIG.policyTransmission = function () {
    var s = "";
    s += txt(340, 24, "货币政策传导链：工具 → 准备金 → 利率与信贷 → 实体活动", { size: 12.5, weight: 700, fill: C.navy });
    var chain = [
      ["政策工具", "OMO / 贴现率 / RRR", C.blue, C.blueSoft, C.blueLine],
      ["银行准备金", "增减储备金余额", C.green, C.greenSoft, C.greenLine],
      ["短期利率与信贷", "放贷能力与资金价格", C.purple, C.purpleSoft, C.purpleLine],
      ["支出与投资", "消费、资本开支", C.amber, C.amberSoft, C.amberLine],
      ["产出与通胀", "双重使命的两端", C.red, C.redSoft, C.redLine]
    ];
    chain.forEach(function (c, i) {
      var x = 16 + i * 132, w = 124;
      s += rect(x, 44, w, 62, { fill: c[3], stroke: c[4], rx: 8 });
      var ts = fitSize(c[0], w - 10, 12);
      s += txt(x + w / 2, 68, c[0], { size: ts, weight: 700, fill: c[2] });
      var ds = fitSize(c[1], w - 10, 9.8);
      s += txt(x + w / 2, 90, c[1], { size: ds, fill: C.ink });
      if (i < chain.length - 1) s += arrow(x + w + 2, 75, x + 128, 75, { stroke: C.gray, w: 2 });
    });
    /* contractionary branch */
    s += rect(16, 122, 644, 74, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(32, 144, "三个收缩方向（课件框架）", { anchor: "start", size: 11.5, weight: 700, fill: C.navy });
    var items = [
      ["公开市场卖出", "回笼准备金"],
      ["提高贴现率", "央行借款变贵"],
      ["提高法定准备金率", "同样准备金放贷更少"]
    ];
    items.forEach(function (it, i) {
      var x = 32 + i * 208;
      s += band(x, 154, 192, 30, it[0], { fill: C.redSoft, stroke: C.redLine, color: C.red, size: 10.8 });
      s += txt(x + 96, 194, it[1], { size: 10, fill: C.muted });
    });
    /* lender of last resort */
    s += rect(16, 204, 644, 58, { fill: C.greenSoft, stroke: C.greenLine, rx: 8 });
    s += txt(340, 224, "最后贷款人 Lender of Last Resort", { size: 12, weight: 700, fill: C.green });
    s += txt(340, 244, "流动性短缺 = 到期付不出钱（可用借款过渡）；资不抵债 = 资产不足以偿付负债（借款无法解决）", { size: 10.4, fill: C.ink });
    s += txt(340, 260, "贴现窗：央行 → 机构；联邦基金：机构 → 机构（通常隔夜、无抵押）", { size: 10.2, fill: C.muted });
    return wrap(278, s);
  };

  /* ---------- 22. Interest rate corridor ---------- */
  FIG.rateCorridor = function () {
    var s = "";
    s += txt(340, 24, "利率走廊：上下限设施把市场利率夹在政策利率附近", { size: 13, weight: 700, fill: C.navy });
    var f = frame({
      h: 300, xMin: 1.4, xMax: 3.0, yMin: 0, yMax: 100,
      xLabel: "利率 (%)", yLabel: "",
      xTicks: [{ v: 1.6, l: "1.6" }, { v: 1.8, l: "1.8" }, { v: 2.0, l: "2.0" }, { v: 2.2, l: "2.2" }, { v: 2.4, l: "2.4" }, { v: 2.6, l: "2.6" }, { v: 2.8, l: "2.8" }],
      yTicks: []
    });
    var s2 = f.svg;
    /* corridor band */
    s2 += rect(f.sx(1.80), f.T + 6, f.sx(2.50) - f.sx(1.80), f.B - f.T - 6, { fill: C.greenSoft, stroke: C.greenLine, rx: 6 });
    /* floor line */
    s2 += line(f.sx(1.80), f.T, f.sx(1.80), f.B, { stroke: C.green, w: 2.4 });
    s2 += txt(f.sx(1.80) - 6, f.T + 18, "下限 1.80%", { anchor: "end", size: 10.5, weight: 700, fill: C.green });
    s2 += txt(f.sx(1.80) - 6, f.T + 32, "隔夜逆回购", { anchor: "end", size: 9.5, fill: C.muted });
    /* ceiling line */
    s2 += line(f.sx(2.50), f.T, f.sx(2.50), f.B, { stroke: C.red, w: 2.4 });
    s2 += txt(f.sx(2.50) + 6, f.T + 18, "上限 2.50%", { anchor: "start", size: 10.5, weight: 700, fill: C.red });
    s2 += txt(f.sx(2.50) + 6, f.T + 32, "隔夜回购 / SLF", { anchor: "start", size: 9.5, fill: C.muted });
    /* policy rate */
    s2 += line(f.sx(2.00), f.T, f.sx(2.00), f.B, { stroke: C.navy, w: 2.4, dash: "6 4" });
    s2 += txt(f.sx(2.00), f.T - 8, "政策利率 2.00%", { size: 10.5, weight: 700, fill: C.navy });
    s2 += txt(f.sx(2.00), f.T - 22, "7 天逆回购", { size: 9.5, fill: C.muted });
    /* width annotation */
    s2 += biArrow(f.sx(1.80), f.B - 24, f.sx(2.50), f.B - 24, { stroke: C.purple, w: 1.8 });
    s2 += txt((f.sx(1.80) + f.sx(2.50)) / 2, f.B - 32, "走廊宽度 70 bp", { size: 11, weight: 700, fill: C.purple });
    /* mechanism labels inside band */
    s2 += txt((f.sx(1.80) + f.sx(2.00)) / 2, (f.T + f.B) / 2 - 10, "机构可把钱", { size: 9.6, fill: C.muted });
    s2 += txt((f.sx(1.80) + f.sx(2.00)) / 2, (f.T + f.B) / 2 + 12, "放给央行", { size: 9.6, fill: C.muted });
    s2 += txt((f.sx(2.00) + f.sx(2.50)) / 2, (f.T + f.B) / 2 - 10, "机构可向", { size: 9.6, fill: C.muted });
    s2 += txt((f.sx(2.00) + f.sx(2.50)) / 2, (f.T + f.B) / 2 + 12, "央行借钱", { size: 9.6, fill: C.muted });
    s2 += txt(340, f.capY + 2, "合格机构 + 足够抵押品 ⇒ 市场利率难以越出走廊上下限", { size: 11, weight: 600, fill: C.navy });
    return wrap(f.H + 6, s2);
  };

  /* ---------- 23. Money market yield conventions ---------- */
  FIG.yieldQuotes = function () {
    var s = "";
    s += txt(340, 22, "四种货币市场报价：同一笔收益，四种算法 → 数值依次递增", { size: 12.5, weight: 700, fill: C.navy });
    var rows = [
      { n: "持有期回报 HPR", fml: "(F − P) / P", v: 1.2146, c: C.gray, f: C.graySoft, l: C.grid, note: "90 天实际赚到的回报率" },
      { n: "折现收益率 r_D", fml: "(D/F) × 360/n", v: 4.80, c: C.blue, f: C.blueSoft, l: C.blueLine, note: "分母用面值 → 数值最小" },
      { n: "单利收益率 SPY", fml: "(D/P) × 360/n", v: 4.86, c: C.green, f: C.greenSoft, l: C.greenLine, note: "分母用投资额" },
      { n: "债券等价收益率 BEY", fml: "(D/P) × 365/n", v: 4.93, c: C.purple, f: C.purpleSoft, l: C.purpleLine, note: "365 天线性年化" },
      { n: "实际年化收益率 EAR", fml: "(1+HPR)^(365/n) − 1", v: 5.02, c: C.amber, f: C.amberSoft, l: C.amberLine, note: "复利年化 → 数值最大" }
    ];
    rows.forEach(function (r, i) {
      var y = 40 + i * 42;
      s += rect(24, y, 632, 36, { fill: r.f, stroke: r.l, rx: 7 });
      s += txt(38, y + 23, r.n, { anchor: "start", size: 11.5, weight: 700, fill: r.c });
      s += txt(196, y + 23, r.fml, { anchor: "start", size: 11, fill: C.ink });
      s += txt(400, y + 23, "= " + r.v.toFixed(r.v < 2 ? 4 : 2) + "%", { anchor: "start", size: 11.5, weight: 700, fill: r.c });
      s += txt(486, y + 23, r.note, { anchor: "start", size: 10, fill: C.muted });
    });
    s += rect(24, 254, 632, 52, { fill: C.redSoft, stroke: C.redLine, rx: 8 });
    s += txt(340, 274, "折现与单利报价用 360 天；BEY 与 EAR 用 365 天", { size: 11.5, weight: 700, fill: C.red });
    s += txt(340, 294, "报价年化率 ≠ 90 天实际赚到的钱；实现 EAR 需要持续的再投资机会", { size: 10.4, fill: C.ink });
    return wrap(318, s);
  };

  /* ---------- 24. Repo cash flows ---------- */
  FIG.repoFlow = function () {
    var s = "";
    s += txt(340, 24, "回购 Repo：一笔有抵押的融资，两个方向、两个名字", { size: 13, weight: 700, fill: C.navy });
    /* panel 1: central bank reverse repo (inject) */
    s += rect(20, 40, 310, 130, { fill: C.greenSoft, stroke: C.greenLine, rx: 9 });
    s += txt(175, 60, "央行逆回购（投放流动性）", { size: 11.5, weight: 700, fill: C.green });
    s += box(38, 72, 120, 40, "央行", "", { fill: "#fff", stroke: C.green });
    s += box(196, 72, 120, 40, "交易商", "", { fill: "#fff", stroke: C.green });
    s += arrow(158, 84, 194, 84, { stroke: C.green });
    s += txt(176, 78, "现金", { size: 9.5, fill: C.green });
    s += arrow(194, 100, 158, 100, { stroke: C.green, dash: "4 3" });
    s += txt(176, 121, "证券（抵押）", { size: 9.5, fill: C.green });
    s += txt(175, 140, "今天：央行买入并约定卖回", { size: 10, fill: C.muted });
    s += txt(175, 158, "到期不续做 → 收回流动性", { size: 10, fill: C.red });

    /* panel 2: central bank repo (drain) */
    s += rect(350, 40, 310, 130, { fill: C.redSoft, stroke: C.redLine, rx: 9 });
    s += txt(505, 60, "央行正回购（回笼流动性）", { size: 11.5, weight: 700, fill: C.red });
    s += box(368, 72, 120, 40, "央行", "", { fill: "#fff", stroke: C.red });
    s += box(526, 72, 120, 40, "交易商", "", { fill: "#fff", stroke: C.red });
    s += arrow(526, 84, 490, 84, { stroke: C.red });
    s += txt(508, 78, "现金", { size: 9.5, fill: C.red });
    s += arrow(490, 100, 526, 100, { stroke: C.red, dash: "4 3" });
    s += txt(508, 121, "证券（抵押）", { size: 9.5, fill: C.red });
    s += txt(505, 140, "今天：央行卖出并约定买回", { size: 10, fill: C.muted });
    s += txt(505, 158, "到期 → 归还流动性", { size: 10, fill: C.green });

    s += rect(20, 180, 640, 76, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(340, 200, "同一笔交易：资金融出方记为逆回购，资金融入方记为回购", { size: 11.5, weight: 700, fill: C.navy });
    s += txt(340, 220, "联邦基金：无抵押、隔夜、机构之间拆借准备金；回购：有抵押", { size: 10.6, fill: C.ink });
    s += txt(340, 238, "折减率 haircut = 融资金额低于抵押品市值，提供缓冲但不消除全部损失风险", { size: 10.4, fill: C.muted });
    s += txt(340, 252, "（违约、抵押品价格变动、变现困难仍可能造成损失）", { size: 9.8, fill: C.muted });
    return wrap(272, s);
  };

  /* ---------- 25. Treasury bill auction ---------- */
  FIG.billAuction = function () {
    var s = "";
    s += txt(340, 24, "单一价格拍卖：按折现收益率由低到高排序，全部中标者付同一价格", { size: 12, weight: 700, fill: C.navy });
    var bids = [
      { who: "A", amt: "30", y: "3.80%", acc: "全额 30", c: C.green },
      { who: "B", amt: "40", y: "3.90%", acc: "全额 40", c: C.green },
      { who: "C", amt: "50", y: "4.00%", acc: "部分 30", c: C.amber },
      { who: "D", amt: "20", y: "4.10%", acc: "未中标 0", c: C.red }
    ];
    var cw = [70, 110, 110, 130];
    var cx = [34, 104, 214, 324];
    ["投标人", "申报面值", "折现收益率", "分配结果"].forEach(function (h, i) {
      s += rect(cx[i], 44, cw[i], 28, { fill: C.navy, stroke: C.navy, rx: 5 });
      s += txt(cx[i] + cw[i] / 2, 63, h, { size: 11, weight: 700, fill: "#fff" });
    });
    bids.forEach(function (b, i) {
      var y = 80 + i * 32;
      s += rect(cx[0], y, cw[0], 28, { fill: b.c === C.red ? C.redSoft : "#fff", stroke: C.grid, rx: 5 });
      s += txt(cx[0] + cw[0] / 2, y + 19, b.who, { size: 11.5, weight: 700, fill: b.c });
      s += rect(cx[1], y, cw[1], 28, { fill: "#fff", stroke: C.grid, rx: 5 });
      s += txt(cx[1] + cw[1] / 2, y + 19, "$" + b.amt + " M", { size: 11, fill: C.ink });
      s += rect(cx[2], y, cw[2], 28, { fill: "#fff", stroke: C.grid, rx: 5 });
      s += txt(cx[2] + cw[2] / 2, y + 19, b.y, { size: 11, weight: 700, fill: C.ink });
      s += rect(cx[3], y, cw[3], 28, { fill: b.c === C.amber ? C.amberSoft : (b.c === C.red ? C.redSoft : C.greenSoft), stroke: C.grid, rx: 5 });
      s += txt(cx[3] + cw[3] / 2, y + 19, b.acc, { size: 11, weight: 700, fill: b.c });
    });
    /* stop-out marker */
    s += txt(470, 92, "← stop-out 4.00%", { anchor: "start", size: 10, weight: 700, fill: C.amber });
    /* right column: allocation math */
    s += rect(470, 110, 190, 118, { fill: C.blueSoft, stroke: C.blueLine, rx: 8 });
    s += txt(565, 130, "分配测算", { size: 11.5, weight: 700, fill: C.blue });
    s += txt(478, 150, "发行总额 $120 M", { anchor: "start", size: 10.4, fill: C.ink });
    s += txt(478, 168, "非竞争 $20 M（优先）", { anchor: "start", size: 10.4, fill: C.ink });
    s += txt(478, 186, "竞争性可用 $100 M", { anchor: "start", size: 10.4, fill: C.ink });
    s += txt(478, 204, "共同价格 = $99.00 / $100", { anchor: "start", size: 10.4, weight: 700, fill: C.blue });
    s += txt(478, 222, "非竞争投标放弃报价权", { anchor: "start", size: 10, fill: C.muted });
    return wrap(244, s);
  };

  /* ---------- 26. Money market instrument spectrum ---------- */
  FIG.mmInstruments = function () {
    var s = "";
    s += txt(340, 24, "货币市场工具谱系：谁负责付款、有无银行担保、流动性如何", { size: 12.5, weight: 700, fill: C.navy });
    var ins = [
      { t: "国库券 T-bill", p: "财政部", g: "主权信用", liq: "极高", c: C.green, f: C.greenSoft, l: C.greenLine },
      { t: "回购 Repo", p: "证券卖方", g: "有抵押品", liq: "高（短端）", c: C.blue, f: C.blueSoft, l: C.blueLine },
      { t: "商业票据 CP", p: "发行企业", g: "通常无担保", liq: "二级市场有限", c: C.amber, f: C.amberSoft, l: C.amberLine },
      { t: "大额可转让 CD", p: "发行银行", g: "存款负债", liq: "可转让", c: C.purple, f: C.purpleSoft, l: C.purpleLine },
      { t: "银行承兑汇票 BA", p: "承兑银行", g: "银行担保", liq: "可贴现", c: C.red, f: C.redSoft, l: C.redLine },
      { t: "欧洲美元存款", p: "境外银行", g: "存款负债", liq: "视期限", c: C.navy, f: C.blueSoft, l: C.blueLine }
    ];
    ins.forEach(function (k, i) {
      var x = 20 + (i % 3) * 220, y = 42 + Math.floor(i / 3) * 96, w = 208, h = 84;
      s += rect(x, y, w, h, { fill: k.f, stroke: k.l, rx: 9 });
      var ts = fitSize(k.t, w - 12, 12);
      s += txt(x + w / 2, y + 20, k.t, { size: ts, weight: 700, fill: k.c });
      s += line(x + 12, y + 28, x + w - 12, y + 28, { stroke: k.l, w: 1 });
      s += txt(x + 12, y + 46, "付款义务：" + k.p, { anchor: "start", size: 10, fill: C.ink });
      s += txt(x + 12, y + 62, "担保 / 信用：" + k.g, { anchor: "start", size: 10, fill: C.ink });
      s += txt(x + 12, y + 78, "流动性：" + k.liq, { anchor: "start", size: 10, fill: C.muted });
    });
    s += rect(20, 236, 640, 46, { fill: C.amberSoft, stroke: C.amberLine, rx: 8 });
    s += txt(340, 256, "选择闲置资金工具时：先匹配期限，再看流动性，最后才比报价收益率", { size: 11.5, weight: 700, fill: C.amber });
    s += txt(340, 274, "欧洲美元 = 美国境外的美元存款，与欧元无关；LIBOR 退出后由 SOFR 接替", { size: 10.2, fill: C.ink });
    return wrap(296, s);
  };

  /* ---------- 27. CD timeline ---------- */
  FIG.cdTimeline = function () {
    var s = "";
    s += txt(340, 24, "大额可转让 CD：到期一次付息，二级市场价格与收益率反向", { size: 12.5, weight: 700, fill: C.navy });
    var y0 = 110;
    s += line(70, y0, 610, y0, { stroke: C.axis, w: 1.6 });
    var xs = [110, 400, 570];
    xs.forEach(function (x, i) {
      s += line(x, y0 - 7, x, y0 + 7, { stroke: C.navy, w: 1.6 });
      s += txt(x, y0 + 24, ["t=0 发行", "二级市场转手", "t=180 天到期"][i], { size: 11, fill: C.navy, weight: 600 });
    });
    s += rect(48, y0 - 82, 124, 36, { fill: C.blueSoft, stroke: C.blueLine, rx: 6 });
    s += txt(110, y0 - 60, "买入价 $1,000,000", { size: 10.6, weight: 700, fill: C.blue });
    s += rect(338, y0 - 82, 124, 36, { fill: C.amberSoft, stroke: C.amberLine, rx: 6 });
    s += txt(400, y0 - 60, "转手价 $995,000", { size: 10.6, weight: 700, fill: C.amber });
    s += rect(508, y0 - 82, 124, 36, { fill: C.greenSoft, stroke: C.greenLine, rx: 6 });
    s += txt(570, y0 - 60, "兑付 $1,020,000", { size: 10.6, weight: 700, fill: C.green });

    s += rect(70, y0 + 40, 540, 76, { fill: "#fff", stroke: C.grid, rx: 8 });
    s += txt(340, y0 + 60, "利息 = 1,000,000 × 4.00% × 180/360 = $20,000（360 天单利报价）", { size: 11.5, weight: 700, fill: C.navy });
    s += txt(340, y0 + 80, "原投资者：HPR = 2% → BEY 4.06% ，EAR 4.10%（365 天年化）", { size: 10.6, fill: C.ink });
    s += txt(340, y0 + 98, "新买家：HPR = (1,020,000 − 995,000)/995,000 = 2.51% → 报价 5.03%", { size: 10.6, fill: C.amber });
    s += txt(340, y0 + 112, "价格越低 → 每美元投资的收益越大 → 收益率越高（反向关系）", { size: 10, fill: C.muted });
    return wrap(250, s);
  };

  /* ---------- 28. China bond market structure ---------- */
  FIG.chinaBondMarket = function () {
    var s = "";
    s += txt(340, 24, "中国债券市场：银行间（批发）与交易所（零售 + 机构）并行", { size: 12.5, weight: 700, fill: C.navy });
    s += box(250, 42, 180, 40, "中国债券市场", "", { fill: C.navy, color: "#fff", stroke: C.navy });
    s += box(40, 112, 280, 62, "银行间市场 Interbank", "机构为主 · 单笔规模大 · OTC 询价", { fill: C.blueSoft, stroke: C.blue });
    s += box(360, 112, 280, 62, "交易所市场 Exchange", "证券账户参与 · 单笔较小 · 竞价撮合", { fill: C.greenSoft, stroke: C.green });
    s += arrow(320, 66, 180, 110, { stroke: C.gray });
    s += arrow(360, 66, 490, 110, { stroke: C.gray });
    /* instruments row */
    s += txt(340, 196, "主要券种与发行主体", { size: 11.5, weight: 700, fill: C.navy });
    var kinds = [
      ["国债", "财政部", C.green, C.greenSoft, C.greenLine],
      ["地方政府债", "省级政府", C.blue, C.blueSoft, C.blueLine],
      ["政策性金融债", "三大政策性银行", C.purple, C.purpleSoft, C.purpleLine],
      ["同业存单 NCD", "商业银行", C.amber, C.amberSoft, C.amberLine],
      ["企业信用债", "非金融企业", C.red, C.redSoft, C.redLine]
    ];
    kinds.forEach(function (k, i) {
      var x = 20 + i * 132, w = 124;
      s += rect(x, 206, w, 54, { fill: k[3], stroke: k[4], rx: 7 });
      s += txt(x + w / 2, 226, k[0], { size: 11.5, weight: 700, fill: k[2] });
      s += txt(x + w / 2, 246, k[1], { size: 10, fill: C.ink });
    });
    s += rect(20, 270, 640, 44, { fill: C.amberSoft, stroke: C.amberLine, rx: 8 });
    s += txt(340, 290, "买断式买入 vs 回购：前者转移所有权，后者是有抵押融资并约定卖回", { size: 11.5, weight: 700, fill: C.amber });
    s += txt(340, 308, "短期融资券 CP / 超短融 SCP（≤1 年）与中期票据 MTN 都依赖发行人自身信用", { size: 10.2, fill: C.ink });
    return wrap(330, s);
  };

  /* ============================================================
     Renderer
     ============================================================ */
  function renderAll() {
    var nodes = document.querySelectorAll("[data-fig]");
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-fig");
      var fn = FIG[key];
      if (!fn) { el.innerHTML = "<p class='muted'>（缺少图形：" + key + "）</p>"; return; }
      var cap = el.getAttribute("data-cap") || "";
      var src = el.getAttribute("data-src") || "";
      el.className = "figure";
      el.innerHTML = "<div class='fig-canvas'>" + fn() + "</div>" +
        (cap ? "<div class='fig-cap'><b>Figure.</b> " + esc(cap) +
          (src ? " <span class='fig-src'>Source: " + esc(src) + "</span>" : "") + "</div>" : "");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }

  window.Figures = FIG;
})();
