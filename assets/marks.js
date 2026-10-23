/* ============================================================
   FIN 4210 — 划重点（可多标签）+ 行内笔记（文字/图片）+ 阅读进度
   - 选中任意文字：4 色高亮 + 多选标签 + 备注（文字/图片）
   - 在正文任意一行右键 → 添加笔记 → 该行下方留下 📓 记号
   - 悬浮或按住左键 → 显示笔记详情；移开/松开 → 隐藏
   - 「我的标记」面板：划重点 / 笔记 / 阅读进度 三个页签，点击可跳转
   - 全部保存在 localStorage（同浏览器，无服务器）
   ============================================================ */
(function () {
  "use strict";

  var KEY = "fin4060-marks-v1";
  // NOTE: this script is loaded from <head>, so document.body is still null at
  // this point. Resolve PAGE lazily inside boot(), once the DOM exists.
  var PAGE = "index";
  var PAGE_LABEL = {
    index: "课程总览",
    part1: "Part 1 资产定价",
    part2: "Part 2 资本结构",
    part3: "Part 3 股利政策",
    part4: "Part 4 资本预算",
    part5: "Part 5 专题"
  };
  var COLORS = [
    { k: "yellow", n: "黄色", c: "#fde68a" },
    { k: "green", n: "绿色", c: "#a7f3d0" },
    { k: "pink", n: "粉色", c: "#fbcfe8" },
    { k: "blue", n: "蓝色", c: "#bfdbfe" }
  ];
  var PRESET_TAGS = ["重点", "疑问", "考前看", "例题", "易错"];

  /* Anything listed here never enters the highlight-offset coordinate system,
       so inserting UI (chips / menus / editors) can't shift existing highlights. */
  var SKIP = "script,style,svg,textarea,input,select,button,.mm-root,.mm-head," +
    ".marks-ui,.mark-popup,.marks-panel,.marks-fab," +
    ".note-chip,.note-editor,.note-bubble,.ctx-menu,.hl-ignore";
  /* Blocks a line-note can attach to (innermost matching block wins). */
  var NOTE_SEL = "p,li,dd,dt,td,th,blockquote,h2,h3,h4,h5,.formula";
  /* Skip list used when locating note anchors. IMPORTANT: unlike SKIP it must
     NOT contain "svg" — MathJax renders every formula as <svg>, and those are
     real page content, not UI. Excluding svg here meant a right-click on (or
     near) any formula silently produced no menu. */
  var NOTE_SKIP = ".mm-root,.mm-head,.marks-ui,.mark-popup,.marks-panel,.marks-fab," +
    ".note-editor,.note-bubble,.ctx-menu,.hl-ignore";
  var MAX_IMG_W = 900;

  /* ---------------- storage ---------------- */
  var DB = { marks: {}, bookmarks: {}, progress: {}, notes: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      DB.marks = p.marks || {};
      DB.bookmarks = p.bookmarks || {};
      DB.progress = p.progress || {};
      DB.notes = p.notes || {};
    }
  } catch (e) { /* ignore corrupt data */ }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(DB)); }
      catch (e) {
        alert("保存失败：本地存储空间可能已满（图片笔记占用较大）。\n请删除部分笔记后再试。");
      }
      refreshBadge();
    }, 120);
  }

  /* ---------------- generic helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function mainEl() { return document.querySelector("main"); }
  function fmtTime(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  /* Only accept data:image URLs we generated ourselves. */
  function safeImg(src) {
    return typeof src === "string" &&
      /^data:image\/(png|jpe?g|gif|webp|bmp|svg\+xml);base64,/i.test(src);
  }
  function snippet(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    return s.length > n ? s.slice(0, n) + "\u2026" : s;
  }
  function each(list, fn) {
    Array.prototype.forEach.call(list || [], fn);
  }
  /* Render a note's body: text (line breaks kept) + any attached images. */
  function noteBodyHTML(n) {
    var s = "";
    if (n.text) {
      s += "<div class='nb-text'>" + esc(n.text).replace(/\n/g, "<br>") + "</div>";
    }
    var imgs = (n.imgs || []).filter(safeImg);
    if (imgs.length) {
      s += "<div class='nb-imgs'>" + imgs.map(function (u) {
        return "<img class='nb-img' src='" + esc(u) + "' alt='笔记图片'>";
      }).join("") + "</div>";
    }
    return s || "<div class='nb-text muted'>（空笔记，点「编辑」补充内容）</div>";
  }
  function mk(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function nodeEl(node) {
    return node && node.nodeType === 3 ? node.parentElement : node;
  }
  function inUI(node) {
    var el = nodeEl(node);
    return !!(el && el.closest && el.closest(
      ".marks-panel,.mark-popup,.marks-fab,.note-editor,.note-bubble,.ctx-menu,.hl-ignore"));
  }

  /* Collect text nodes that participate in the highlight coordinate system.
     MathJax renders formulas as <svg> (no text), so it never shifts offsets. */
  function textNodes(root) {
    var out = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.length) continue;
      var p = n.parentElement;
      if (!p) continue;
      if (p.closest && p.closest(SKIP)) continue;
      out.push(n);
    }
    return out;
  }

  function selectionToOffsets(sel) {
    var m = mainEl();
    if (!m || sel.rangeCount === 0) return null;
    var r = sel.getRangeAt(0);
    if (r.collapsed) return null;
    if (!m.contains(r.commonAncestorContainer)) return null;
    var nodes = textNodes(m), pos = 0, start = -1, end = -1, i, len;
    for (i = 0; i < nodes.length; i++) {
      len = nodes[i].nodeValue.length;
      if (nodes[i] === r.startContainer) start = pos + r.startOffset;
      if (nodes[i] === r.endContainer) { end = pos + r.endOffset; break; }
      pos += len;
    }
    if (start < 0 || end < 0 || end <= start) return null;
    return { start: start, end: end, text: r.toString() };
  }

  function applyHighlight(h) {
    var m = mainEl();
    if (!m) return;
    var nodes = textNodes(m), pos = 0, spans = [], i, len;
    for (i = 0; i < nodes.length; i++) {
      len = nodes[i].nodeValue.length;
      var s = Math.max(h.start, pos), e = Math.min(h.end, pos + len);
      if (s < e) spans.push({ node: nodes[i], s: s - pos, e: e - pos });
      pos += len;
    }
    spans.forEach(function (sp) {
      var n = sp.node;
      try {
        if (sp.e < n.nodeValue.length) n.splitText(sp.e);
        if (sp.s > 0) n = n.splitText(sp.s);
      var mk = document.createElement("mark");
      mk.className = "hl hl-" + (h.color || "yellow");
      mk.setAttribute("data-hid", h.id);
      n.parentNode.insertBefore(mk, n);
      mk.appendChild(n);
      } catch (e) { /* ignore nodes that changed meanwhile */ }
    });
  }

  function marks(page) { return DB.marks[page] || (DB.marks[page] = []); }
  function notes(page) { return DB.notes[page] || (DB.notes[page] = []); }

  function renderAll() {
    var m = mainEl();
    if (!m) return;
    // unwrap existing marks first so re-rendering is idempotent
    each(m.querySelectorAll("mark.hl"), function (mk) {
      var p = mk.parentNode;
      while (mk.firstChild) p.insertBefore(mk.firstChild, mk);
      p.removeChild(mk);
    });
    m.normalize();
    DB.marks[PAGE] = DB.marks[PAGE] || [];
    DB.marks[PAGE].forEach(applyHighlight);
    renderNotes();
  }

  /* ---------------- line-note anchor model ----------------
     A note is anchored to the index of a "noteable" block element
     (p / li / td / h2–h5 / .formula …) inside <main>. The index is
     recomputed deterministically on every render, so it stays valid as
     long as the static markup doesn't change. Inserted chips carry
     .hl-ignore, so they never disturb the highlight offset system. */
  function noteableEls() {
    var m = mainEl();
    if (!m) return [];
    var all = Array.prototype.slice.call(m.querySelectorAll(NOTE_SEL));
    return all.filter(function (el) {
      if (!el.textContent || !el.textContent.trim()) return false;
      if (el.closest(NOTE_SKIP)) return false;
      for (var i = 0; i < all.length; i++) {
        if (all[i] !== el && el.contains(all[i])) return false;
    }
    return true;
  });
  }

  function noteableFrom(node) {
    var el = nodeEl(node);
    if (!el) return null;
    var m = mainEl();
    if (!m || !m.contains(el)) return null;
    if (el.closest(NOTE_SKIP)) return null;
    /* Walk up to the nearest noteable block. Deliberately does NOT stop at
       <svg>: MathJax renders every formula as <svg>, so a right-click on a
       displayed equation must still resolve to its containing paragraph. */
    var p = el;
    while (p && p !== m) {
      if (p.matches && p.matches(NOTE_SEL)) return p;
      p = p.parentElement;
    }
    return null;
  }

  function noteIdxOf(el) { return noteableEls().indexOf(el); }

  /* Resolve the note-anchor block for the current text selection. */
  function noteableFromSelection() {
    try {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { return null; }
      return noteableFrom(sel.getRangeAt(0).commonAncestorContainer);
    } catch (e) { return null; }
  }

  function notesAt(page, idx) {
    return (DB.notes[page] || []).filter(function (n) { return n.anchorIdx === idx; });
  }

  function findNote(page, id) {
    var r = null;
    (DB.notes[page] || []).forEach(function (n) { if (n.id === id) r = n; });
    return r;
  }

  function deleteNote(page, id) {
    DB.notes[page] = (DB.notes[page] || []).filter(function (n) { return n.id !== id; });
    save(); renderNotes(); refreshPanel();
  }

  /* Remove every previously injected chip, then re-create one per note. */
  function renderNotes() {
    var m = mainEl();
    if (!m) return;
    each(m.querySelectorAll(".note-chip"), function (c) {
      if (c.parentNode) c.parentNode.removeChild(c);
    });
    var els = noteableEls();
    each(DB.notes[PAGE] || [], function (n) {
      var el = els[n.anchorIdx];
      if (!el) return;
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "note-chip hl-ignore";
      chip.setAttribute("data-note-id", n.id);
      chip.title = "笔记（悬浮或按住左键查看，松开隐藏）";
      chip.innerHTML = "<span class='nc-ico'>\uD83D\uDCD3</span>";
      if (el.nextSibling) el.parentNode.insertBefore(chip, el.nextSibling);
      else el.parentNode.appendChild(chip);
      chip.addEventListener("mouseenter", function () { showBubble(chip); });
      chip.addEventListener("mouseleave", function () { if (!bubbleHold) hideBubble(); });
      chip.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      bubbleHold = true;
      showBubble(chip);
      });
    });
  }

  function jumpToNote(page, id) {
    var chip = document.querySelector('.note-chip[data-note-id="' + id + '"]');
    if (!chip) return;
    try { chip.scrollIntoView({ behavior: "smooth", block: "center" }); }
    catch (e) { chip.scrollIntoView(); }
    chip.classList.add("note-flash");
    setTimeout(function () { chip.classList.remove("note-flash"); }, 1800);
    showBubble(chip);
    clearTimeout(jumpToNote._t);
    jumpToNote._t = setTimeout(function () {
      if (bubble && bubble._chip === chip) hideBubble();
    }, 3400);
  }

  function jumpToHighlight(id) {
    var mk = document.querySelector('mark[data-hid="' + id + '"]');
    if (!mk) return false;
    try { mk.scrollIntoView({ behavior: "smooth", block: "center" }); }
    catch (e) { mk.scrollIntoView(); }
    mk.classList.add("hl-flash");
    setTimeout(function () { mk.classList.remove("hl-flash"); }, 1600);
    return true;
  }

  /* ---------------- UI elements & state ---------------- */
  var fab, panel, popup, menu, bubble, editorBox;
  var edState = null;   /* live state while the editor popup is open */
  var edHandle = null;  /* { read(), repaint() } from mountEditor */
  /* Draft for a highlight being created. Kept OUTSIDE the DOM so a re-render
     (e.g. a stray mouseup) can never wipe the user's colour / tag choices. */
  var draft = null;
  var bubbleHold = false;
  var editingId = null;
  var menuIdx = null, menuPx = 0, menuPy = 0;

  function buildUI() {
    fab = mk("button", "marks-fab hl-ignore");
    fab.innerHTML = "<span class='mf-ico'>\uD83D\uDD16</span><span class='mf-txt'>我的标记</span><span class='mf-badge'>0</span>";
    fab.addEventListener("click", togglePanel);
    document.body.appendChild(fab);

    panel = mk("div", "marks-panel hl-ignore");
    document.body.appendChild(panel);

    popup = mk("div", "mark-popup hl-ignore");
    document.body.appendChild(popup);

    menu = mk("div", "ctx-menu hl-ignore");
    document.body.appendChild(menu);

    bubble = mk("div", "note-bubble hl-ignore");
    document.body.appendChild(bubble);

    editorBox = mk("div", "note-editor hl-ignore");
    document.body.appendChild(editorBox);
  }

  function countAll() {
    var n = 0;
    Object.keys(DB.marks).forEach(function (k) { n += (DB.marks[k] || []).length; });
    Object.keys(DB.bookmarks).forEach(function (k) { n += (DB.bookmarks[k] || []).length; });
    Object.keys(DB.notes).forEach(function (k) { n += (DB.notes[k] || []).length; });
    return n;
  }
  function refreshBadge() {
    if (!fab) return;
    var b = fab.querySelector(".mf-badge");
    if (b) { var c = countAll(); b.textContent = c; b.style.display = c ? "" : "none"; }
  }
  function refreshPanel() {
    if (panel && panel.classList.contains("open")) panel.innerHTML = panelHTML();
  }

  /* ---------------- note pane: 文字 / 图片 两种输入模式 ----------------
     Renders the editor into `container`, bound to live state `st`. */
  function mountEditor(container, st) {
    if (!st.mode) st.mode = "text";
    if (!st.placeholder) st.placeholder = "写下你的笔记…";
    if (!st.imgs) st.imgs = [];

    function sync() {
      var ta = container.querySelector(".ne-text");
      if (ta) st.text = ta.value;
    }

    function paint() {
      sync();
      var thumbs = st.imgs.filter(safeImg).map(function (u, i) {
        var img = "<img src='" + esc(u) + "' alt=''>";
        var rm = "<button type='button' class='ne-rm' data-i='" + i + "' title='移除'>✕</button>";
        return "<span class='ne-thumb'>" + img + rm + "</span>";
      }).join("");
      var s = "<div class='ne-modes'>" +
        "<button type='button' class='ne-mode" + (st.mode === "text" ? " on" : "") + "' data-m='text'>文字</button>" +
        "<button type='button' class='ne-mode" + (st.mode === "img" ? " on" : "") + "' data-m='img'>图片</button>" +
        "</div>";
      if (st.mode === "img") {
        s += "<div class='ne-imgbox'>" +
          "<label class='ne-add'>🖼 选择图片" +
          "<input type='file' class='ne-file' accept='image/*' multiple hidden></label>" +
          "<div class='ne-imgs'>" + thumbs + "</div>" +
          "<div class='ne-tip'>可直接 Ctrl / ⌘ + V 粘贴剪贴板中的图片</div></div>";
      } else {
        s += "<textarea class='ne-text' placeholder='" + esc(st.placeholder) + "'>" +
          esc(st.text || "") + "</textarea>";
      }
      container.innerHTML = s;
      bindPane();
    }

    function bindPane() {
      each(container.querySelectorAll(".ne-mode"), function (b) {
        b.addEventListener("click", function () {
          sync();                                  /* keep what was typed */
          st.mode = b.getAttribute("data-m");
          paint();
        });
      });
      var fi = container.querySelector(".ne-file");
      if (fi) {
        fi.addEventListener("change", function (e) {
          pushFiles(st, e.target.files, paint);
          e.target.value = "";
        });
      }
      each(container.querySelectorAll(".ne-rm"), function (b) {
        b.addEventListener("click", function () {
          sync();
          st.imgs.splice(Number(b.getAttribute("data-i")), 1);
          paint();
        });
      });
      var ta = container.querySelector(".ne-text");
      if (ta) {
        ta.addEventListener("paste", function (e) {
          var items = e.clipboardData && e.clipboardData.items;
          if (!items) return;
          var files = [];
          each(items, function (it) {
            if (it.kind === "file") {
              var f = it.getAsFile();
              if (f && /^image\//.test(f.type)) files.push(f);
            }
          });
          if (files.length) { e.preventDefault(); st.text = ta.value; pushFiles(st, files, paint); }
        });
      }
    }

    paint();
    return {
      repaint: paint,
      read: function () {
        sync();
        return { text: String(st.text || "").trim(), imgs: st.imgs.slice() };
      }
    };
  }

  function pushFiles(st, files, redraw) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) {
      return f && /^image\//.test(f.type);
    });
    if (!list.length) return;
    var pending = list.length;
    list.forEach(function (f) {
      var fr = new FileReader();
      fr.onload = function () {
        shrinkImage(String(fr.result), MAX_IMG_W, function (out) {
          if (!st) return;                        /* editor closed meanwhile */
          st.imgs.push(out);
          if (--pending === 0 && redraw) redraw();
        });
      };
      fr.onerror = function () { if (--pending === 0 && redraw) redraw(); };
      fr.readAsDataURL(f);
    });
  }

  /* Downscale a dataURL image so a note with several photos still fits
     in the ~5 MB localStorage budget. */
  function shrinkImage(dataUrl, maxW, cb) {
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.width, h = img.height;
          if (!w || !h || w <= maxW) { cb(dataUrl); return; }
          var nh = Math.round(h * maxW / w);
          var cv = document.createElement("canvas");
          cv.width = maxW; cv.height = nh;
          var ctx = cv.getContext("2d");
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, maxW, nh);
          ctx.drawImage(img, 0, 0, maxW, nh);
          cb(cv.toDataURL("image/jpeg", 0.82));
        } catch (e) { cb(dataUrl); }
      };
      img.onerror = function () { cb(dataUrl); };
      img.src = dataUrl;
    } catch (e) { cb(dataUrl); }
  }

  /* Build the popup shell, mount the note pane, then wire the shared controls.
     cfg = { title, text, imgs, color, tags, withColor, withTags,
            x, y, onSave(data, color, tags), onDelete } */
  function openBox(cfg) {
    closeBox();
    edState = {
      title: cfg.title || "笔记",
      text: cfg.text || "",
      imgs: (cfg.imgs || []).filter(safeImg).slice(),
      mode: "text",
      placeholder: cfg.placeholder || "写下你的笔记…",
      color: cfg.color || "yellow",
      tags: (cfg.tags || []).slice(),
      withColor: !!cfg.withColor,
      withTags: !!cfg.withTags,
      noteButton: !!cfg.noteButton,
      onSave: cfg.onSave || function () {},
      onDelete: cfg.onDelete || null,
      onNote: cfg.onNote || null
    };
    var st = edState;

    var box = mk("div", "note-editor hl-ignore");
    editorBox = box;
    document.body.appendChild(box);

    paintBox();                       /* renders shell + mounts the note pane */

    /* reveal before measuring, so offsetWidth/offsetHeight are real */
    box.style.display = "block";

    // shared actions
    box.querySelector(".mt-cancel").addEventListener("click", function () { closeBox(); });
    var nb2 = box.querySelector(".mt-note2");
    if (nb2 && st.onNote) {
      nb2.addEventListener("click", function () {
        var d = edHandle.read();
        var color = st.color, tags = st.tags.slice();
        closeBox();
        st.onNote(d, color, tags);
      });
    }
    var dv = box.querySelector(".mt-del");
    if (dv && st.onDelete) {
      dv.addEventListener("click", function () { closeBox(); st.onDelete(); });
    }
    box.querySelector(".mt-save").addEventListener("click", function () {
      var d = edHandle.read();
      var color = st.color, tags = st.tags.slice();
      closeBox();
      st.onSave(d, color, tags);
    });

    var vw = document.documentElement.clientWidth;
    var bw = box.offsetWidth || 340, bh = box.offsetHeight || 280;
    var left = Math.min(Math.max(10, cfg.x - bw / 2), Math.max(10, vw - bw - 10));
    var top = cfg.y + 14;
    var maxTop = window.scrollY + document.documentElement.clientHeight - bh - 12;
    if (top > maxTop) top = Math.max(12, maxTop);
    if (top < 12) top = 12;
    box.style.left = left + "px";
    box.style.top = top + "px";

    var ta2 = box.querySelector(".ne-text");
    /* preventScroll: opening the editor (and the implicit focus) must NOT
       scroll the long page. Without this, the browser scrolls so the focused
       textarea is in view — which on a scrolled-down page feels like the
       page "jumps to the top" right after you finish a highlight. */
    if (ta2) { try { ta2.focus({ preventScroll: true }); } catch (e) { try { ta2.focus(); } catch (_) {} } }
  }

  function paintBox() {
    var st = edState, box = editorBox;
    if (!box || !st) return;

    var s = "<div class='ne-head'>" + esc(st.title) + "</div>";

    if (st.withColor) {
      s += "<div class='mt-row'><span class='mt-lbl'>颜色</span>" +
        COLORS.map(function (c) {
          return "<button type='button' class='mt-color" + (st.color === c.k ? " on" : "") +
            "' data-color='" + c.k + "' style='background:" + c.c + "' title='" + c.n + "'></button>";
        }).join("") + "</div>";
    }

    if (st.withTags) {
      s += "<div class='mt-row'><span class='mt-lbl'>标签</span>" +
        PRESET_TAGS.map(function (t) {
          return "<button type='button' class='mt-tag" + (st.tags.indexOf(t) >= 0 ? " on" : "") +
            "' data-tag='" + esc(t) + "'>" + esc(t) + "</button>";
        }).join("") + "<span class='mt-hint'>可多选</span></div>";
    }

    /* 备注内容编辑器挂载点（文字 / 图片 两种模式） */
    s += "<div class='ne-mount'></div>";

    s += "<div class='ne-actions'>" +
      "<button type='button' class='mt-save'>保存</button>" +
      (st.noteButton ? "<button type='button' class='mt-note2' title='不开高亮，只在该行下方留一个 📓 记号'>📓 存为笔记</button>" : "") +
      (st.onDelete ? "<button type='button' class='mt-del'>删除</button>" : "") +
      "<button type='button' class='mt-cancel'>取消</button></div>";

    box.innerHTML = s;
    // keep the handle: save() needs read() to pull the textarea value back out
    edHandle = mountEditor(box.querySelector(".ne-mount"), st);

    /* 颜色 */
    each(box.querySelectorAll(".mt-color"), function (b) {
      b.addEventListener("click", function () {
        st.color = b.getAttribute("data-color");
        each(box.querySelectorAll(".mt-color"), function (x) { x.classList.remove("on"); });
      b.classList.add("on");
    });
  });

    /* 标签 —— 多选切换 */
    each(box.querySelectorAll(".mt-tag"), function (b) {
      b.addEventListener("click", function () {
        var tg = b.getAttribute("data-tag"), i = st.tags.indexOf(tg);
        if (i >= 0) st.tags.splice(i, 1); else st.tags.push(tg);
      b.classList.toggle("on", st.tags.indexOf(tg) >= 0);
    });
  });
  }

  function closeBox() {
    if (editorBox && editorBox.parentNode) editorBox.parentNode.removeChild(editorBox);
    editorBox = null; edState = null; edHandle = null;
  }

  /* ---------------- new highlight (from a text selection) ---------------- */
  function showToolbar(x, y, data) {
    // Same selection as before? Keep the pending colour / tag choices instead
    // of resetting them (the old bug: tags were wiped mid-selection).
    if (!draft || draft.start !== data.start || draft.end !== data.end) {
      // remember the paragraph this selection sits in, so the 📓 fallback
      // button can anchor a note to the same line
      draft = {
        start: data.start, end: data.end, text: data.text,
        color: "yellow", tags: [], note: { text: "", imgs: [] },
        anchorEl: noteableFromSelection()
      };
    }
    openBox({
      title: "新增划重点：颜色 / 标签 / 备注",
      text: draft.note.text,
      imgs: draft.note.imgs,
      color: draft.color,
      tags: draft.tags,
      placeholder: "备注（可选，支持图片）",
      withColor: true,
      withTags: true,
      noteButton: true,
      x: x + (window.scrollX || window.pageXOffset || 0),
      y: y + (window.scrollY || window.pageYOffset || 0),
      onNote: function (d) {
        var ael = draft.anchorEl;
        var idx = ael ? noteIdxOf(ael) : -1;
        if (idx < 0) { return; }
        notes(PAGE).push({
          id: uid(), anchorIdx: idx,
          anchorText: snippet(ael.textContent, 44),
          text: d.text, imgs: d.imgs, ts: Date.now()
        });
        save(); renderNotes(); refreshPanel(); draft = null;
        try { window.getSelection().removeAllRanges(); } catch (e) {}
      },
      onSave: function (d, color, tags) {
        DB.marks[PAGE] = DB.marks[PAGE] || [];
        DB.marks[PAGE].push({
          id: uid(), start: draft.start, end: draft.end, text: draft.text,
          color: color, tags: tags.slice(), note: d.text, noteImgs: d.imgs,
          ts: Date.now()
        });
        var sy = window.scrollY || window.pageYOffset || 0;
        save(); renderAll(); draft = null;
        try { window.scrollTo(0, sy); } catch (e) {}
        try { window.getSelection().removeAllRanges(); } catch (e) {}
      }
    });
  }
  /* A new highlight is now edited in the same unified popup as notes, so this
     only needs to discard the pending draft. */
  function hideToolbar() { draft = null; }

  /* ---------------- edit an existing highlight ---------------- */
  function showPopupFor(id, x, y) {
    var h = null;
    (DB.marks[PAGE] || []).forEach(function (o) { if (o.id === id) h = o; });
    if (!h) return;
    editingId = id;
    openBox({
      title: "编辑划重点：颜色 / 标签 / 备注",
      text: h.note || "",
      imgs: (h.noteImgs || []).slice(),
      color: h.color || "yellow",
      tags: (h.tags || []).slice(),
      placeholder: "备注（可选，支持图片）",
      withColor: true,
      withTags: true,
      x: x, y: y,
      onDelete: function () {
        DB.marks[PAGE] = (DB.marks[PAGE] || []).filter(function (o) { return o.id !== h.id; });
        var sy = window.scrollY || window.pageYOffset || 0;
        save(); renderAll(); refreshPanel();
        try { window.scrollTo(0, sy); } catch (e) {}
      },
      onSave: function (d, color, tags) {
        h.note = d.text; h.noteImgs = d.imgs;
        h.color = color; h.tags = tags.slice();
        var sy = window.scrollY || window.pageYOffset || 0;
        save(); renderAll(); refreshPanel();
        try { window.scrollTo(0, sy); } catch (e) {}
      }
    });
  }
  function hidePopup() { closeBox(); editingId = null; }

  /* ---------------- line-note editor ---------------- */
  function openLineNoteEditor(page, noteId, idx) {
    var n = noteId ? findNote(page, noteId) : null;
    var targetIdx = (idx != null) ? idx : (n ? n.anchorIdx : menuIdx);
    if (targetIdx == null || targetIdx < 0) return;
    openBox({
      title: n ? "编辑行内笔记" : "添加行内笔记",
      text: n ? (n.text || "") : "",
      imgs: ((n && n.imgs) || []).slice(),
      placeholder: "写下你的笔记…",
      withColor: false,
      withTags: false,
      x: menuPx, y: menuPy,
      onDelete: (n ? function () { deleteNote(page, noteId); } : null),
      onSave: function (d) {
        if (n) {
          n.text = d.text; n.imgs = d.imgs; n.ts = Date.now();
        } else {
          var el = noteableEls()[targetIdx];
          notes(page).push({
            id: uid(), anchorIdx: targetIdx,
            anchorText: el ? snippet(el.textContent, 44) : "",
            text: d.text, imgs: d.imgs, ts: Date.now()
          });
        }
        save(); renderNotes(); refreshPanel();
      }
    });
  }

  /* ---------------- note bubble (hidden detail) ---------------- */
  function showBubble(chip) {
    var n = findNote(PAGE, chip.getAttribute("data-note-id"));
    if (!n) return;
    var label = PAGE_LABEL[PAGE] || PAGE;
    bubble.innerHTML =
      "<div class='nb-head'>📓 笔记 · " + esc(label) + "</div>" +
      noteBodyHTML(n) +
      "<div class='nb-actions'><button type='button' class='nb-edit-btn'>✏️ 编辑</button></div>";
    bubble.style.display = "block";
    try {
      var r = chip.getBoundingClientRect();
      var bw = bubble.offsetWidth || 300;
      var left = r.right + 10;
      if (left + bw > document.documentElement.clientWidth - 10) {
        left = Math.max(10, r.left - bw - 10);
      }
      var top = r.top + window.scrollY;
      var maxTop = window.scrollY + document.documentElement.clientHeight - (bubble.offsetHeight || 150) - 12;
      if (top > maxTop) top = Math.max(12, maxTop);
      bubble.style.left = left + "px";
      bubble.style.top = top + "px";
    } catch (e) {}
    bubble._chip = chip;
    var eb = bubble.querySelector(".nb-edit-btn");
    if (eb) {
      eb.addEventListener("click", function () {
        hideBubble();
        openLineNoteEditor(PAGE, n.id, n.anchorIdx);
      });
    }
  }
  function hideBubble() { if (bubble) { bubble.style.display = "none"; bubble._chip = null; } }

  /* ---------------- right-click context menu ---------------- */
  function showMenu(px, py, idx) {
    var has = notesAt(PAGE, idx).length > 0;
    menu._idx = idx; menu._px = px; menu._py = py;
    menuIdx = idx; menuPx = px; menuPy = py;
    menu.innerHTML =
      "<button type='button' class='cm-item' data-act='add'>📝 添加笔记</button>" +
      (has ? "<button type='button' class='cm-item' data-act='edit'>✏️ 编辑本行笔记</button>" +
        "<button type='button' class='cm-item danger' data-act='del'>🗑 删除本行笔记</button>" : "");
    menu.style.display = "block";
    var vw = document.documentElement.clientWidth;
    menu.style.left = Math.min(px, Math.max(10, vw - 190 - 10)) + "px";
    menu.style.top = py + "px";
  }
  function hideMenu() { if (menu) menu.style.display = "none"; }

  /* ---------------- side panel ---------------- */
  function panelHTML() {
    var allTags = {};
    Object.keys(DB.marks).forEach(function (p) {
      (DB.marks[p] || []).forEach(function (h) {
        (h.tags || []).forEach(function (t) { allTags[t] = 1; });
    });
  });
  var tagList = Object.keys(allTags);
  var filter = panel._filter || "";
  var tab = panel._tab || "hl";

  var s = "<div class='mp-head'>" +
    "<h3>我的标记</h3>" +
    "<button type='button' class='mp-close' title='关闭'>✕</button></div>" +
    "<div class='mp-tabs'>" +
    "<button type='button' class='mp-tab" + (tab === "hl" ? " on" : "") + "' data-tab='hl'>划重点</button>" +
    "<button type='button' class='mp-tab" + (tab === "nt" ? " on" : "") + "' data-tab='nt'>笔记</button>" +
    "<button type='button' class='mp-tab" + (tab === "bm" ? " on" : "") + "' data-tab='bm'>阅读进度</button>" +
    "</div>" +
    "<div class='mp-body'>";

  if (tab === "hl") {
    if (tagList.length) {
      s += "<div class='mp-filters'><button type='button' class='mp-chip" + (filter === "" ? " on" : "") +
        "' data-tag=''>全部</button>";
      tagList.forEach(function (t) {
        s += "<button type='button' class='mp-chip" + (filter === t ? " on" : "") +
          "' data-tag='" + esc(t) + "'>" + esc(t) + "</button>";
      });
      s += "</div>";
    }
    var rows = [];
    Object.keys(DB.marks).forEach(function (p) {
      (DB.marks[p] || []).forEach(function (h) {
        if (filter && (h.tags || []).indexOf(filter) < 0) return;
        rows.push({ p: p, h: h });
      });
    });
    rows.sort(function (a, b) { return b.h.ts - a.h.ts; });
    if (!rows.length) {
      s += "<p class='mp-empty'>还没有划重点。<br>用鼠标选中任意文字，即可高亮、加标签和备注。</p>";
    } else {
      rows.forEach(function (r) {
        var h = r.h;
        var col = (COLORS.filter(function (c) { return c.k === h.color; })[0] || COLORS[0]).c;
        s += "<div class='mp-item' data-hid='" + h.id + "' data-page='" + r.p + "'>" +
          "<div class='mp-item-top'><span class='mp-dot' style='background:" + col + "'></span>" +
          "<span class='mp-page'>" + esc(PAGE_LABEL[r.p] || r.p) + "</span>" +
          "<span class='mp-time'>" + fmtTime(h.ts) + "</span>" +
          "<button type='button' class='mp-edit' title='编辑'>✏️</button>" +
          "<button type='button' class='mp-del' title='删除'>✕</button></div>" +
          "<div class='mp-quote'>" + esc(h.text) + "</div>";
        var tags = h.tags || [];
        if (tags.length) {
          s += "<div class='mp-tagrow'>" +
            tags.map(function (t) { return "<span class='mp-tag'>" + esc(t) + "</span>"; }).join("") +
            "</div>";
        }
        var note = h.note || "";
        var imgs = (h.noteImgs || []).filter(safeImg);
        if (note || imgs.length) {
          s += "<div class='mp-note'>" +
          (note ? "📝 " + esc(note).replace(/\n/g, "<br>") : "") +
          (imgs.length ? "<div class='mp-noteimgs'>" +
            imgs.map(function (u) {
              return "<img class='mp-noteimg' src='" + esc(u) + "' alt='备注图片'>";
            }).join("") + "</div>" : "") +
          "</div>";
        }
        s += "</div>";
      });
    }
  } else if (tab === "nt") {
    s += "<p class='mp-hint'>在正文任意一行上<strong>右键 → 添加笔记</strong>，该行下方就会出现一个 📓 记号。" +
      "鼠标移上去或按住左键即可查看，移开或松开自动隐藏。</p>";
    var nrows = [];
    Object.keys(DB.notes).forEach(function (p) {
      (DB.notes[p] || []).forEach(function (n) { nrows.push({ p: p, n: n }); });
    });
    nrows.sort(function (a, b) { return b.n.ts - a.n.ts; });
    if (!nrows.length) {
      s += "<p class='mp-empty'>还没有笔记。</p>";
    } else {
      nrows.forEach(function (r) {
        var n = r.n;
        s += "<div class='mp-item mp-noteitem' data-nid='" + n.id + "' data-page='" + r.p + "'>" +
          "<div class='mp-item-top'><span class='mp-dot' style='background:#a78bfa'></span>" +
          "<span class='mp-page'>" + esc(PAGE_LABEL[r.p] || r.p) + "</span>" +
          "<span class='mp-time'>" + fmtTime(n.ts) + "</span>" +
          "<button type='button' class='mp-edit-note' title='编辑'>✏️</button>" +
          "<span class='mp-ntag'>笔记</span>" +
          "<button type='button' class='mp-del-note' title='删除'>✕</button></div>";
        if (n.anchorText) s += "<div class='mp-anchor'>↳ " + esc(n.anchorText) + "</div>";
        s += noteBodyHTML(n);
        s += "</div>";
      });
    }
  } else {
    var prog = DB.progress || {};
    var pages = Object.keys(PAGE_LABEL);
    s += "<p class='mp-hint'>系统会自动记住你在每一页读到的位置，下次打开点一下就能接着看。</p>";
    pages.forEach(function (p) {
      var pr = prog[p];
      s += "<div class='mp-prog" + (pr ? "" : " none") + "' data-page='" + p + "'>" +
        "<div class='mp-prog-top'><b>" + esc(PAGE_LABEL[p]) + "</b>" +
        (pr ? "<span class='mp-time'>" + fmtTime(pr.ts) + "</span>"
           : "<span class='mp-time'>未开始</span>") +
        "</div>";
      if (pr) {
        s += "<div class='mp-bar'><i style='width:" + Math.round(pr.pct * 100) + "%'></i></div>" +
        "<div class='mp-prog-sec'>📍 " + esc(pr.section || "页首") + " · " +
        Math.round(pr.pct * 100) + "%</div>";
      }
      s += "</div>";
    });
    var bms = DB.bookmarks[PAGE] || [];
    s += "<div class='mp-sub'>本页书签 <button type='button' class='mp-addbm'>+ 在此处加书签</button></div>";
    if (!bms.length) {
      s += "<p class='mp-empty small'>还没有书签。点上面的按钮，可以标记「读到这里」。</p>";
    } else {
      bms.slice().sort(function (a, b) { return b.ts - a.ts; }).forEach(function (b) {
        s += "<div class='mp-item bm' data-bid='" + b.id + "'>" +
          "<div class='mp-item-top'><span class='mp-dot' style='background:#a78bfa'></span>" +
          "<span class='mp-page'>书签</span><span class='mp-time'>" + fmtTime(b.ts) + "</span>" +
          "<button type='button' class='mp-delbm' title='删除'>✕</button></div>" +
          "<div class='mp-quote'>📍 " + esc(b.section || "页首") + "</div>" +
          (b.note ? "<div class='mp-note'>📝 " + esc(b.note) + "</div>" : "") +
          "</div>";
      });
    }
  }

  s += "</div><div class='mp-foot'>" +
    "<button type='button' class='mp-act' data-act='export'>导出备份</button>" +
    "<button type='button' class='mp-act danger' data-act='clear'>清除全部</button>" +
    "</div>";
  return s;
  }

  function togglePanel() {
    var open = panel.classList.toggle("open");
    if (open) { panel.innerHTML = panelHTML(); }
  }

  /* ---------------- progress ---------------- */
  function currentSection() {
    var heads = document.querySelectorAll("main h2.sec, main h3.sub");
    var y = window.scrollY + 120, last = "";
    Array.prototype.forEach.call(heads, function (hd) {
      if (hd.offsetTop <= y) last = hd.getAttribute("data-short") || hd.textContent.replace(/\s+/g, " ").trim().slice(0, 30);
    });
    return last;
  }
  var progTimer = null;
  function trackProgress() {
    clearTimeout(progTimer);
    progTimer = setTimeout(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      DB.progress[PAGE] = { pct: pct, section: currentSection(), ts: Date.now() };
      save();
    }, 700);
  }

  /* ---------------- events ---------------- */
  function bind() {
    document.addEventListener("mouseup", function (e) {
      // A press inside our own UI must never re-create or reset the toolbar —
      // that was the bug that wiped tags while the user was picking them.
      if (inUI(e.target)) return;
      if (bubbleHold) { bubbleHold = false; hideBubble(); return; }
      setTimeout(function () {
        var sel = window.getSelection();
        var t = sel && sel.toString().trim();
        if (!t || t.length < 2) { return; }
        var off = selectionToOffsets(sel);
        if (!off) return;

        // Position the toolbar above the selection. getBoundingClientRect on a
        // Range is not available everywhere (and can throw), so fall back to the
        // pointer position instead of abandoning the highlight.
        var x = null, y = null;
        try {
          var r = sel.getRangeAt(0).getBoundingClientRect();
        if (r && (r.width || r.height || r.top)) {
          x = r.left + r.width / 2;
          y = r.top;
        }
        } catch (err) { /* no layout info available */ }
        if (x === null) {
          x = (e && typeof e.clientX === "number" && e.clientX) || window.innerWidth / 2;
        y = (e && typeof e.clientY === "number" && e.clientY) || 140;
        }
        showToolbar(x, y, off);
      }, 10);
    });

    document.addEventListener("mousedown", function (e) {
      if (inUI(e.target)) return;
      hideToolbar(); hidePopup(); hideMenu(); hideBubble();
    });

    document.addEventListener("contextmenu", function (e) {
      var t = e.target;
      var m = mainEl();
      if (!m || !m.contains(t)) { hideMenu(); return; }
      if (inUI(t)) { return; }             /* native menu inside our own UI */
      var el = noteableFrom(t);
      if (!el) { return; }
      e.preventDefault();
      hideBubble(); hideToolbar(); hidePopup();
      showMenu(e.clientX + (window.scrollX || 0),
      e.clientY + (window.scrollY || 0), noteIdxOf(el));
    });

    menu.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".cm-item") : null;
      if (!b) return;
      var idx = menu._idx, act = b.getAttribute("data-act");
      hideMenu();
      if (act === "add") {
        openLineNoteEditor(PAGE, null, idx);
      } else if (act === "edit") {
        var ex = notesAt(PAGE, idx);
        if (ex.length) openLineNoteEditor(PAGE, ex[ex.length - 1].id, idx);
      } else if (act === "del") {
        var list = notesAt(PAGE, idx);
        if (list.length && confirm("删除本行的 " + list.length + " 条笔记？")) {
          list.forEach(function (n) {
            DB.notes[PAGE] = (DB.notes[PAGE] || []).filter(function (o) { return o.id !== n.id; });
        });
        save(); renderNotes(); refreshPanel();
        }
      }
    });

    document.addEventListener("scroll", function () {
      trackProgress(); hideBubble(); hideMenu();
    }, { passive: true });

    document.addEventListener("click", function (e) {
      var mk = e.target.closest ? e.target.closest("mark.hl") : null;
      if (mk) {
        var r = mk.getBoundingClientRect();
        showPopupFor(mk.getAttribute("data-hid"), r.left + r.width / 2, r.bottom);
        return;
      }
      var chip = e.target.closest ? e.target.closest(".note-chip") : null;
      if (chip) showBubble(chip);
    });

    panel.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest(".mp-close")) { panel.classList.remove("open"); return; }
      var tab = t.closest(".mp-tab");
      if (tab) { panel._tab = tab.getAttribute("data-tab"); panel.innerHTML = panelHTML(); return; }
      var chipF = t.closest(".mp-chip");
      if (chipF) { panel._filter = chipF.getAttribute("data-tag"); panel.innerHTML = panelHTML(); return; }
      var del = t.closest(".mp-del");
      if (del) {
        var item = del.closest(".mp-item");
        var pg = item.getAttribute("data-page"), hid = item.getAttribute("data-hid");
        DB.marks[pg] = (DB.marks[pg] || []).filter(function (o) { return o.id !== hid; });
      save(); panel.innerHTML = panelHTML();
      if (pg === PAGE) renderAll();
      return;
      }
      var edt = t.closest(".mp-edit");
      if (edt) {
        var it0 = edt.closest(".mp-item");
        var p0 = it0.getAttribute("data-page"), h0 = it0.getAttribute("data-hid");
        if (p0 !== PAGE) { location.href = p0 + ".html?goto=" + h0 + "&edit=1"; return; }
      var h = null;
      (DB.marks[PAGE] || []).forEach(function (o) { if (o.id === h0) h = o; });
      if (h) {
        hideToolbar(); hidePopup();
        openHighlightEditor(h);
        panel.classList.remove("open");
      }
      return;
      }
      var delb = t.closest(".mp-delbm");
      if (delb) {
        var bid = delb.closest(".mp-item").getAttribute("data-bid");
        DB.bookmarks[PAGE] = (DB.bookmarks[PAGE] || []).filter(function (o) { return o.id !== bid; });
      save(); panel.innerHTML = panelHTML(); return;
      }
      var addbm = t.closest(".mp-addbm");
      if (addbm) {
        var nm = prompt("给这个书签起个名字（可留空）：", currentSection() || "读到这里");
        if (nm !== null) {
          DB.bookmarks[PAGE] = DB.bookmarks[PAGE] || [];
          DB.bookmarks[PAGE].push({
            id: uid(), section: currentSection() || "页首", note: nm.trim(),
          y: window.scrollY, ts: Date.now()
          });
          save(); panel.innerHTML = panelHTML();
        }
        return;
      }
      /* notes tab */
      var edn = t.closest(".mp-edit-note");
      if (edn) {
        var itn = edn.closest(".mp-noteitem");
        var pn = itn.getAttribute("data-page"), nid = itn.getAttribute("data-nid");
        panel.classList.remove("open");
        if (pn !== PAGE) { location.href = pn + ".html?note=" + nid + "&edit=1"; return; }
      var nn = findNote(PAGE, nid);
      if (nn) openLineNoteEditor(PAGE, nid, nn.anchorIdx);
      return;
      }
      var dln = t.closest(".mp-del-note");
      if (dln) {
        var itd = dln.closest(".mp-noteitem");
        var pd = itd.getAttribute("data-page"), nd = itd.getAttribute("data-nid");
        if (confirm("删除这条笔记？")) deleteNote(pd, nd);
        return;
      }
      var nit = t.closest(".mp-noteitem");
      if (nit && !t.closest("button")) {
        var pp = nit.getAttribute("data-page"), ni = nit.getAttribute("data-nid");
        panel.classList.remove("open");
        if (pp !== PAGE) { location.href = pp + ".html?note=" + ni; return; }
      jumpToNote(PAGE, ni);
      return;
      }
      /* jump to highlight */
      var it = t.closest(".mp-item[data-hid]");
      if (it && !t.closest("button")) {
        var p2 = it.getAttribute("data-page"), h2 = it.getAttribute("data-hid");
        if (p2 !== PAGE) { location.href = p2 + ".html?goto=" + h2; return; }
      jumpToHighlight(h2);
      panel.classList.remove("open");
      return;
      }
      /* jump to progress */
      var pg2 = t.closest(".mp-prog");
      if (pg2 && pg2.getAttribute("data-page")) {
        var target = pg2.getAttribute("data-page");
        if (target !== PAGE) { location.href = target + ".html?resume=1"; return; }
      var pr = DB.progress[target];
      if (pr) {
        var maxY = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: pr.pct * maxY, behavior: "smooth" });
        panel.classList.remove("open");
      }
      return;
      }
      var act = t.closest(".mp-act");
      if (act) {
        var a = act.getAttribute("data-act");
        if (a === "export") {
          var blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob), a2 = document.createElement("a");
        a2.href = url; a2.download = "fin4060-marks-backup.json"; a2.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } else if (a === "clear") {
          if (confirm("确定清除所有划重点、笔记、书签和阅读进度吗？此操作不可撤销。")) {
          DB.marks = {}; DB.bookmarks = {}; DB.progress = {}; DB.notes = {};
          save(); renderAll(); refreshPanel();
          }
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "m" || e.key === "M") {
        var tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        togglePanel();
      }
      if (e.key === "Escape") {
        hideToolbar(); hidePopup(); hideMenu(); hideBubble();
        panel.classList.remove("open");
      }
    });
  }

  /* ---------------- deep links (?goto= / ?resume=1 / ?note=) ---------------- */
  function handleQuery() {
    var q = new URLSearchParams(location.search);
    var goto = q.get("goto"), resume = q.get("resume"), note = q.get("note");
    if (note) {
      var t2 = 0;
      (function wait() {
        var chip = document.querySelector('.note-chip[data-note-id="' + note + '"]');
        if (chip) {
          jumpToNote(PAGE, note);
          if (q.get("edit")) {
            var nn = findNote(PAGE, note);
            if (nn) { hideBubble(); openLineNoteEditor(PAGE, note, nn.anchorIdx); }
          }
        } else if (t2++ < 40) setTimeout(wait, 120);
      })();
      return;
    }
    if (goto) {
      var tries = 0;
      (function wait() {
        if (jumpToHighlight(goto)) {
          if (q.get("edit")) {
            var h = null;
            (DB.marks[PAGE] || []).forEach(function (o) { if (o.id === goto) h = o; });
            if (h) { editingId = goto; openHighlightEditor(h); }
          }
        } else if (tries++ < 40) setTimeout(wait, 120);
      })();
    } else if (resume) {
      var pr = DB.progress[PAGE];
      if (pr) {
        setTimeout(function () {
          var maxY = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: pr.pct * maxY });
        }, 300);
      }
    }
  }

  /* ---------------- init ---------------- */
  function boot() {
    PAGE = (document.body && document.body.getAttribute("data-page")) || "index";
    buildUI();
    bind();
    renderAll();
    refreshBadge();
    handleQuery();
    trackProgress();
  }

  /* Wait until MathJax has typeset the page, so text-node offsets are stable.
     IMPORTANT: never block forever — if MathJax is slow or fails to load
     (e.g. offline and the CDN unreachable), we still boot after a cap. */
  function waitForMathJax(cb) {
    var fired = false;
    function go() { if (!fired) { fired = true; setTimeout(cb, 150); } }

    var M = window.MathJax;
    if (!M) { go(); return; }

    // Is the MathJax *library* there, or only the inline config object?
    // If only the config exists the library failed to load (offline / CDN down),
    // so don't wait around — give it a short grace period and boot anyway.
    var libReady = !!(M.version && M.startup);
    var grace = libReady ? 5000 : 1200;

    if (libReady && M.startup.promise) {
      try { M.startup.promise.then(go, go); } catch (e) { /* ignore */ }
    }

    var tries = 0, step = 120;
    (function poll() {
      if (fired) return;
      if (document.querySelector("mjx-container") || document.querySelector("svg.MathJax")) { go(); return; }
      if (tries++ * step > grace) { go(); return; }
      setTimeout(poll, step);
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { waitForMathJax(boot); });
  } else {
    waitForMathJax(boot);
  }
})();
