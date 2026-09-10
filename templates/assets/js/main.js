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
})();
