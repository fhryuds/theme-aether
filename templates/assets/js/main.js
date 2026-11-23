/* Aether 主题脚本 */
(function () {
  "use strict";

  /* ---- 明暗模式切换 ---- */
  var themeKey = "aether-theme";
  var html = document.documentElement;

  function applyTheme(theme) {
    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
    }
  }

  var savedTheme = localStorage.getItem(themeKey);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme("dark");
  }

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = html.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(themeKey, next);
    });
  }

  /* ---- 导航滚动阴影 ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- 移动端抽屉导航 ---- */
  var drawer = document.getElementById("drawer");
  var overlay = document.getElementById("drawer-overlay");
  var drawerToggle = document.getElementById("drawer-toggle");
  var drawerClose = document.getElementById("drawer-close");

  function openDrawer() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
  }

  if (drawerToggle) drawerToggle.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);
  if (drawer) {
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });
  }

  /* ---- 代码块高亮：简单行号标记（占位，实际高亮由 Halo 插件完成） ---- */
  /* 无需额外处理 */

  /* ---- 文章标题打字机特效 ---- */
  var typeTitle = document.querySelector(".type-title");
  if (typeTitle) {
    var fullText = typeTitle.getAttribute("data-title") || "";
    var cursor = document.createElement("span");
    cursor.className = "type-cursor";
    var index = 0;

    function typeNext() {
      if (index < fullText.length) {
        // 逐字符追加，用 textNode 累积，光标保持在末尾
        index++;
        typeTitle.textContent = fullText.slice(0, index);
        typeTitle.appendChild(cursor);
        // 中文每字稍慢，英文略快
        var ch = fullText.charAt(index - 1);
        var delay = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch) ? 90 : 45;
        setTimeout(typeNext, delay);
      }
    }

    // 初始先放光标，再开始
    typeTitle.textContent = "";
    typeTitle.appendChild(cursor);
    setTimeout(typeNext, 300);
  }

  /* ---- 文章左侧目录（TOC）自动生成 + 滚动高亮 ---- */
  var tocNav = document.getElementById("post-toc-nav");
  var postContent = document.getElementById("post-content");
  if (tocNav && postContent) {
    var headings = postContent.querySelectorAll("h2, h3, h4");
    if (headings.length > 0) {
      headings.forEach(function (h, i) {
        // 给每个标题加 id 和锚点定位
        var id = "section-" + i;
        h.id = id;
        var level = h.tagName.toLowerCase(); // h2/h3/h4
        var a = document.createElement("a");
        a.href = "#" + id;
        a.textContent = h.textContent;
        a.className = "level-" + level.slice(1);
        tocNav.appendChild(a);

        // 点击平滑滚动
        a.addEventListener("click", function (e) {
          e.preventDefault();
          var target = document.getElementById(id);
          if (target) {
            var y = target.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        });
      });

      // 滚动高亮当前章节
      var tocLinks = tocNav.querySelectorAll("a");
      var onScrollSpy = function () {
        var currentId = "";
        headings.forEach(function (h) {
          var top = h.getBoundingClientRect().top;
          if (top <= 100) {
            currentId = h.id;
          }
        });
        tocLinks.forEach(function (a) {
          var href = a.getAttribute("href").replace("#", "");
          if (href === currentId) {
            a.classList.add("is-active");
          } else {
            a.classList.remove("is-active");
          }
        });
      };
      window.addEventListener("scroll", onScrollSpy, { passive: true });
      onScrollSpy();
    } else {
      tocNav.innerHTML = '<span class="post-toc__empty">本文无小标题</span>';
    }
  }
  /* ---- 全站搜索（前端即时检索，索引由模板渲染注入） ---- */
  var searchModal = document.getElementById("search-modal");
  var searchInput = document.getElementById("search-input");
  var searchResults = document.getElementById("search-results");
  var searchHint = document.getElementById("search-hint");
  var searchCount = document.getElementById("search-count");
  var searchIndex = document.getElementById("aether-search-data");

  if (searchModal && searchInput && searchResults && searchIndex) {
    var entries = [];
    searchIndex.querySelectorAll("a").forEach(function (a) {
      var titleEl = a.querySelector(".s-title");
      var excerptEl = a.querySelector(".s-excerpt");
      var cats = [];
      a.querySelectorAll(".s-cat").forEach(function (c) { cats.push(c.textContent.trim()); });
      var tags = [];
      a.querySelectorAll(".s-tag").forEach(function (t) { tags.push(t.textContent.trim()); });

      var title = titleEl ? titleEl.textContent.trim() : "";
      var excerpt = excerptEl ? excerptEl.textContent.trim() : "";
      entries.push({
        url: a.getAttribute("href"),
        date: a.getAttribute("data-date") || "",
        title: title,
        excerpt: excerpt,
        cats: cats,
        tags: tags,
        haystack: (title + " " + excerpt + " " + cats.join(" ") + " " + tags.join(" ")).toLowerCase()
      });
    });

    var activeIndex = -1;
    var hits = [];

    // 按发布日期倒序，保证搜索结果最新的在前
    entries.sort(function (a, b) { return b.date.localeCompare(a.date); });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    // 高亮匹配片段：先转义，再用「一次性合并正则」单遍替换，
    // 避免二次替换命中自己插入的 <mark> 标签导致 HTML 破坏。
    function highlight(text, terms) {
      var safe = escapeHtml(text);
      if (!terms.length) return safe;
      var pattern = terms
        .filter(Boolean)
        .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); })
        .join("|");
      if (!pattern) return safe;
      return safe.replace(new RegExp("(" + pattern + ")", "gi"), "<mark>$1</mark>");
    }

    function render(terms) {
      var list = terms.length
        ? entries.filter(function (e) {
            return terms.every(function (t) { return e.haystack.indexOf(t) !== -1; });
          })
        : [];

      hits = list;
      activeIndex = -1;

      if (!terms.length) {
        searchResults.innerHTML = "";
        searchHint.textContent = "输入关键词开始搜索，支持多个关键词（空格分隔）";
        searchCount.textContent = "";
        return;
      }

      if (!list.length) {
        searchResults.innerHTML =
          '<div class="search-empty"><div class="search-empty__icon">⌕</div>' +
          '<p>没有找到与「' + escapeHtml(terms.join(" ")) + '」相关的文章。</p></div>';
        searchHint.textContent = "";
        searchCount.textContent = "0 篇";
        return;
      }

      searchHint.textContent = "";
      searchCount.textContent = list.length + " 篇结果";

      var html = "";
      list.slice(0, 30).forEach(function (e, i) {
        var meta = [];
        if (e.date) meta.push('<span class="s-date">' + escapeHtml(e.date) + "</span>");
        e.cats.forEach(function (c) {
          meta.push('<span class="chip chip--a">' + escapeHtml(c) + "</span>");
        });
        e.tags.slice(0, 3).forEach(function (t) {
          meta.push('<span class="chip chip--b">#' + escapeHtml(t) + "</span>");
        });
        html +=
          '<a class="search-hit" data-i="' + i + '" href="' + escapeHtml(e.url) + '">' +
          '<span class="search-hit__title">' + highlight(e.title, terms) + "</span>" +
          (e.excerpt ? '<p class="search-hit__excerpt">' + highlight(e.excerpt, terms) + "</p>" : "") +
          '<span class="search-hit__meta">' + meta.join("") + "</span>" +
          "</a>";
      });
      searchResults.innerHTML = html;
    }

    function setActive(next) {
      var nodes = searchResults.querySelectorAll(".search-hit");
      if (!nodes.length) return;
      if (activeIndex >= 0 && nodes[activeIndex]) nodes[activeIndex].classList.remove("is-active");
      activeIndex = (next + nodes.length) % nodes.length;
      nodes[activeIndex].classList.add("is-active");
      nodes[activeIndex].scrollIntoView({ block: "nearest" });
    }

    function openSearch() {
      searchModal.classList.add("is-open");
      searchModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-search-open");
      setTimeout(function () { searchInput.focus(); }, 30);
    }

    function closeSearch() {
      searchModal.classList.remove("is-open");
      searchModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-search-open");
    }

    function currentTerms() {
      return searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    }

    var openBtn = document.getElementById("search-open");
    if (openBtn) openBtn.addEventListener("click", openSearch);

    document.querySelectorAll("[data-search-open]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        if (drawer && overlay) closeDrawer();
        openSearch();
      });
    });

    document.querySelectorAll("[data-search-close]").forEach(function (el) {
      el.addEventListener("click", closeSearch);
    });
    var closeBtn = document.getElementById("search-close");
    if (closeBtn) closeBtn.addEventListener("click", closeSearch);

    var timer = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { render(currentTerms()); }, 90);
    });

    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        var target = activeIndex >= 0 ? hits[activeIndex] : hits[0];
        if (target) window.location.href = target.url;
      } else if (e.key === "Escape") {
        closeSearch();
      }
    });

    document.addEventListener("keydown", function (e) {
      // Ctrl/⌘ + K 唤起；"/" 在非输入状态下唤起
      var tag = (e.target && e.target.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (searchModal.classList.contains("is-open")) closeSearch();
        else openSearch();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape" && searchModal.classList.contains("is-open")) {
        closeSearch();
      }
    });
  }
})();
