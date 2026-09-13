/* ==========================================================================
   Syed Muhammad Ali — portfolio
   Progressive enhancement only: every section is readable, navigable and
   complete with this file blocked. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------------
     Theme
     The initial value is resolved by the inline script in <head>; this adds
     the toggle, persistence, and system-preference tracking.
     ---------------------------------------------------------------------- */

  var THEME_BG = { light: "#efeee9", dark: "#101210" };

  var toggle = document.querySelector(".theme-toggle");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function readStored() {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  }

  /* Browser UI (mobile address bar) follows the resolved theme, not just the
     OS preference the static <meta> tags describe. */
  function syncThemeColor(theme) {
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", THEME_BG[theme]);
  }

  function applyTheme(theme, animate) {
    if (animate && !reduceMotion.matches) {
      root.classList.add("theme-anim");
      window.setTimeout(function () {
        root.classList.remove("theme-anim");
      }, 320);
    }

    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }

    syncThemeColor(theme);

    if (toggle) {
      var next = theme === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + next + " theme");
      toggle.setAttribute("title", "Switch to " + next + " theme");
    }
  }

  applyTheme(currentTheme(), false);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next, true);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* Preference can't be persisted; the session still switches. */
      }
    });
  }

  /* Some browsers deliver a colour-scheme change while the page is still
     loading; the inline bootstrap has already applied the right theme by then,
     so suppress the cross-fade until the page has settled. */
  var booted = false;
  window.setTimeout(function () {
    booted = true;
  }, 0);

  /* Follow the OS only while the visitor has made no explicit choice. */
  function onSystemChange(event) {
    if (!readStored()) applyTheme(event.matches ? "dark" : "light", booted);
  }

  if (systemDark.addEventListener) {
    systemDark.addEventListener("change", onSystemChange);
  } else if (systemDark.addListener) {
    systemDark.addListener(onSystemChange);
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function closeNav(returnFocus) {
    if (!nav || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    if (returnFocus) navToggle.focus();
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav(true);
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        closeNav(false);
      }
    });

    /* The panel is a mobile-only affordance; leaving it open through a resize
       would strand it over the desktop layout. */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 832) closeNav(false);
    });
  }

  /* ------------------------------------------------------------------------
     Active section
     ---------------------------------------------------------------------- */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-list a[href^='#']")
  );
  var sections = navLinks
    .map(function (link) {
      return document.getElementById(link.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var visible = new Set();

    function setCurrent(id) {
      navLinks.forEach(function (link) {
        if (link.getAttribute("href") === "#" + id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });

        /* Topmost section inside the detection band wins, so scrolling up and
           down resolves to the same answer. */
        for (var i = 0; i < sections.length; i++) {
          if (visible.has(sections[i].id)) {
            setCurrent(sections[i].id);
            return;
          }
        }
        setCurrent(null);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll progress
     ---------------------------------------------------------------------- */

  var progress = document.querySelector(".scroll-progress");

  if (progress) {
    var ticking = false;

    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );

    updateProgress();
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     Siblings within a list stagger slightly; everything else fades in place.
     ---------------------------------------------------------------------- */

  var revealables = document.querySelectorAll("[data-reveal]");

  function revealAll() {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add("is-visible");
    });
  }

  if (!revealables.length) {
    /* nothing to do */
  } else if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = Array.prototype.filter.call(
            el.parentNode.children,
            function (child) {
              return child.hasAttribute && child.hasAttribute("data-reveal");
            }
          );
          var index = siblings.indexOf(el);
          el.style.setProperty(
            "--reveal-delay",
            Math.min(index > 0 ? index : 0, 5) * 70 + "ms"
          );
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        });
      },
      /* threshold 0 so an element taller than the detection band still fires
         the moment it enters; the negative bottom margin is what holds the
         reveal until the element is properly in view. */
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );

    Array.prototype.forEach.call(revealables, function (el) {
      revealObserver.observe(el);
    });

    /* Anything already on screen at load shows immediately rather than
       animating in behind the fold. */
    window.setTimeout(function () {
      Array.prototype.forEach.call(revealables, function (el) {
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 60);
  }
})();
