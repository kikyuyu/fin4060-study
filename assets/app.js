/* ============================================================
   FIN 4060 Study Site — navigation + TOC
   ============================================================ */
(function () {
  "use strict";

  // ---- Site map (single source of truth for navigation) ----
  var SITE = [
    { group: null, items: [
      { id: "index", file: "index.html", label: "课程总览", sub: "Syllabus & Roadmap" }
    ]},
    { group: "Part 1 · 市场与机构", items: [
      { id: "part1", file: "part1-markets-institutions.html", label: "Part 1 市场与机构", sub: "一级/二级市场 · 货币/资本市场 · 金融机构 · 风险" }
    ]},
    { group: "Part 2 · 中国市场", items: [
      { id: "part2", file: "part2-china-markets.html", label: "Part 2 中国市场", sub: "A/B 股 · QFII/QDII · 互联互通 · 杠杆与股灾 · 债市" }
    ]},
    { group: "Part 3 · 利率决定", items: [
      { id: "part3", file: "part3-interest-rates.html", label: "Part 3 利率决定", sub: "货币时间价值 · 可贷资金 · 费雪效应 · 风险溢价" }
    ]},
    { group: "Part 4 · 期限结构", items: [
      { id: "part4", file: "part4-term-structure.html", label: "Part 4 期限结构", sub: "收益率曲线 · 预期理论 · 流动性溢价 · 远期利率" }
    ]},
    { group: "Part 5 · 债券估值", items: [
      { id: "part5", file: "part5-bond-valuation.html", label: "Part 5 债券估值", sub: "现金流折现 · YTM · 溢价折价 · 付息频率 · 浮息债" }
    ]},
    { group: "Part 6 · 债券风险", items: [
      { id: "part6", file: "part6-bond-risk.html", label: "Part 6 债券风险", sub: "Malkiel 五定理 · 久期 · 凸性 · 价格敏感性" }
    ]},
    { group: "Part 7 · 股票估值", items: [
      { id: "part7", file: "part7-equity-valuation.html", label: "Part 7 股票估值", sub: "相对估值 P/E · DDM · CAPM · Fama-French 三因子" }
    ]},
    { group: "Part 8 · 货币政策", items: [
      { id: "part8", file: "part8-monetary-policy.html", label: "Part 8 货币政策", sub: "美联储 · 公开市场操作 · 存款创造 · FOMC 公告" }
    ]},
    { group: "Part 9 · 中国货币政策", items: [
      { id: "part9", file: "part9-monetary-policy-china.html", label: "Part 9 中国货币政策", sub: "央行目标 · MLF/SLF/PSL · 利率走廊 · 数量与价格工具" }
    ]},
    { group: "Part 10 · 货币市场", items: [
      { id: "part10", file: "part10-money-markets.html", label: "Part 10 货币市场", sub: "收益率报价惯例 · 国库券 · 回购 · 商票 · CD · BA" }
    ]}
  ];

  var EN_MAP = {
    "index": "Overview",
    "part1": "Markets & Institutions",
    "part2": "Markets in China",
    "part3": "Determinants of Rates",
    "part4": "Term Structure",
    "part5": "Bond Valuation",
    "part6": "Bond Risk",
    "part7": "Equity Valuation",
    "part8": "Monetary Policy",
    "part9": "PBOC Policy",
    "part10": "Money Markets"
  };

  var current = document.body.getAttribute("data-page") || "";
  var root = document.body.getAttribute("data-root") || "";

  // ---- Build top bar ----
  function buildTopbar() {
    var host = document.getElementById("site-topbar");
    if (!host) return;

    var navLinks = SITE.map(function (g) {
      return g.items.map(function (it) {
        var active = it.id === current ? " active" : "";
        return '<a class="' + active.trim() + '" href="' + root + it.file + '">' + it.label + '</a>';
      }).join("");
    }).join("");

    var panel = SITE.map(function (g) {
      var label = g.group
        ? '<div class="group-label">' + g.group + '</div>'
        : '<div class="group-label">开始</div>';
      var links = g.items.map(function (it) {
        var active = it.id === current ? " active" : "";
        return '<a class="' + active.trim() + '" href="' + root + it.file + '">' +
          it.label + '<span class="sub">' + it.sub + '</span></a>';
      }).join("");
      return label + links;
    }).join("");

    host.className = "topbar";
    host.innerHTML =
      '<div class="topbar-inner">' +
        '<a class="brand" href="' + root + 'index.html">' +
          '<span class="logo">4060</span>' +
          '<span>FIN 4060 学习站<small>Financial Markets in China and the World · CUHK-Shenzhen</small></span>' +
        '</a>' +
        '<nav class="topnav">' + navLinks + '</nav>' +
        '<span class="spacer"></span>' +
        '<div class="dropdown" id="themeDD">' +
          '<button type="button" aria-haspopup="true" aria-expanded="false">' +
            '主题选择 · ' + (EN_MAP[current] || "Navigate") + ' <span class="caret">▼</span>' +
          '</button>' +
          '<div class="dropdown-panel">' + panel + '</div>' +
        '</div>' +
      '</div>';

    var dd = document.getElementById("themeDD");
    var btn = dd.querySelector("button");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", dd.classList.contains("open") ? "true" : "false");
    });
    document.addEventListener("click", function () { dd.classList.remove("open"); });
  }

  // ---- Build TOC from headings ----
  function buildTOC() {
    var host = document.getElementById("site-toc");
    var main = document.querySelector("main");
    if (!host || !main) return;

    var heads = main.querySelectorAll("h2.sec, h3.sub");
    if (!heads.length) { host.style.display = "none"; return; }

    var html = '<h4>本页目录</h4>';
    var list = [];
    Array.prototype.forEach.call(heads, function (h, i) {
      if (!h.id) h.id = "sec-" + i;
      var cls = h.tagName === "H3" ? ' class="lvl2"' : "";
      var label = h.getAttribute("data-short") || h.textContent.replace(/¶|Section|§/g, "").trim();
      html += '<a href="#' + h.id + '"' + cls + '>' + label + '</a>';
      list.push(h);
    });
    host.innerHTML = html;

    // scroll-spy
    var links = host.querySelectorAll("a");
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY + 130;
        var activeIdx = -1;
        for (var i = 0; i < list.length; i++) {
          if (list[i].offsetTop <= y) activeIdx = i;
        }
        links.forEach(function (a, i) { a.classList.toggle("active", i === activeIdx); });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Back to top ----
  function buildTop() {
    var b = document.createElement("button");
    b.className = "totop";
    b.title = "回到顶部";
    b.innerHTML = "↑";
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.body.appendChild(b);
    window.addEventListener("scroll", function () {
      b.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
  }

  // ---- Auto-generate exercise numbering per group ----
  function numberExercises() {
    var groups = document.querySelectorAll("[data-exgroup]");
    Array.prototype.forEach.call(groups, function (g) {
      var ex = g.querySelectorAll(".exercise[data-ex]");
      Array.prototype.forEach.call(ex, function (e, i) {
        var tag = e.querySelector(".ex-title .num");
        if (tag) tag.textContent = (i + 1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildTopbar();
    buildTOC();
    buildTop();
    numberExercises();
  });
})();
