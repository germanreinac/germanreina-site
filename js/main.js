(function () {
  var site = window.SITE;
  var projects = window.PROJECTS;
  var bySlug = {};
  projects.forEach(function (p) { bySlug[p.slug] = p; });

  var SHAPES = {
    wide: { ar: "16 / 10", h: 46 },
    tall: { ar: "3 / 4", h: 56 },
    square: { ar: "1 / 1", h: 44 }
  };
  var LIFTS = ["-3vh", "2vh", "-1vh", "4vh", "-4vh", "1vh"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function frame(p, src) {
    if (src) {
      var f = el("span", "frame");
      var img = el("img");
      img.src = src;
      img.alt = p.title;
      img.loading = "lazy";
      img.draggable = false;
      f.appendChild(img);
      return f;
    }
    var e = el("span", "frame frame--empty");
    e.appendChild(el("span", "frame__pending", "Image pending"));
    e.appendChild(el("span", "frame__title", p.title));
    return e;
  }

  function linkList(parent) {
    site.links.forEach(function (l) {
      var a = el("a", null, l.label + " ↗");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      parent.appendChild(a);
    });
  }

  /* ---------- gallery ---------- */
  var room = document.getElementById("room");

  function buildGallery() {
    var intro = el("div", "walltext");
    intro.appendChild(el("h1", null, site.name));
    intro.appendChild(el("p", null, site.intro));
    room.appendChild(intro);

    projects.forEach(function (p, i) {
      var s = SHAPES[p.shape] || SHAPES.wide;
      var b = el("button", "piece");
      b.type = "button";
      b.dataset.slug = p.slug;
      b.style.setProperty("--ar", s.ar);
      b.style.setProperty("--h", s.h);
      b.style.setProperty("--tone", p.tone);
      b.style.setProperty("--lift", LIFTS[i % LIFTS.length]);
      b.appendChild(frame(p, p.images[0]));
      var label = el("span", "label");
      label.appendChild(el("b", null, p.title));
      label.appendChild(el("span", null, p.year || ""));
      b.appendChild(label);
      room.appendChild(b);
    });

    var end = el("div", "walltext walltext--end");
    end.appendChild(el("h2", null, "That's the wall."));
    var p = el("p", null, "The same projects as a plain list: ");
    var a = el("a", null, "Index");
    a.href = "#index";
    p.appendChild(a);
    end.appendChild(p);
    var links = el("div", "walltext__links");
    linkList(links);
    end.appendChild(links);
    room.appendChild(end);

    document.getElementById("room-count").textContent = projects.length + " projects";
  }

  // Pieces away from the centre of the screen sink into the fog.
  var ticking = false;
  function fogPass() {
    ticking = false;
    var w = room.clientWidth;
    var mid = room.getBoundingClientRect().left + w / 2;
    var pieces = room.querySelectorAll(".piece");
    for (var i = 0; i < pieces.length; i++) {
      var r = pieces[i].getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - mid) / w;
      var blur = reduceMotion ? 0 : Math.max(0, Math.min(7, (d - 0.42) * 14));
      var fade = Math.max(0, Math.min(0.6, (d - 0.5) * 1.1));
      pieces[i].style.filter = blur ? "blur(" + blur.toFixed(1) + "px)" : "";
      pieces[i].style.opacity = (1 - fade).toFixed(2);
    }
  }
  function requestFog() {
    if (!ticking) { ticking = true; requestAnimationFrame(fogPass); }
  }

  function wireRoom() {
    room.addEventListener("scroll", requestFog, { passive: true });
    window.addEventListener("resize", requestFog);

    // Vertical wheel walks the wall sideways.
    room.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        room.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    // Mouse drag. Touch uses native scrolling.
    var startX = 0, startLeft = 0, down = false, moved = false;
    room.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = room.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; room.classList.add("is-dragging"); }
      if (moved) room.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      down = false;
      room.classList.remove("is-dragging");
    });

    room.addEventListener("click", function (e) {
      if (moved) { moved = false; e.preventDefault(); return; }
      var b = e.target.closest(".piece");
      if (b) openSheet(b.dataset.slug);
    });

    room.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") room.scrollBy({ left: room.clientWidth * 0.6, behavior: reduceMotion ? "auto" : "smooth" });
      if (e.key === "ArrowLeft") room.scrollBy({ left: -room.clientWidth * 0.6, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- index ---------- */
  var table = document.getElementById("table");

  function buildIndex(filter) {
    table.textContent = "";
    projects
      .filter(function (p) { return filter === "all" || p.kind === filter; })
      .forEach(function (p) {
        var r = el("button", "row");
        r.type = "button";
        r.dataset.slug = p.slug;
        r.appendChild(el("span", "row__year", p.year || "—"));
        r.appendChild(el("span", "row__title", p.title));
        r.appendChild(el("span", "row__role", p.role));
        r.appendChild(el("span", "row__with", p.with));
        r.appendChild(el("span", "row__go", "→"));
        table.appendChild(r);
      });
  }

  function wireIndex() {
    table.addEventListener("click", function (e) {
      var r = e.target.closest(".row");
      if (r) openSheet(r.dataset.slug);
    });
    var chips = document.querySelectorAll(".chip");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        buildIndex(c.dataset.filter);
      });
    });
    linkList(document.getElementById("index-foot"));
  }

  /* ---------- project sheet ---------- */
  var sheet = document.getElementById("sheet");
  var sheetBody = document.getElementById("sheet-body");

  function openSheet(slug) {
    var p = bySlug[slug];
    if (!p) return;
    sheetBody.textContent = "";
    var h = el("h2", "sheet__title", p.title);
    h.id = "sheet-title";
    sheetBody.appendChild(h);

    var dl = el("dl", "sheet__meta");
    [["Year", p.year], ["With", p.with], ["Role", p.role]].forEach(function (m) {
      if (!m[1]) return;
      dl.appendChild(el("dt", null, m[0]));
      dl.appendChild(el("dd", null, m[1]));
    });
    sheetBody.appendChild(dl);

    var ul = el("ul", "sheet__notes");
    p.notes.forEach(function (n) { ul.appendChild(el("li", null, n)); });
    sheetBody.appendChild(ul);

    if (p.link) {
      var a = el("a", "sheet__link", p.link.label + " ↗");
      a.href = p.link.url;
      a.target = "_blank";
      a.rel = "noopener";
      sheetBody.appendChild(a);
    }

    var imgs = el("div", "sheet__images");
    if (p.images.length) {
      p.images.forEach(function (src) {
        var img = el("img");
        img.src = src;
        img.alt = p.title;
        img.loading = "lazy";
        imgs.appendChild(img);
      });
    } else {
      var f = frame(p, null);
      f.style.setProperty("--tone", p.tone);
      imgs.appendChild(f);
    }
    sheetBody.appendChild(imgs);

    sheet.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
  }

  document.getElementById("sheet-close").addEventListener("click", function () { sheet.close(); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- mode ---------- */
  function setMode() {
    var mode = location.hash === "#index" ? "index" : "gallery";
    document.getElementById("view-gallery").hidden = mode !== "gallery";
    document.getElementById("view-index").hidden = mode !== "index";
    document.querySelectorAll(".modes__btn").forEach(function (b) {
      if (b.dataset.mode === mode) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (mode === "gallery") requestFog();
  }

  /* Walkable 3D gallery when WebGL is there, flat wall otherwise. */
  function startWalk() {
    if (!window.Walk) return false;
    var host = document.getElementById("walk");
    var gallery = document.getElementById("view-gallery");
    var intro = document.getElementById("walk-intro");
    var end = document.getElementById("walk-end");
    var up = document.getElementById("walk-up");
    var count = document.getElementById("room-count");
    var hint = document.getElementById("hint");
    var total = projects.length + " projects", thrownOut = 0;
    function tally() { return thrownOut ? thrownOut + " thrown out" : ""; }
    var touch = window.matchMedia("(pointer: coarse)").matches;
    var HINTS = {
      over: (touch ? "tap" : "click") + " anywhere to step in",
      walk: touch
        ? "tap to walk · bump the others to shove them, tap one to throw it · tap outside to jump off"
        : "click to walk · bump into the others to shove them, click one to throw it · click outside to jump off",
      drop: "",
      fall: touch ? "drag to scroll the projects, tap one to open it" : "scroll down through the projects, click one to open it"
    };
    host.hidden = false;
    var walk = window.Walk.start({
      host: host,
      projects: projects,
      fallLayer: document.getElementById("walk-fall"),
      makeFrame: frame,
      shapes: SHAPES,
      onOpen: openSheet,
      isBlocked: function () { return sheet.open; },
      onNear: function () {},
      onThrown: function (n) { thrownOut = n; count.textContent = tally(); },
      onMove: function (walked) { intro.style.opacity = Math.max(0, 1 - walked / 7).toFixed(2); },
      onState: function (state, atEnd) {
        hint.textContent = HINTS[state];
        up.hidden = state !== "fall" || atEnd;
        end.hidden = !(state === "fall" && atEnd);
      }
    });
    if (!walk) { host.hidden = true; return false; }
    window.__walk = walk; // handle for poking at the gallery from the browser console
    gallery.classList.add("is-space");
    intro.appendChild(el("h1", null, site.name));
    intro.appendChild(el("p", null, site.intro));
    count.textContent = "";
    hint.textContent = HINTS.walk;
    room.hidden = true;
    document.getElementById("fog").hidden = true;
    up.addEventListener("click", walk.climbBack);
    document.getElementById("walk-climb").addEventListener("click", walk.climbBack);
    return true;
  }

  if (!startWalk()) {
    buildGallery();
    wireRoom();
  }
  buildIndex("all");
  wireIndex();
  setMode();
  window.addEventListener("hashchange", setMode);
  requestFog();
})();
