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

  function outLink(label, url, cls) {
    var a = el("a", cls, label);
    a.href = url;
    if (url.charAt(0) !== "#" && url.indexOf("mailto:") !== 0) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    return a;
  }

  /* Text glitch: the same torn rows and red / blue-green split as the figure on the home page,
     played briefly when the pointer reaches a title or a link. */
  function glitch(node) {
    if (reduceMotion || !node || node.dataset.glitch) return node;
    node.dataset.glitch = "1";
    node.classList.add("glitch");
    node.setAttribute("data-text", node.textContent);
    node.addEventListener("pointerenter", function () { burst(node); });
    node.addEventListener("focus", function () { burst(node); });
    return node;
  }
  function burst(node) {
    if (reduceMotion || !node) return;
    node.setAttribute("data-text", node.textContent);
    node.classList.remove("is-glitching");
    void node.offsetWidth; // restart the animation
    node.classList.add("is-glitching");
    clearTimeout(node._glitchT);
    node._glitchT = setTimeout(function () { node.classList.remove("is-glitching"); }, 420);
  }

  // The same closing line on Index and Play: a few links (where asked for) and the credit.
  function footer(parent, withLinks) {
    if (!parent) return;
    if (withLinks) {
      var keep = site.footLinks || [];
      site.links.forEach(function (l) {
        if (keep.indexOf(l.label) >= 0) parent.appendChild(outLink(l.label + " ↗", l.url));
      });
    }
    parent.appendChild(el("span", "credit", site.name + " © " + new Date().getFullYear()));
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
        var t = el("span", "row__title", p.title);
        r.appendChild(t);
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
    footer(document.getElementById("index-foot"), true);
    // With a mouse, a framed preview of the project rides along with the pointer while it is on a row.
    var peek = el("div", "peek");
    peek.setAttribute("aria-hidden", "true");
    var indexView = document.getElementById("view-index");
    indexView.insertBefore(peek, indexView.firstChild);
    table.addEventListener("pointermove", function (e) {
      var r = e.pointerType === "mouse" ? e.target.closest(".row") : null;
      if (!r) { peek.classList.remove("is-on"); return; }
      var p = bySlug[r.dataset.slug];
      if (peek.dataset.slug !== p.slug) {
        peek.dataset.slug = p.slug;
        peek.style.backgroundColor = p.tone;
        peek.style.backgroundImage = p.images[0] ? "url(" + p.images[0] + ")" : "none";
        peek.textContent = p.images[0] ? "" : "Image pending";
      }
      peek.style.transform = "translate(" + (e.clientX - peek.offsetWidth / 2) + "px," + (e.clientY - peek.offsetHeight / 2) + "px)";
      peek.classList.add("is-on");
    });
    table.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") peek.classList.remove("is-on"); });
    table.addEventListener("click", function () { peek.classList.remove("is-on"); });
    window.addEventListener("hashchange", function () { peek.classList.remove("is-on"); });
    document.querySelectorAll(".view.index").forEach(function (v) { // the bottom blur lifts once you reach the end
      function atEnd() { v.classList.toggle("is-end", v.clientHeight > 0 && v.scrollTop + v.clientHeight >= v.scrollHeight - 90); }
      v.addEventListener("scroll", atEnd, { passive: true });
      window.addEventListener("resize", atEnd);
      window.addEventListener("hashchange", function () { setTimeout(atEnd, 0); });
      atEnd();
      setTimeout(atEnd, 80); // again once the page has laid out, in case it opened on this view
    });
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
    }
    var more = el("p", "sheet__links");
    if (!p.images.length && site.portfolio) more.appendChild(outLink("See the art on " + site.portfolio.label + " ↗", site.portfolio.url));
    if (more.childNodes.length) sheetBody.appendChild(more);
    if (p.images.length) sheetBody.appendChild(imgs);

    sheet.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
    glitch(h);
    burst(h);
  }

  document.getElementById("sheet-close").addEventListener("click", function () { sheet.close(); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- mode ---------- */
  var HOMES = ["gallery", "warehouse", "island"], homes = {}, walkHint = "";
  var HOME_HINTS = {
    warehouse: "each arm holds a project · click one to open it",
    island: "drag to spin the pages · click one to open it · click the artist"
  };
  function setMode() {
    var name = location.hash.slice(1);
    var about = document.getElementById("view-about");
    var playView = document.getElementById("view-play");
    var mode = name === "index" ? "index" : (name === "about" && about ? "about" : ((name === "play" || name === "play-flat") && playView ? "play" : "gallery"));
    if (about) about.hidden = mode !== "about";
    if (playView) playView.hidden = mode !== "play";
    if (mode === "gallery" && homes.ready) showHome(HOMES.indexOf(name) > 0 ? name : "gallery");
    document.getElementById("view-gallery").hidden = mode !== "gallery";
    document.getElementById("view-index").hidden = mode !== "index";
    document.querySelectorAll(".modes__btn").forEach(function (b) {
      if (b.dataset.mode === mode) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    if (mode === "gallery") requestFog();
    heroOn = mode === "gallery";
    document.body.dataset.mode = mode;
    setBar();
    if (mode === "play" && window.__playShown) { window.__playShown(); burst(document.querySelector("#view-play .index__title")); }
    if (mode === "index") burst(document.querySelector("#view-index .index__title"));
    if (mode === "about") burst(document.querySelector("#view-about .index__title"));
    if (heroVideo && !reduceMotion) { // only play while the home page is showing
      if (mode === "gallery") { var pl = heroVideo.play(); if (pl && pl.catch) pl.catch(function () {}); }
      else heroVideo.pause();
    }
  }

  // The bar floats over the full-screen views, and uses light text over the dark ones.
  function setBar() {
    var b = document.body, mode = b.dataset.mode;
    var floats = mode === "gallery";
    var dark = mode === "gallery";
    if (floats) b.dataset.float = "1"; else delete b.dataset.float;
    if (dark) b.dataset.dark = "1"; else delete b.dataset.dark;
  }

  /* Walkable 3D gallery when WebGL is there, flat wall otherwise. */
  function startWalk() {
    if (!window.Walk) return false;
    var host = document.getElementById("walk");
    if (!host) return false;
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
      fallBack: document.getElementById("walk-fall-back"),
      makeFrame: frame,
      shapes: SHAPES,
      onOpen: openSheet,
      isBlocked: function () { return sheet.open; },
      onNear: function () {},
      onThrown: function (n) { thrownOut = n; count.textContent = tally(); },
      onMove: function (walked) {
        var o = Math.max(0, 1 - walked / 7);
        intro.style.opacity = o.toFixed(2);
        intro.style.visibility = o < 0.03 ? "hidden" : "visible"; // so its links cannot be clicked once it has faded
      },
      onState: function (state, atEnd) {
        walkHint = HINTS[state];
        if (!homes.ready || homes.current === "gallery") hint.textContent = walkHint;
        up.hidden = state !== "fall" || atEnd;
        end.hidden = !(state === "fall" && atEnd);
      }
    });
    if (!walk) { host.hidden = true; return false; }
    window.__walk = walk; // handle for poking at the gallery from the browser console
    gallery.classList.add("is-space");
    intro.appendChild(el("h1", null, site.name));
    intro.appendChild(el("p", null, site.intro));
    if (site.doors) intro.appendChild(doorsNav()); // the same four doors as the current site
    count.textContent = "";
    walkHint = HINTS.walk;
    hint.textContent = walkHint;
    room.hidden = true;
    document.getElementById("fog").hidden = true;
    up.addEventListener("click", walk.climbBack);
    document.getElementById("walk-climb").addEventListener("click", walk.climbBack);
    return true;
  }

  /* The other home screens being tried out. Only one is shown and running at a time. */
  function showHome(name) {
    homes.current = name;
    document.getElementById("walk").hidden = name !== "gallery";
    document.getElementById("stage-warehouse").hidden = name !== "warehouse";
    document.getElementById("stage-island").hidden = name !== "island";
    document.getElementById("hint").textContent = name === "gallery" ? walkHint : HOME_HINTS[name];
    document.getElementById("room-count").hidden = name !== "gallery";
    document.getElementById("tip").hidden = true;
    document.querySelectorAll("#homes a").forEach(function (a) {
      if (a.dataset.home === name) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  function startHomes() {
    if (!window.Homes || !document.getElementById("stage-warehouse")) return;
    var tip = document.getElementById("tip");
    var made = 0;
    ["warehouse", "island"].forEach(function (name) {
      var host = document.getElementById("stage-" + name);
      var intro = host.querySelector(".walk__intro");
      intro.appendChild(el("h1", null, site.name));
      intro.appendChild(el("p", null, site.intro));
      var ok = window.Homes[name]({
        host: host,
        projects: projects,
        onOpen: openSheet,
        isBlocked: function () { return sheet.open; },
        onHover: function (p, x, y) {
          tip.hidden = !p;
          if (!p) return;
          tip.textContent = p.title;
          tip.style.left = x + "px";
          tip.style.top = y + "px";
        }
      });
      if (ok) made++;
    });
    if (!made) return;
    homes.ready = true;
    document.getElementById("homes").hidden = false;
  }

  /* The home page for now: the Ra video behind the name, until the interactive gallery has its art. */
  function doorsNav() {
    var doors = el("nav", "walk__doors");
    doors.setAttribute("aria-label", "Where to go");
    site.doors.forEach(function (d) {
      var a = outLink("", d.url, "walk__door");
      a.appendChild(el("span", "walk__door-title", d.title + (d.url.charAt(0) === "#" ? " →" : " ↗")));
      a.appendChild(el("span", "walk__door-sub", d.sub));
      doors.appendChild(a);
    });
    return doors;
  }
  var heroVideo = null, heroOn = true;
  function startHero() {
    var intro = document.getElementById("hero-intro"), stage = document.getElementById("hero-stage");
    var canvas = document.getElementById("hero-canvas"), ctx = canvas.getContext("2d");
    heroVideo = document.getElementById("hero-video");
    var nameLink = el("h1", null, site.name); // the name is the way into About
    nameLink.setAttribute("role", "link");
    nameLink.tabIndex = 0;
    nameLink.title = "About";
    nameLink.addEventListener("click", function () { location.hash = "about"; });
    nameLink.addEventListener("keydown", function (e) { if (e.key === "Enter") location.hash = "about"; });
    intro.appendChild(nameLink);
    intro.appendChild(el("p", null, site.intro));
    document.getElementById("hint").textContent = site.motto || "";
    document.getElementById("room-count").textContent = "";

    var poster = new Image();
    poster.src = heroVideo.getAttribute("poster");
    var W = 0, H = 0, dpr = 1, last = performance.now(), dirty = true, lastKey = -2;
    // the clean frame is drawn here first, then copied to the visible canvas with the glitch applied
    var buf = document.createElement("canvas"), bctx = buf.getContext("2d");
    var tint = document.createElement("canvas"), tctx = tint.getContext("2d");

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, day ? 1.5 : 2); // the home picture at full detail; a little lighter while the 3D head is running
      dirty = true;
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = buf.width = Math.round(W * dpr);
      canvas.height = buf.height = Math.round(H * dpr);
    }
    window.addEventListener("resize", size);
    size();

    // The picture is dragged and torn along the path of the pointer or finger, in the direction
    // it moves, with red and blue-green fringes. The wake behind it takes about a second to settle.
    var REACH = 64;      // how far from the path the picture is disturbed, in px
    var PULL = 0.06;     // how far it is dragged, per px/s of pointer speed
    var LINGER = 1.9;    // seconds the wake takes to settle
    var STEP = 10, ROW = 4, CELL = 16, MAX_POINTS = 110;
    var gx = new Float32Array(0), gy = new Float32Array(0), ga = new Float32Array(0);
    var trail = [], lastPt = null;
    var bufR = document.createElement("canvas"), rctx = bufR.getContext("2d");
    var bufC = document.createElement("canvas"), cctx = bufC.getContext("2d");
    function poke(e) {
      if (reduceMotion) return;
      if (day && (held || bursting)) return; // no tearing while the head is in your hand, so you can see it
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      if (!lastPt || t - lastPt.t > 250) { lastPt = { x: x, y: y, t: t }; trail.push({ x: x, y: y, vx: 0, vy: 0, life: day ? 0.7 : 1 }); return; }
      var dx = x - lastPt.x, dy = y - lastPt.y, d = Math.hypot(dx, dy);
      if (d < STEP) return;
      var dtp = Math.max(8, t - lastPt.t) / 1000;
      var vx = dx / dtp, vy = dy / dtp;
      // fill the gap since the last event, so a fast flick still leaves an unbroken wake
      var n = Math.min(12, Math.floor(d / STEP));
      for (var k = 1; k <= n; k++) {
        trail.push({ x: lastPt.x + (dx * k) / n, y: lastPt.y + (dy * k) / n, vx: vx, vy: vy, life: day ? 0.7 : 1 }); // a slightly shorter wake in head mode
      }
      if (trail.length > MAX_POINTS) trail.splice(0, trail.length - MAX_POINTS);
      lastPt = { x: x, y: y, t: t };
    }
    // A short burst of tears around a point: n of them, on a ring of radius rad, flying outwards.
    function spark(x, y, n, rad, power, life, flat) {
      if (reduceMotion) return;
      for (var i = 0; i < n; i++) {
        var a = flat ? (i % 2 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5 : Math.random() * 6.283, d = rad * (0.5 + Math.random() * 0.7);
        trail.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * (flat ? 0.3 : 1), vx: Math.cos(a) * power, vy: Math.sin(a) * power * 0.3, life: life * (0.7 + Math.random() * 0.3) });
      }
      if (trail.length > 170) trail.splice(0, trail.length - 170);
    }
    // The colour to put under see-through parts of the picture before tearing them: the page's own
    // background, adjusted so that it still matches once the canvas's CSS filter has been applied.
    var galleryEl = document.getElementById("view-gallery");
    function underColour() {
      var bg = (getComputedStyle(galleryEl).backgroundColor.match(/[\d.]+/g) || [39, 36, 49]).map(Number);
      var f = getComputedStyle(canvas).filter || "";
      var kc = /contrast\(([\d.]+)\)/.exec(f), kb = /brightness\(([\d.]+)\)/.exec(f);
      var k = kc ? +kc[1] : 1, b = kb ? +kb[1] : 1;
      function inv(c) { return Math.max(0, Math.min(255, Math.round((((c / 255) / b - 0.5) / k + 0.5) * 255))); }
      return "rgb(" + inv(bg[0]) + "," + inv(bg[1]) + "," + inv(bg[2]) + ")";
    }
    var hero = document.getElementById("hero");
    hero.addEventListener("pointermove", poke);
    hero.addEventListener("pointerdown", function (e) { lastPt = null; poke(e); });
    canvas.style.touchAction = "none";

    // cheap repeatable noise, so torn rows hold for a few frames instead of fizzing
    function noise(a, b) {
      var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return s - Math.floor(s);
    }
    // one copy of the frame in each fringe colour, made once per frame
    function tinted(c2d, cv, colour, x, y, w, h) { // x, y, w, h: the part of the picture to prepare, in canvas pixels
      if (cv.width !== buf.width || cv.height !== buf.height) { cv.width = buf.width; cv.height = buf.height; }
      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.globalCompositeOperation = "source-over";
      c2d.clearRect(x, y, w, h);
      c2d.drawImage(buf, x, y, w, h, x, y, w, h);
      c2d.globalCompositeOperation = "source-atop";
      c2d.fillStyle = colour;
      c2d.fillRect(x, y, w, h);
      c2d.globalCompositeOperation = "multiply";
      c2d.drawImage(buf, x, y, w, h, x, y, w, h);
    }

    /* ---- skull mode: the figure's head pops off as a jelly skull to roll, bounce, stretch and burst ---- */
    var day = false, dayT = 9, head = null, held = false, grabAt = null, downAt = null;
    var touches = {}, pinch = null, wheelAt = 0, bursting = false, burstTimer = 0;
    // Rough handling builds up strain: shaking it from side to side, tapping it over and over, slamming it down.
    // Strain fades when it is left alone. It trembles as strain grows, and at 1 it bursts.
    var strain = 0, lastSx = 0, lastSz = 0;
    var pop = null;      // the ring that marks where the head burst
    var homing = null;   // the head flying back onto the figure's neck
    var parked = false;  // sitting on the neck while the figure fades back in under it
    var wakeX = 0, wakeY = 0; // where the head last tore the floor
    var nightT = 9;      // seconds since the figure came back
    var THREE_SRC = "js/vendor/three.min.js";
    var BG = 0x211e2a;           // the page colour in this mode; the skull fades into it with distance
    var FAR = -26;               // how far back it may go
    var REST = 0.95;             // height of its centre when it sits on the floor (its radius is about 1)
    var BURST_HI = 4.4, BURST_LO = 0.15; // stretched or squashed past these, it bursts
    function loadThree(done) {
      if (window.THREE) { done(); return; }
      var s = document.createElement("script");
      s.src = THREE_SRC;
      s.onload = done;
      document.head.appendChild(s);
    }
    // A provisional head, and the skull inside it, built from simple shapes. Swap for the real models when exported.
    function buildHead() {
      var THREE = window.THREE, renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
      catch (e) { return null; }
      renderer.setClearColor(0x000000, 0);
      // The 3D canvas is shown as it is, on top of the 2D one. It is only copied into the 2D canvas
      // on the frames where the picture is being torn, since that copy is the slow part.
      renderer.domElement.className = "hero__gl";
      stage.appendChild(renderer.domElement);
      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(BG, 17, 46);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      var sun = new THREE.DirectionalLight(0xffffff, 0.5);
      sun.position.set(-0.6, 1.6, 1.2);
      scene.add(sun);
      var rim = new THREE.DirectionalLight(0xb3264e, 0.6); // crimson from the side, like the shadows on the figure
      rim.position.set(1.5, 0.4, -1);
      scene.add(rim);
      var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
      var bone = new THREE.MeshPhongMaterial({ color: 0xd8ccd4, shininess: 18, specular: 0x1a1a1a });
      var hole = new THREE.MeshBasicMaterial({ color: 0x17151d });
      function ball(mat, r, x, y, z, sx, sy, sz) {
        var b = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
        b.position.set(x, y, z);
        b.scale.set(sx || 1, sy || 1, sz || 1);
        return b;
      }
      // the head you play with: glossy, like jelly
      function jelly(c) { return new THREE.MeshPhongMaterial({ color: c, shininess: 14, specular: 0x1c1c1c }); } // soft, almost matte
      // the figure is one colour all over, so the head is too; eyes and mouth are a darker shade of it
      var pink = jelly(0xc79cc4), green = pink, yellow = jelly(0x8f5f8c), mouth = yellow;
      var face = new THREE.Group();
      face.add(ball(pink, 1, 0, 0, 0, 1.06, 0.88, 0.96));                         // skull
      face.add(ball(pink, 0.5, -1.08, 0.04, 0, 0.8, 1, 0.62));                    // ears
      face.add(ball(pink, 0.5, 1.08, 0.04, 0, 0.8, 1, 0.62));
      face.add(ball(green, 0.42, 0.02, 0.84, 0.22, 1.35, 0.62, 1));               // tuft
      face.add(ball(green, 0.3, -0.36, 0.8, 0.3, 1.2, 0.7, 1));
      face.add(ball(green, 0.26, 0.42, 0.9, 0.16, 1.2, 0.7, 1));
      face.add(ball(yellow, 0.095, -0.42, 0.12, 0.88));                           // eyes
      face.add(ball(yellow, 0.095, 0.42, 0.12, 0.88));
      face.add(ball(mouth, 1, 0, -0.3, 0.8, 0.5, 0.19, 0.2));                     // mouth
      // the skull that is left when the head bursts
      var skull = new THREE.Group();
      skull.add(ball(bone, 0.86, 0, 0.1, 0, 1.06, 0.94, 1));                      // cranium
      skull.add(ball(bone, 0.54, 0, -0.5, 0.26, 1.02, 0.68, 0.86));               // jaw
      skull.add(ball(hole, 0.27, -0.35, 0.07, 0.7, 1, 1.08, 0.5));                // eye sockets
      skull.add(ball(hole, 0.27, 0.35, 0.07, 0.7, 1, 1.08, 0.5));
      skull.add(ball(hole, 0.09, 0, -0.22, 0.83, 0.9, 1.3, 0.5));                 // nose
      for (var t = -2; t <= 2; t++) {                                             // teeth
        var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.09), bone);
        tooth.position.set(t * 0.14, -0.6, 0.67 - Math.abs(t) * 0.03);
        skull.add(tooth);
      }
      skull.visible = false;
      var g = new THREE.Group();
      g.add(face, skull);
      // the lumps of jelly the head breaks into
      var bits = [], lump = new THREE.SphereGeometry(1, 30, 20);
      for (var bi = 0; bi < 26; bi++) {
        var bm = new THREE.Mesh(lump, pink);
        bm.visible = false;
        scene.add(bm);
        bits.push({ mesh: bm, vel: new THREE.Vector3(), r: 0.2, age: 9, down: false, spread: 0 });
      }
      var outer = new THREE.Group(); // carries position and the jelly squash; the inner group carries the rolling
      outer.add(g);
      scene.add(outer);
      var shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.25, 40),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
      );
      shadow.rotation.x = -Math.PI / 2;
      scene.add(shadow);
      var grid = new THREE.GridHelper(160, 64, 0x3a3647, 0x302c3b); // a faint floor, so depth reads
      grid.position.y = -0.01;
      scene.add(grid);
      return {
        renderer: renderer, scene: scene, camera: camera, group: g, face: face, skull: skull, outer: outer, shadow: shadow, bits: bits, rpx: 100,
        pos: new THREE.Vector3(0, REST, 0), vel: new THREE.Vector3(), w: new THREE.Vector3(),
        q: new THREE.Quaternion(), tmp: new THREE.Quaternion(), ax: new THREE.Vector3(),
        ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), hit: new THREE.Vector3(), proj: new THREE.Vector3(),
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -(REST + 0.45)),
        s: 1, sv: 0,      // jelly: how tall it is against its normal height, and how fast that is changing
        // jelly detail: it leans back against the way it is moving, stretches along its path,
        // and can be pulled between two fingers along any line
        shx: 0, shz: 0, shvx: 0, shvz: 0,          // lean (shear), and how fast it is changing
        kd: 1, dir: new THREE.Vector3(1, 0, 0),    // stretch along the direction of travel
        pk: 1, pkv: 0, pdir: new THREE.Vector3(1, 0, 0), // stretch between two fingers, and its line
        mat: new THREE.Matrix4(), m2: new THREE.Matrix4(), v3: new THREE.Vector3(), v4: new THREE.Vector3(),
        rest: 1           // the shape the jelly is pulling towards (the mouse wheel moves this)
      };
    }
    function fitHead() {
      if (!head) return;
      var tall = W / H < 0.8;
      head.renderer.setPixelRatio(dpr);
      head.renderer.setSize(W, H, false);
      head.camera.aspect = W / H;
      head.camera.fov = tall ? 52 : 34;
      // high enough that the floor runs from the bottom edge of the screen to well up it, and close
      // enough that the head on the floor is about as big as the figure's own head
      head.camera.position.set(0, tall ? 7 : 6, tall ? 11 : 10.5);
      head.camera.lookAt(0, 0.4, tall ? -2.5 : -1.5);
      head.camera.updateProjectionMatrix();
      head.camera.updateMatrixWorld();
    }
    function aim(x, y) { // a ray from the camera through a point on the screen
      head.ndc.set((x / W) * 2 - 1, 1 - (y / H) * 2);
      head.ray.setFromCamera(head.ndc, head.camera);
      return head.ray.ray;
    }
    // Where the figure's head is on screen in the video, so the skull can start exactly there.
    function figureHead() {
      var sw = heroVideo.videoWidth || 1280, sh = heroVideo.videoHeight || 720, tall = W / H < 0.8;
      var scale = Math.max(W / sw, H / sh) * (tall ? 0.74 : 1);
      return { x: W * 0.5, y: H * (tall ? 0.56 : 0.5) - sh * scale * 0.17, r: sh * scale * 0.15 };
    }
    function dropHead() {
      if (!head) return;
      // it pops off the body: starts where the figure's head is, jumps, and falls to the floor
      var at = figureHead(), r = aim(at.x, at.y);
      // far enough along that line of sight to look the same size as the figure's head
      var t = (H / 2) / Math.tan((head.camera.fov * Math.PI) / 360) / at.r * 1.06;
      head.pos.copy(r.direction).multiplyScalar(t).add(r.origin);
      if (head.pos.y < REST) head.pos.y = REST;
      head.vel.set((Math.random() - 0.5) * 3, 6.5, -1.2);
      head.face.visible = true;
      head.skull.visible = false;
      head.bits.forEach(function (b) { b.mesh.visible = false; b.age = 9; });
      bursting = false;
      strain = 0;
      head.w.set(5, 0, (Math.random() - 0.5) * 7);
      head.q.set(0, 0, 0, 1);
      head.s = 1.25;
      head.sv = 0;
      head.pk = 1; head.pkv = 0; head.shx = head.shz = head.shvx = head.shvz = 0; head.kd = 1;
      head.rest = 1;
      head.outer.visible = head.shadow.visible = true;
      homing = null;
      parked = false;
    }
    function neckSpot(out) { // the place in the 3D scene that lines up with the figure's own head
      var at = figureHead(), r = aim(at.x, at.y);
      var t = (H / 2) / Math.tan((head.camera.fov * Math.PI) / 360) / at.r * 1.06;
      return out.copy(r.direction).multiplyScalar(t).add(r.origin);
    }
    function floorSpot() { // where the head touches the floor, on screen
      head.v4.set(head.pos.x, 0, head.pos.z).project(head.camera);
      return { x: (head.v4.x + 1) / 2 * W, y: (1 - head.v4.y) / 2 * H };
    }
    function stepHead(dt) {
      var p = head.pos, v = head.vel;
      if (homing) { // "Put it back": it flies up to the neck in an arc, righting itself on the way
        homing.t += dt;
        var hu = Math.min(1, homing.t / 0.5), he = hu * hu * (3 - 2 * hu);
        p.lerpVectors(homing.from, homing.to, he);
        p.y += Math.sin(hu * Math.PI) * 1.6;
        v.set(0, 0, 0);
        head.w.set(0, 0, 0);
        head.q.slerp(head.tmp.set(0, 0, 0, 1), Math.min(1, dt * 10));
        if (hu >= 1) { homing = null; parked = true; head.sv += 6; glitchScreen(30); setSkull(false); }
      } else if (parked) {
        v.set(0, 0, 0);
        head.w.set(0, 0, 0);
      } else if (held && grabAt && !pinch) {
        // it follows the finger anywhere on the floor, lifted a little; its speed is the speed it is thrown with
        // the hand may go to the very edge of the screen, the head stops a little short of it
        var box = bounds();
        var gx2 = Math.max(box.l, Math.min(box.r, grabAt.x)), gy2 = Math.max(box.t, Math.min(box.b, grabAt.y));
        if (aim(gx2, gy2).intersectPlane(head.plane, head.hit)) {
          var tz = Math.max(FAR, head.hit.z);
          v.x = (head.hit.x - p.x) * 14;
          v.z = (tz - p.z) * 14;
          v.y = (REST + 0.45 - p.y) * 14;
          head.sv += Math.hypot(v.x, v.z) * 0.02 * (Math.random() - 0.4); // it wobbles as it is dragged
          // shaken hard one way and then the other: each fast change of direction strains it
          var sxn = Math.abs(v.x) > 9 ? (v.x > 0 ? 1 : -1) : 0, szn = Math.abs(v.z) > 9 ? (v.z > 0 ? 1 : -1) : 0;
          if (sxn && lastSx && sxn !== lastSx) strain += 0.14;
          if (szn && lastSz && szn !== lastSz) strain += 0.14;
          if (sxn) lastSx = sxn;
          if (szn) lastSz = szn;
        }
      } else if (pinch) {
        // held between two fingers: it follows the point between them, lifted a little more
        if (grabAt && aim(grabAt.x, grabAt.y).intersectPlane(head.plane, head.hit)) {
          v.x = (head.hit.x - p.x) * 12;
          v.z = (Math.max(FAR, head.hit.z) - p.z) * 12;
        }
        v.y = (REST + 0.7 - p.y) * 12;
      } else {
        v.y -= 30 * dt;
      }
      p.addScaledVector(v, dt);

      // strain: fades when left alone, makes it tremble as it grows
      if (!bursting) {
        strain = Math.max(0, strain - dt * (held ? 0.06 : 0.11));
        if (strain > 0.3 && !reduceMotion) {
          var shake = (strain - 0.3) * 1.6;
          head.sv += (Math.random() - 0.5) * shake * 26;
          head.shvx += (Math.random() - 0.5) * shake * 16;
          head.shvz += (Math.random() - 0.5) * shake * 16;
          if (strain > 0.65 && Math.random() < 0.3) { // close to breaking: the picture starts to tear around it
            head.proj.copy(p).project(head.camera);
            var gxp = (head.proj.x + 1) / 2 * W, gyp = (1 - head.proj.y) / 2 * H, ga2 = Math.random() * 6.283;
            trail.push({ x: gxp + Math.cos(ga2) * 90, y: gyp + Math.sin(ga2) * 90, vx: Math.cos(ga2) * 700, vy: Math.sin(ga2) * 200, life: 0.4 });
          }
        }
        if (strain >= 1) burstHead();
      }
      // jelly: a spring pulls it back to its shape, so it overshoots and wobbles
      if (performance.now() - wheelAt > 260) head.rest += (1 - head.rest) * Math.min(1, dt * 5); // a wheel stretch relaxes once the wheel stops
      head.sv += (-(head.s - head.rest) * 170 - head.sv * 5) * dt;
      head.s += head.sv * dt;
      // it leans back against its own motion, and swings past upright when it stops
      var leanX = Math.max(-0.7, Math.min(0.7, -v.x * 0.04)), leanZ = Math.max(-0.7, Math.min(0.7, -v.z * 0.04));
      head.shvx += ((leanX - head.shx) * 130 - head.shvx * 4.5) * dt;
      head.shvz += ((leanZ - head.shz) * 130 - head.shvz * 4.5) * dt;
      head.shx += head.shvx * dt;
      head.shz += head.shvz * dt;
      // it stretches along the way it is going
      var speed = v.length();
      if (speed > 0.6) head.dir.lerp(head.v3.copy(v).multiplyScalar(1 / speed), Math.min(1, dt * 12)).normalize();
      head.kd += (1 + Math.min(0.55, speed * 0.028) - head.kd) * Math.min(1, dt * 10);
      // a two-finger stretch, once let go, snaps back and wobbles
      if (!pinch) {
        head.pkv += (-(head.pk - 1) * 170 - head.pkv * 5) * dt;
        head.pk += head.pkv * dt;
      }

      var floor = REST * Math.min(1, head.s);
      var onFloor = p.y <= floor && !homing && !parked;
      if (onFloor) {
        if (v.y < -3) { // lands, squashes, bounces; a hard landing strains it
          if (v.y < -9) strain += Math.min(0.14, (-v.y - 9) * 0.02);
          head.sv -= -v.y * 0.5;
          if (day && !bursting) { // the floor tears where it lands, harder the harder it hits
            var hit = -v.y, fs2 = floorSpot();
            spark(fs2.x, fs2.y, Math.min(14, Math.round(3 + hit * 0.7)), head.rpx * 1.1, 500 + hit * 80, Math.min(0.85, 0.3 + hit * 0.035), true);
          }
          v.y = -v.y * 0.52;
        }
        else if (v.y < 0) v.y = 0;
        p.y = floor;
        if (!held) { var f = Math.pow(0.32, dt); v.x *= f; v.z *= f; }
      }
      if (onFloor || held) head.w.set(v.z, 0, -v.x); // rolls the way it travels
      var turn = head.w.length() * dt;
      if (turn > 1e-5) {
        head.tmp.setFromAxisAngle(head.ax.copy(head.w).normalize(), turn);
        head.q.premultiply(head.tmp);
      }
      // free to roam the whole screen, and never out of it: it bounces off the screen's own edges
      if (p.z < FAR) { p.z = FAR; v.z = Math.abs(v.z) * 0.6; }
      head.proj.copy(p).project(head.camera);
      var px = (head.proj.x + 1) / 2 * W, py = (1 - head.proj.y) / 2 * H;
      head.v3.setFromMatrixColumn(head.camera.matrixWorld, 0).multiplyScalar(1.3).add(p).project(head.camera);
      head.rpx = Math.abs((head.v3.x + 1) / 2 * W - px); // how big it is on screen right now
      if (!held) {
        var bx = bounds();
        var knock = 0;
        if (px < bx.l && v.x < 0) { knock = Math.abs(v.x); v.x = -v.x * 0.7; head.sv += 3; }
        if (px > bx.r && v.x > 0) { knock = Math.abs(v.x); v.x = -v.x * 0.7; head.sv += 3; }
        if (py > bx.b && v.z > 0) { knock = Math.abs(v.z); v.z = -v.z * 0.7; head.sv += 3; }
        if (knock > 3 && day && !bursting) spark(px, py, 5, head.rpx, 600, 0.45); // it also tears the picture where it hits the edge of the screen
        if (py < bx.t) { // the top of the screen is a ceiling in the air and a back wall on the floor
          if (v.y > 0) v.y = -v.y * 0.3;
          if (v.z < 0) v.z = -v.z * 0.7;
        }
      }
      // rolling or dragged along the floor, it leaves a torn wake behind it
      if (day && !bursting && !homing && !parked && !reduceMotion && p.y < REST + 0.7) {
        var fs3 = floorSpot(), wd = Math.hypot(fs3.x - wakeX, fs3.y - wakeY);
        if (wd > 400) { wakeX = fs3.x; wakeY = fs3.y; }
        else if (wd > 16) {
          var wk = Math.min(1, wd / (dt * 900)); // faster: a longer-lived, harder pull
          trail.push({ x: fs3.x, y: fs3.y, vx: (fs3.x - wakeX) / dt, vy: (fs3.y - wakeY) / dt, life: 0.35 + 0.35 * wk, rk: 0.75 });
          if (trail.length > 170) trail.splice(0, trail.length - 170);
          wakeX = fs3.x; wakeY = fs3.y;
        }
      }
      stepBits(dt);
      var s = Math.max(0.1, head.s), side = 1 / Math.sqrt(s);
      // The whole shape in one matrix, applied in this order: squash, stretch along the path,
      // stretch between the fingers, lean, then move into place.
      var M = head.mat.makeScale(side, s, side);
      M.premultiply(alongLine(head.m2, head.dir, head.kd));
      M.premultiply(alongLine(head.m2, head.pdir, Math.max(0.1, head.pk)));
      M.premultiply(head.m2.set(1, head.shx, 0, 0, 0, 1, 0, 0, 0, head.shz, 1, 0, 0, 0, 0, 1));
      M.setPosition(p.x, p.y, p.z);
      head.outer.matrixAutoUpdate = false;
      head.outer.matrix.copy(M);
      head.outer.matrixWorldNeedsUpdate = true;
      head.group.quaternion.copy(head.q);
      var lift = p.y - REST;
      head.shadow.position.set(p.x, 0.01, p.z);
      head.shadow.scale.set(side / (1 + lift * 0.3), side / (1 + lift * 0.3), 1);
      head.shadow.material.opacity = 0.5 / (1 + lift * 0.7);
      head.renderer.render(head.scene, head.camera);
      // pushed too far out of shape, it bursts
      if (!bursting && (head.s > BURST_HI || head.s < BURST_LO || head.pk > BURST_HI || head.pk < BURST_LO)) burstHead();
    }
    // A matrix that stretches by k along one line and thins the shape across it, keeping its volume.
    function alongLine(out, d, k) {
      var q = 1 / Math.sqrt(k), e = k - q;
      return out.set(
        q + e * d.x * d.x, e * d.x * d.y, e * d.x * d.z, 0,
        e * d.y * d.x, q + e * d.y * d.y, e * d.y * d.z, 0,
        e * d.z * d.x, e * d.z * d.y, q + e * d.z * d.z, 0,
        0, 0, 0, 1
      );
    }
    var EDGE = 0.037; // the canvas is a little larger than the screen, by this share on each side
    function bounds() { // the part of the canvas the head's centre may be in, in canvas pixels
      var r = head.rpx;
      return { l: W * EDGE + r, r: W * (1 - EDGE) - r, t: H * EDGE + 56 + r, b: H * (1 - EDGE) - r * 0.7 };
    }
    function stepBits(dt) { // drops stretch as they fly, then land as puddles that spread and soak away
      for (var i = 0; i < head.bits.length; i++) {
        var b = head.bits[i];
        if (!b.mesh.visible) continue;
        b.age += dt;
        if (!b.down) {
          b.vel.y -= 30 * dt;
          b.mesh.position.addScaledVector(b.vel, dt);
          var sp = b.vel.length(), k = 1 + Math.min(1.6, sp * 0.09); // long and thin along its path, like a drip
          if (sp > 0.01) b.mesh.quaternion.setFromUnitVectors(head.ax.set(0, 1, 0), head.v3.copy(b.vel).multiplyScalar(1 / sp));
          b.mesh.scale.set(b.r / Math.sqrt(k), b.r * k, b.r / Math.sqrt(k));
          if (b.mesh.position.y < b.r * 0.4) { b.down = true; b.spread = 0; b.mesh.position.y = 0.03; b.mesh.quaternion.set(0, 0, 0, 1); }
        } else {
          b.spread = Math.min(1, b.spread + dt * 3.5);
          var e = 1 - (1 - b.spread) * (1 - b.spread);
          var gone = b.age < 1.5 ? 1 : Math.max(0, 1 - (b.age - 1.5) / 0.7);
          var wide = b.r * (1 + 0.8 * e) * gone; // a soft dome of a puddle, not a flat disc
          b.mesh.scale.set(wide, b.r * (0.6 - 0.32 * e) * gone, wide);
          if (gone <= 0) b.mesh.visible = false;
        }
      }
    }
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onSkull(pt) { return aim(pt.x, pt.y).distanceToPoint(head.pos) < 1.5; }
    hero.addEventListener("pointerdown", function (e) {
      if (!day || !head || bursting || homing) return;
      var pt = local(e);
      touches[e.pointerId] = pt;
      var ids = Object.keys(touches);
      if (ids.length === 2 && (held || onSkull(pt))) { // a second finger: stretch it between the two
        var a = touches[ids[0]], b = touches[ids[1]];
        pinch = { d0: Math.max(70, Math.hypot(a.x - b.x, a.y - b.y)), // fingers that start close together do not over-stretch it at once
          k0: head.pk, ang: Math.atan2(b.y - a.y, b.x - a.x) };
        grabAt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        held = true;
        return;
      }
      if (!onSkull(pt)) return;
      head.proj.copy(head.pos).project(head.camera);
      spark((head.proj.x + 1) / 2 * W, (1 - head.proj.y) / 2 * H, 8, head.rpx * 1.1, 800, 0.42); // it glitches where it is touched
      held = true;
      grabAt = pt;
      downAt = { x: pt.x, y: pt.y, t: performance.now() };
      hero.classList.add("is-holding");
      try { hero.setPointerCapture(e.pointerId); } catch (err) {}
    });
    hero.addEventListener("pointermove", function (e) {
      if (!touches[e.pointerId]) return;
      var pt = local(e);
      touches[e.pointerId] = pt;
      if (pinch) {
        var ids = Object.keys(touches);
        if (ids.length < 2) return;
        var a = touches[ids[0]], b = touches[ids[1]];
        // it stretches along the line between the fingers, whatever angle that is
        var e = head.camera.matrixWorld.elements, dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
        head.pdir.set(e[0] * dx - e[4] * dy, e[1] * dx - e[5] * dy, e[2] * dx - e[6] * dy).multiplyScalar(1 / dl).normalize();
        head.pk = pinch.k0 * (dl / pinch.d0);
        head.pkv = 0;
        // turning the fingers turns it; moving them together carries it
        var ang = Math.atan2(dy, dx), turned = ang - pinch.ang;
        if (turned > Math.PI) turned -= 2 * Math.PI;
        if (turned < -Math.PI) turned += 2 * Math.PI;
        pinch.ang = ang;
        head.tmp.setFromAxisAngle(head.camera.getWorldDirection(head.v4), turned);
        head.q.premultiply(head.tmp);
        grabAt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        return;
      }
      if (held) grabAt = pt;
    });
    function letGo(e) {
      delete touches[e.pointerId];
      if (!held) return;
      if (pinch) { // let go of a stretch: it snaps back and wobbles
        pinch = null;
        held = false;
        grabAt = null;
        touches = {};
        hero.classList.remove("is-holding");
        return;
      }
      held = false;
      hero.classList.remove("is-holding");
      if (!head) return;
      var quick = downAt && performance.now() - downAt.t < 260 && Math.hypot(grabAt.x - downAt.x, grabAt.y - downAt.y) < 8;
      // a tap makes it jump; a throw carries a hop with it
      head.vel.y = quick ? 10 : Math.min(15, Math.hypot(head.vel.x, head.vel.z) * 0.3);
      if (quick) { head.sv += 5; strain += 0.2; } // tapped again and again, it gives way
    }
    hero.addEventListener("pointerup", letGo);
    hero.addEventListener("pointercancel", letGo);
    // with a mouse there is no second finger: the wheel stretches it while the pointer is on it
    hero.addEventListener("wheel", function (e) {
      if (!day || !head || bursting) return;
      if (!onSkull(local(e))) return;
      e.preventDefault();
      head.rest = Math.max(0.1, Math.min(4.8, head.rest * Math.exp(-e.deltaY * 0.0011)));
      wheelAt = performance.now();
    }, { passive: false });

    window.__head = function () { // for poking at it from the console: where it is on screen and on the floor
      if (!head) return null;
      head.proj.copy(head.pos).project(head.camera);
      var cr = canvas.getBoundingClientRect();
      return { x: Math.round((head.proj.x + 1) / 2 * W + cr.left), y: Math.round((1 - head.proj.y) / 2 * H + cr.top), fx: +head.pos.x.toFixed(2), fy: +head.pos.y.toFixed(2), fz: +head.pos.z.toFixed(2), s: +head.s.toFixed(2), strain: +strain.toFixed(2), bursting: bursting, on: day };
    };

    var dayBtn = document.getElementById("daybtn");
    function glitchScreen(points) { // the switch itself is a glitch: the screen jolts and tears cross it
      var gallery = document.getElementById("view-gallery");
      gallery.classList.remove("is-switching");
      void gallery.offsetWidth;
      gallery.classList.add("is-switching");
      setTimeout(function () { gallery.classList.remove("is-switching"); }, 520);
      burst(intro.querySelector("h1"));
      if (reduceMotion) return;
      for (var i = 0; i < points; i++) {
        var a = Math.random() * 6.283;
        trail.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * 900, vy: Math.sin(a) * 300, life: 0.5 + Math.random() * 0.5 });
      }
    }
    function setSkull(on) {
      if (on === day) return;
      day = on;
      document.getElementById("view-gallery").classList.toggle("is-skull", day);
      document.body.classList.toggle("is-skull", day);
      size(); // the canvas resolution depends on the mode
      fitHead();
      burst(intro.querySelector("h1"));
      if (dayBtn) {
        dayBtn.setAttribute("aria-pressed", String(day));
        document.getElementById("daybtn-label").textContent = day ? "Put it back" : "Behead";
      }
      document.getElementById("room-count").textContent = "";
      held = false;
      pinch = null;
      touches = {};
      clearTimeout(burstTimer);
      bursting = false;
      strain = 0;
      if (day) {
        heroVideo.pause();
        dayT = 0;
        loadThree(function () {
          if (!head) { head = buildHead(); fitHead(); }
          if (day) {
            dropHead();
            var at = figureHead(); // the cut at the neck, and tears running down the body as it dissolves
            spark(at.x, at.y + at.r * 0.9, 9, at.r * 1.2, 900, 0.55, true);
            for (var i = 0; i < 8; i++) trail.push({ x: at.x + (Math.random() - 0.5) * at.r * 2.6, y: at.y + at.r * (1.2 + Math.random() * 3.2), vx: (Math.random() - 0.5) * 1400, vy: 120, life: 0.4 + Math.random() * 0.4 });
          }
        });
      } else {
        nightT = 0; // the figure fades back in while the head or skull fades out
        if (!reduceMotion) {
          var pl = heroVideo.play();
          if (pl && pl.catch) pl.catch(function () {});
        }
      }
    }
    function burstHead() { // the jelly pops into lumps, the skull is left behind, then the whole figure returns
      if (!day || bursting) return;
      bursting = true;
      held = false;
      pinch = null;
      touches = {};
      hero.classList.remove("is-holding");
      head.face.visible = false;
      head.skull.visible = true;
      head.s = 1.35;
      head.sv = 0;
      head.pk = 1; head.pkv = 0; head.shx = head.shz = head.shvx = head.shvz = 0; head.kd = 1;
      head.rest = 1;
      head.vel.set(head.vel.x * 0.15, 6.5, head.vel.z * 0.15); // the skull only hops, so the eye can stay on it
      head.bits.forEach(function (b, i) {
        var a = (i / head.bits.length) * 6.283 + Math.random() * 0.6, up = 1 + Math.random() * 7, out = 1.5 + Math.random() * 5;
        b.r = 0.12 + Math.random() * Math.random() * 0.5; // mostly small drops, a few big ones
        b.age = 0;
        b.down = false;
        b.mesh.position.copy(head.pos);
        b.mesh.position.x += Math.cos(a) * 0.5;
        b.mesh.position.z += Math.sin(a) * 0.5;
        b.vel.set(Math.cos(a) * out, up, Math.sin(a) * out);
        if (i < 3) { // the bulk of it slumps straight down into a pool under the skull
          b.r = 0.6 - i * 0.12;
          b.vel.set(Math.cos(a) * 0.8, -2, Math.sin(a) * 0.8);
        }
        b.mesh.visible = true;
      });
      head.proj.copy(head.pos).project(head.camera);
      pop = { x: (head.proj.x + 1) / 2 * W, y: (1 - head.proj.y) / 2 * H, t: 0, r: head.rpx };
      if (!reduceMotion) {
        for (var i = 0; i < 9; i++) { // only a few short tears, so the picture stays readable
          var ta = (i / 9) * 6.283;
          trail.push({ x: pop.x + Math.cos(ta) * pop.r, y: pop.y + Math.sin(ta) * pop.r, vx: Math.cos(ta) * 700, vy: Math.sin(ta) * 250, life: 0.4 });
        }
      }
      burstTimer = setTimeout(function () { // once the puddles have soaked away, the screen glitches back to the figure
        glitchScreen(36);
        setSkull(false);
      }, 2500);
    }
    if (dayBtn) dayBtn.addEventListener("click", function () {
      if (homing) return;
      if (!day) { glitchScreen(16); setSkull(true); return; }
      if (head && !bursting && !reduceMotion && head.outer.visible) { // the head flies back to the neck first, then the figure returns under it
        held = false; pinch = null; touches = {};
        hero.classList.remove("is-holding");
        homing = { t: 0, from: head.pos.clone(), to: neckSpot(new window.THREE.Vector3()) };
        return;
      }
      glitchScreen(30);
      setSkull(false);
    });
    window.addEventListener("resize", function () { size(); fitHead(); });

    function draw(now) {
      requestAnimationFrame(draw);
      if (!heroOn) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (canvas.clientWidth !== W || canvas.clientHeight !== H) { size(); fitHead(); }
      var frame = heroVideo.readyState >= 2 ? heroVideo : (poster.complete && poster.naturalWidth ? poster : null);
      var src = day ? null : frame;
      var torn = trail.length > 0;
      if (!day && !torn && nightT > 0.9 && src) { // idle home screen: the video only has a new frame 30 times a second
        var key = src === heroVideo ? heroVideo.currentTime : -1;
        if (key === lastKey && !dirty) return;
        lastKey = key;
      } else lastKey = -2;
      dirty = false;
      // The clean frame goes straight to the screen unless it has to be torn first. Tearing needs a
      // solid picture, so anything see-through (the fading figure, the 3D head and its shadow) is
      // drawn on a layer of its own, then flattened onto the page colour for the torn cells to use.
      var layered = torn && (day || nightT < 0.8);
      if (layered && (tint.width !== buf.width || tint.height !== buf.height)) { tint.width = buf.width; tint.height = buf.height; }
      var g0 = layered ? tctx : (torn ? bctx : ctx);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      if (!day && !src) return;

      // 1. the clean frame
      var sw = 1, sh = 1, scale = 1, cx = W * 0.5, cy = H * 0.5;
      if (torn) {
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bctx.globalAlpha = 1;
        bctx.clearRect(0, 0, W, H);
      }
      if (layered) {
        tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        tctx.globalAlpha = 1;
        tctx.globalCompositeOperation = "source-over";
        tctx.clearRect(0, 0, W, H);
      }
      if (day) {
        dayT += dt;
        if (frame && dayT < 0.8) { // the body fades away after the head leaves it
          var fw = frame.videoWidth || frame.naturalWidth, fh = frame.videoHeight || frame.naturalHeight;
          var ftall = W / H < 0.8, fs = Math.max(W / fw, H / fh) * (ftall ? 0.74 : 1), fy = H * (ftall ? 0.56 : 0.5);
          var fade = 1 - dayT / 0.8;
          g0.globalAlpha = fade * fade * (3 - 2 * fade);
          g0.drawImage(frame, cx - (fw * fs) / 2, fy - (fh * fs) / 2, fw * fs, fh * fs);
          g0.globalAlpha = 1;
          // soft-edged, so it dissolves instead of leaving a hard shape
          var mrx = fh * fs * 0.3, mry = fh * fs * 0.46;
          g0.globalCompositeOperation = "destination-in";
          g0.save();
          g0.translate(cx, fy);
          g0.scale(mrx / mry, 1);
          var mg = g0.createRadialGradient(0, 0, mry * 0.3, 0, 0, mry);
          mg.addColorStop(0, "rgba(0,0,0,1)");
          mg.addColorStop(1, "rgba(0,0,0,0)");
          g0.fillStyle = mg;
          g0.fillRect(-mry * 4, -mry * 4, mry * 8, mry * 8);
          g0.restore();
          g0.globalCompositeOperation = "source-over";
        }
        if (head) {
          stepHead(dt);
          var glEl = head.renderer.domElement;
          if (torn && day) { g0.drawImage(glEl, 0, 0, W, H); glEl.style.visibility = "hidden"; }
          else { glEl.style.visibility = "visible"; glEl.style.opacity = "1"; }
        }
        if (pop) { // a ring opening out from where it burst
          pop.t += dt;
          var pk2 = pop.t / 0.45;
          if (pk2 >= 1) pop = null;
          else {
            g0.strokeStyle = "rgba(199,156,196," + (1 - pk2).toFixed(3) + ")";
            g0.lineWidth = 10 * (1 - pk2) + 1;
            g0.beginPath();
            g0.arc(pop.x, pop.y, pop.r * (0.7 + pk2 * 0.9), 0, 6.2832);
            g0.stroke();
          }
        }
      } else {
        sw = src.videoWidth || src.naturalWidth;
        sh = src.videoHeight || src.naturalHeight;
        var tall = W / H < 0.8;
        // the figure sits in the middle of the screen; on a tall screen it is drawn smaller so it fits under the name
        scale = Math.max(W / sw, H / sh) * (tall ? 0.74 : 1);
        cy = H * (tall ? 0.56 : 0.5);
        nightT += dt;
        var back = Math.min(1, nightT / 0.8);
        g0.globalAlpha = back * back * (3 - 2 * back); // fades in when coming back from head mode
        g0.drawImage(src, cx - (sw * scale) / 2, cy - (sh * scale) / 2, sw * scale, sh * scale);
        g0.globalAlpha = 1;
      }
      if (layered) {
        bctx.fillStyle = underColour();
        bctx.fillRect(0, 0, W, H);
        bctx.drawImage(tint, 0, 0, W, H);
        ctx.drawImage(tint, 0, 0, W, H);
      } else if (torn) ctx.drawImage(buf, 0, 0, W, H);

      // 2. the wake. Every live point on the path adds its pull to a coarse grid of cells, so
      //    overlapping points build up instead of overwriting each other.
      while (trail.length && trail[0].life <= 0) trail.shift();
      if (trail.length) {
        var cols = Math.ceil(W / CELL), rows = Math.ceil(H / ROW);
        if (gx.length !== cols * rows) { gx = new Float32Array(cols * rows); gy = new Float32Array(cols * rows); ga = new Float32Array(cols * rows); }
        var c0 = cols, c1 = -1, r0 = rows, r1 = -1;
        for (var k = 0; k < trail.length; k++) {
          var p = trail[k];
          p.life -= dt / LINGER;
          if (p.life <= 0) continue;
          var ease = p.life * p.life * (3 - 2 * p.life);       // settles gently at the end
          var reach = REACH * (p.rk || 1) * (0.4 + 0.6 * ease);
          var speed = Math.hypot(p.vx, p.vy);
          var drag = Math.min(60, 10 + speed * PULL) * ease;
          var ux = speed > 1 ? p.vx / speed : 1, uy = speed > 1 ? p.vy / speed : 0;
          var ca = Math.max(0, Math.floor((p.x - reach) / CELL)), cb = Math.min(cols - 1, Math.floor((p.x + reach) / CELL));
          var ra = Math.max(0, Math.floor((p.y - reach) / ROW)), rb = Math.min(rows - 1, Math.floor((p.y + reach) / ROW));
          for (var r = ra; r <= rb; r++) {
            var oy = (r + 0.5) * ROW - p.y;
            for (var c = ca; c <= cb; c++) {
              var ox = (c + 0.5) * CELL - p.x;
              var f = 1 - (ox * ox + oy * oy) / (reach * reach);   // strongest on the path
              if (f <= 0) continue;
              var id = r * cols + c;
              gx[id] += ux * drag * f * 0.5;
              gy[id] += uy * drag * f * 0.2;
              if (ease * f > ga[id]) ga[id] = ease * f;
            }
          }
          if (ca < c0) c0 = ca;
          if (cb > c1) c1 = cb;
          if (ra < r0) r0 = ra;
          if (rb > r1) r1 = rb;
        }
        if (c1 >= c0) {
          var tx = Math.max(0, Math.floor((c0 * CELL - 130) * dpr)), ty = Math.max(0, Math.floor((r0 * ROW - 40) * dpr));
          var tw = Math.min(buf.width, Math.ceil(((c1 + 1) * CELL + 130) * dpr)) - tx, th = Math.min(buf.height, Math.ceil(((r1 + 1) * ROW + 40) * dpr)) - ty;
          tinted(rctx, bufR, "#ff0000", tx, ty, tw, th);
          tinted(cctx, bufC, "#00ffff", tx, ty, tw, th);
          var tick = Math.floor(now / 80);
          for (var r = r0; r <= r1; r++) {
            var n1 = noise(r, tick), tear = n1 > 0.88 ? 2.4 : 1;   // now and then a whole row jumps further
            var y0 = r * ROW;
            for (var c = c0; c <= c1; c++) {
              var id = r * cols + c, a = ga[id];
              if (a <= 0) continue;
              if (a < 0.03) { gx[id] = gy[id] = ga[id] = 0; continue; } // too faint to see: not worth two draws
              var dx = Math.max(-90, Math.min(90, (gx[id] + (n1 - 0.5) * 22 * a) * tear));
              var dy = Math.max(-30, Math.min(30, gy[id]));
              var fringe = (2 + Math.abs(dx) * 0.22) * Math.min(1, a * 1.5);
              gx[id] = gy[id] = ga[id] = 0;
              var x0 = c * CELL, sx = x0 - dx, sy = y0 - dy;
              // The red part of the picture and the blue-green part are drawn separately, pulled apart.
              // Added together they give back the original exactly, so a settled cell leaves no mark.
              ctx.globalCompositeOperation = "source-over";
              ctx.clearRect(x0, y0, CELL, ROW);
              ctx.globalCompositeOperation = "lighter";
              ctx.drawImage(bufR, (sx + fringe) * dpr, sy * dpr, CELL * dpr, ROW * dpr, x0, y0, CELL, ROW);
              ctx.drawImage(bufC, (sx - fringe) * dpr, sy * dpr, CELL * dpr, ROW * dpr, x0, y0, CELL, ROW);
            }
          }
        }
      }

      // 3. fade the clip's own backdrop away around the figure
      if (day) { ctx.globalCompositeOperation = "source-over"; return; }
      var rx = sh * scale * 0.42, ry = sh * scale * 0.56;
      ctx.globalCompositeOperation = "destination-in";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(rx / ry, 1);
      var g = ctx.createRadialGradient(0, 0, ry * 0.45, 0, 0, ry);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-ry * 3, -ry * 3, ry * 6, ry * 6);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
      if (head && nightT < 0.6) { // what was left of head mode fades out over the returning figure
        stepHead(dt);
        head.renderer.domElement.style.visibility = "visible";
        head.renderer.domElement.style.opacity = (1 - nightT / 0.6).toFixed(2);
      } else if (head) head.renderer.domElement.style.visibility = "hidden";
    }
    requestAnimationFrame(draw);

    if (reduceMotion) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
      return;
    }
    // the figure leans a little towards the pointer
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      stage.style.transform = "translate3d(" + (-x * 26).toFixed(1) + "px," + (-y * 18).toFixed(1) + "px,0) rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg)";
    });
  }

  if (document.getElementById("hero")) {
    startHero();
  } else if (!startWalk()) {
    buildGallery();
    wireRoom();
  } else {
    startHomes();
  }
  /* About: bio, contact, links, experience and talks, from js/projects.js */
  function buildAbout() {
    var about = site.about;
    if (!about || !document.getElementById("view-about")) return;
    function byId(id) { return document.getElementById(id); }
    byId("about-lead").textContent = about.lead;
    byId("about-text").textContent = about.text;
    var mail = byId("about-mail");
    mail.textContent = site.email;
    mail.href = "mailto:" + site.email;
    site.links.forEach(function (l) { byId("about-links").appendChild(outLink(l.label + " ↗", l.url)); });
    var img = el("img");
    img.src = about.photo.src;
    img.alt = about.photo.alt;
    img.loading = "lazy";
    byId("about-photo").appendChild(img);
    byId("about-photo").appendChild(el("figcaption", null, about.photo.credit));
    about.experience.forEach(function (x) {
      var r = el("div", "xrow");
      r.appendChild(el("span", "xrow__when", x.when));
      var b = el("span", "xrow__body");
      b.appendChild(el("strong", null, x.who));
      b.appendChild(el("span", null, x.what));
      r.appendChild(b);
      byId("experience").appendChild(r);
    });
    about.talks.forEach(function (t) {
      var a = outLink("", t.url, "xrow xrow--link");
      var b = el("span", "xrow__body");
      b.appendChild(el("strong", null, t.title + " ↗"));
      b.appendChild(el("span", null, t.sub));
      a.appendChild(b);
      byId("talks").appendChild(a);
    });
    byId("about-foot").appendChild(el("span", null, "© " + new Date().getFullYear() + " " + site.name));
    byId("about-foot").appendChild(el("span", null, site.motto));
  }
  var indexNote = document.getElementById("index-note");
  if (indexNote && site.portfolio) {
    indexNote.appendChild(document.createTextNode("Images of the work are on "));
    indexNote.appendChild(outLink(site.portfolio.label + " ↗", site.portfolio.url));
    indexNote.appendChild(document.createTextNode(" for now."));
  }

  /* Play: the interactive sites, in the same light style as the Index. The names run down a long
     diagonal staircase that crosses the screen and carries on past its edges; scrolling slides the
     whole staircase along that diagonal. Clicking a name picks it: the others fly apart along the
     diagonal, and a moment later a preview opens behind it. Clicking it again opens the site. */
  /* Play as a wheel. The names sit on the rim of a big wheel seen almost edge-on: the ones in front run
     down the same diagonal as before, then the rim bends away, and the far side shows behind, smaller,
     soft and faint. Scrolling spins it, and it never ends. Picking a name parts its neighbours and the
     name opens out into its preview, where it stays as a tag in the corner. */
  function buildPlayWheel() {
    var view = document.getElementById("view-play"), items = site.play;
    if (!view || !items) return;
    view.classList.add("is-wheel");
    var list = document.getElementById("play-list"), frame = document.getElementById("play-frame");
    var shot = document.getElementById("play-shot"), cap = document.getElementById("play-cap"), go = document.getElementById("play-go");
    var SLOTS = Math.ceil(30 / items.length) * items.length;  // the list repeats until the rim is full
    var STEP = (Math.PI * 2) / SLOTS, GAP = 0.2;              // GAP: how far neighbours part around a chosen name
    var nodes = [], active = -1, opened = false, rot = 0, rotTo = 0, spinning = false;
    var vel = 0;                       // spin left over after a flick, in radians a second
    var gap = 0, gapTo = 0, gapK = -1; // how far the neighbours have parted, and around which name
    var running = false, lastT = 0, spread = 150;
    var R = 300, lineH = 50, slope = 1, ax = 200, ay = 300, pickedAt = 0, lastPointer = "mouse", dragged = false;
    var hoverK = -1;
    var hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function wrap(a) { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; }
    function layout() {
      for (var k = 0; k < SLOTS; k++) {
        var n = nodes[k], th = wrap(k * STEP - rot);
        var depth = Math.cos(th), y = R * Math.sin(th);
        var x = y * slope + (1 - depth) * R * 0.38; // the far side of the rim sits off to the right, so the wheel reads as a ring
        if (gapK >= 0 && k !== gapK && gap > 0) { // the names before and after slide apart along the diagonal, leaving room for the thumbnail
          var push = (wrap((k - gapK) * STEP) > 0 ? 1 : -1) * spread * gap;
          y += push;
          x += push * slope * 0.6;
        }
        var z = R * (depth - 1);
        n.style.transform = "translate3d(" + (ax + x).toFixed(1) + "px," + (ay + y - lineH / 2).toFixed(1) + "px," + z.toFixed(1) + "px)" +
          (depth > 0 ? " rotateX(" + (-th * 0.5).toFixed(3) + "rad)" : "");
        var op = depth > 0 ? 0.16 + 0.84 * depth * depth : 0.07 + 0.09 * (1 + depth);
        var blur = depth > 0 ? (1 - depth) * 3.5 : 3.5 + -depth * 2.5;
        if (gapK >= 0 && k !== gapK) { op *= 1 - 0.6 * gap; blur += gap; }
        if (k === active) { op = opened ? 0 : 1; blur = 0; } // the name has become its preview
        n.style.opacity = op.toFixed(3);
        var b = Math.round(blur * 2) / 2;
        if (n._blur !== b) { n._blur = b; n.style.filter = b ? "blur(" + b + "px)" : "none"; }
        n.style.zIndex = String(200 + Math.round(depth * 100));
        n.style.pointerEvents = depth > 0.5 && k !== active ? "auto" : "none";
      }
    }
    // Opening is one movement on one clock: the wheel turns the chosen name to the middle, the
    // neighbours part, and the name grows into its thumbnail, all eased together.
    var OPEN = 520, CLOSE = 300, tw = null, grow = null;
    var IDLE = 0.05, idleK = 0, idleDir = 1, idleAt = 0; // radians a second: about one name every three and a half seconds
    function ease(u) { return 1 - Math.pow(1 - u, 3); }
    function place(e) { // the frame, somewhere between the word it started as and its full size
      if (!grow) return;
      frame.style.transform = "translate(" + (grow.dx * (1 - e)).toFixed(1) + "px," + (grow.dy * (1 - e)).toFixed(1) + "px) scale(" +
        (grow.sx + (1 - grow.sx) * e).toFixed(4) + "," + (grow.sy + (1 - grow.sy) * e).toFixed(4) + ")";
    }
    function tick(now) {
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (tw) {
        var u = Math.min(1, (now - tw.t0) / tw.d), e = ease(u);
        gap = tw.g0 + (tw.g1 - tw.g0) * e;
        if (tw.turn) { rot = tw.r0 + (tw.r1 - tw.r0) * e; if (u === 1) rot = rotTo = tw.r1; }
        if (tw.open) place(e);
        if (u === 1) { gap = tw.g1; tw = null; }
      }
      if (!(tw && tw.turn)) {
        if (vel) { // coasting after a flick: it slows down by itself, like a wheel with a little friction
          rot += vel * dt;
          rotTo = rot;
          vel *= Math.exp(-dt * 2.6);
          if (Math.abs(vel) < 0.04) vel = 0;
        } else if (rot !== rotTo) {
          rot += (rotTo - rot) * Math.min(1, dt * 11);
          if (Math.abs(rotTo - rot) < 0.0004) rot = rotTo;
        }
      }
      // Left alone, the wheel keeps turning very slowly, the way it was last spun. A finger on it, or an open preview, holds it still.
      var still = !tw && !vel && rot === rotTo && active < 0 && downY === null && now > idleAt;
      idleK = still ? idleK + (1 - idleK) * Math.min(1, dt * 1.5) : 0;
      if (still) { rot += idleDir * IDLE * idleK * dt; rotTo = rot; }
      spinning = vel !== 0 || rot !== rotTo;
      layout();
      if (!spinning && hoverK >= 0 && active < 0) setActive(hoverK);
      if (spinning || tw || !view.hidden) requestAnimationFrame(tick);
      else running = false;
    }
    function kick() {
      if (reduceMotion) {
        if (tw) { gap = tw.g1; if (tw.turn) rotTo = tw.r1; if (tw.open) place(1); tw = null; }
        rot = rotTo; vel = 0; spinning = false; layout(); return;
      }
      if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(tick); }
    }
    function spin(to) { vel = 0; rotTo = to; spinning = rot !== rotTo; kick(); }
    function setActive(k) {
      if (k === active) return;
      active = k;
      pickedAt = performance.now();
      frame.classList.remove("is-in");
      view.classList.toggle("has-active", k >= 0);
      if (k < 0) { // close: the thumbnail fades and the neighbours come back together
        opened = false;
        go.removeAttribute("href");
        tw = { t0: pickedAt, d: CLOSE, g0: gap, g1: 0 };
        idleAt = pickedAt + 900;
        kick();
        return;
      }
      var it = items[k % items.length];
      gapK = k;
      vel = 0;
      pickX = mx;
      pickY = my;
      shot.style.backgroundColor = it.tone || "";
      shot.style.backgroundImage = it.image ? "url(" + it.image + ")" : "none";
      cap.textContent = it.domain + " · " + it.note + (it.url ? (hoverable ? " · click to open" : " · tap to open") : " · not live yet");
      if (it.url) go.href = it.url; else go.removeAttribute("href");
      // The frame starts as a bar exactly the size of the word, where the word is now, and ends
      // full size where the word is headed: the front of the wheel, in the middle of the view.
      var r = nodes[k].getBoundingClientRect(), vr = view.getBoundingClientRect(), lr = list.getBoundingClientRect();
      var fw = frame.offsetWidth, fh = shot.offsetHeight;
      var left = Math.max(12, Math.min(vr.width - fw - 12, (vr.width - fw) / 2));
      var top = Math.max(70, Math.min(vr.height - fh - 44, lr.top - vr.top + ay - fh / 2));
      var bh = r.height * 0.62;
      grow = { dx: r.left - vr.left - left, dy: r.top - vr.top + (r.height - bh) / 2 - top, sx: r.width / fw, sy: bh / fh,
        zone: { left: Math.min(r.left, vr.left + left), top: Math.min(r.top, vr.top + top), right: Math.max(r.right, vr.left + left + fw), bottom: Math.max(r.bottom, vr.top + top + fh) } };
      frame.style.left = left + "px";
      frame.style.top = top + "px";
      place(0);
      void frame.offsetWidth;
      frame.classList.add("is-in");
      opened = true;
      var to = rot + wrap(k * STEP - rot);
      rotTo = to;
      tw = { t0: pickedAt, d: OPEN, g0: gap, g1: 1, turn: true, r0: rot, r1: to, open: true };
      spinning = true;
      kick();
    }
    // With a mouse the preview stays while the pointer rests near where it was picked, or on the thumbnail.
    // A press may open a site only if that site's preview was already open, and had been for a
    // moment, when the press began. So the press that brings up a preview can never also follow the link.
    var canOpen = false;
    view.addEventListener("pointerdown", function () { canOpen = active >= 0 && performance.now() - pickedAt > 350; }, true);
    var pickX = 0, pickY = 0, mx = 0, my = 0;
    view.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, true);
    function nearPick(e) { // over the picked name, the thumbnail, or the space between them
      var z = grow && grow.zone, pad = 36;
      return !!z && e.clientX > Math.min(pickX, z.left) - pad && e.clientX < Math.max(pickX, z.right) + pad &&
        e.clientY > Math.min(pickY, z.top) - pad && e.clientY < Math.max(pickY, z.bottom) + pad;
    }
    function openActive() {
      var it = active >= 0 ? items[active % items.length] : null;
      if (it && it.url) window.open(it.url, "_blank", "noopener");
    }
    go.addEventListener("click", function (e) {
      if (dragged || !canOpen) e.preventDefault();
    });

    for (var k = 0; k < SLOTS; k++) (function (k) {
      var it = items[k % items.length];
      var n = it.url ? outLink("", it.url, "play__item") : el("span", "play__item play__item--soon");
      n.textContent = it.domain;
      if (k < items.length && it.image) { var pre = new Image(); pre.src = it.image; }
      if (k >= items.length) n.tabIndex = -1; else if (!it.url) n.tabIndex = 0;
      n.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
      // While the wheel is still turning nothing opens; whatever is under the pointer opens once it settles.
      n.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse" || (e.clientX === mx && e.clientY === my)) return; hoverK = k; mx = e.clientX; my = e.clientY; if (!spinning && active < 0) setActive(k); }); // not when a name drifts under a resting pointer
      n.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" && !spinning && active < 0) { hoverK = k; setActive(k); } });
      n.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && hoverK === k) hoverK = -1; });
      n.addEventListener("click", function (e) {
        e.preventDefault();
        if (dragged) return;
        if (lastPointer === "mouse" && active >= 0 && nearPick(e)) { if (canOpen) openActive(); return; } // the click that follows the hover
        setActive(k);
      });
      n.addEventListener("keydown", function (e) { if (e.key === "Enter" && active !== k) { e.preventDefault(); setActive(k); } });
      list.appendChild(n);
      nodes.push(n);
    })(k);

    function fit() {
      if (view.hidden) return;
      var w = list.clientWidth, h = list.clientHeight;
      var size = Math.max(26, Math.min(w * (w < 600 ? 0.085 : 0.031), 44));
      lineH = size * 1.22;
      R = (lineH * 1.06 * SLOTS) / (Math.PI * 2);                       // one line of rim per name
      slope = Math.max(size * 1.12, lineH * (w / h) * 0.72) / lineH;     // the same diagonal as the staircase
      ax = Math.min(w * 0.3, R * slope * 0.7 + 16);
      ay = h * 0.54;
      list.style.fontSize = size + "px";
      list.style.perspective = Math.round(R * 4.2) + "px";
      list.style.perspectiveOrigin = ax + "px " + ay + "px";
      spread = frame.offsetWidth * 0.3125 + lineH * 0.45; // half the thumbnail's height, and a little air
      layout();
      kick();
    }
    footer(document.getElementById("play-foot"), false);
    window.__playShown = fit;
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    view.addEventListener("wheel", function (e) {
      e.preventDefault();
      if (active >= 0) setActive(-1);
      var turn = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 0.0016;
      if (turn) idleDir = turn > 0 ? 1 : -1;
      idleAt = performance.now() + 900;
      spin(rotTo + turn); // eases to a stop after the last notch
    }, { passive: false });
    var downY = null, lastY = 0, lastMove = 0, flick = 0;
    view.addEventListener("pointerdown", function (e) {
      lastPointer = e.pointerType;
      downY = lastY = e.clientY;
      dragged = false;
      flick = 0;
      if (vel) { vel = 0; rotTo = rot; } // a finger on a coasting wheel stops it
    });
    function endDrag() {
      if (downY !== null && dragged) {
        // let go while still moving and it coasts; hold still first and it stays put
        vel = performance.now() - lastMove < 90 ? Math.max(-14, Math.min(14, flick)) : 0;
        if (vel) idleDir = vel > 0 ? 1 : -1;
      }
      if (downY !== null) idleAt = performance.now() + 900;
      downY = null;
      kick();
    }
    view.addEventListener("pointercancel", endDrag);
    window.addEventListener("pointerup", endDrag);
    view.addEventListener("pointermove", function (e) {
      if (downY !== null && e.pointerType !== "mouse") { // drag up and down to spin it
        if (Math.abs(e.clientY - downY) > 8 && !dragged) { dragged = true; lastMove = performance.now(); if (active >= 0) setActive(-1); }
        if (dragged) {
          var now = performance.now(), turned = -(e.clientY - lastY) / R, dtm = Math.max(4, now - lastMove) / 1000;
          rot = rotTo = rot + turned;
          flick = flick * 0.6 + (turned / dtm) * 0.4; // a running average of the finger's speed
          lastMove = now;
          layout();
        }
        lastY = e.clientY;
      }
      if (e.pointerType !== "mouse") return;
      if (active >= 0 && !nearPick(e)) setActive(-1);
      var r = view.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      view.classList.add("has-cross");
      document.getElementById("cross-h").style.transform = "translateY(" + y + "px)";
      document.getElementById("cross-v").style.transform = "translateX(" + x + "px)";
      var xy = document.getElementById("cross-xy");
      xy.textContent = "x " + ("000" + Math.round(x)).slice(-4) + "  y " + ("000" + Math.round(y)).slice(-4);
      xy.style.transform = "translate(" + (x + 12) + "px," + (y + 10) + "px)";
    });
    view.addEventListener("pointerleave", function () { view.classList.remove("has-cross"); });
    view.addEventListener("click", function (e) {
      if (dragged || e.target.closest(".play__item, .play__go")) return;
      if (lastPointer === "mouse" && active >= 0 && nearPick(e)) { if (canOpen) openActive(); return; }
      setActive(-1);
    });
  }

  /* Play as a flat staircase: the earlier version, kept at #play-flat for comparison. */
  function buildPlayFlat() {
    var view = document.getElementById("view-play"), items = site.play;
    if (!view || !items) return;
    var list = document.getElementById("play-list"), frame = document.getElementById("play-frame");
    var shot = document.getElementById("play-shot"), cap = document.getElementById("play-cap");
    var nodes = [], active = -1, off = -1, lineH = 60, step = 100, showT = 0;
    var PREVIEW_DELAY = 300; // ms between the names moving apart and the preview opening, after a tap
    var pickedAt = 0, lastPointer = "mouse";
    var hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches; // a mouse: point to preview, click to open

    function place() { // slide the staircase so the name at "off" sits at the left, a little above the middle
      var h = list.clientHeight, w = list.clientWidth;
      var x = w * 0.07 - (off / lineH) * step, y = h * 0.4 - lineH / 2 - off;
      list.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
    }
    function scrollTo(v) {
      off = Math.max(0, Math.min((nodes.length - 1) * lineH, v));
      place();
    }
    function setActive(i, recentre) {
      if (i === active) return;
      active = i;
      pickedAt = performance.now();
      clearTimeout(showT);
      frame.classList.remove("is-in");
      nodes.forEach(function (n, k) {
        n.classList.toggle("is-active", k === i);
        // everything before the chosen name flies up and left, everything after it down and right
        n.style.setProperty("--push", i < 0 || k === i ? "0" : (k < i ? "-1" : "1"));
      });
      view.classList.toggle("has-active", i >= 0);
      if (i < 0) return;
      var it = items[i];
      if (recentre) scrollTo(i * lineH); // a tap brings it to the anchor; under a mouse it stays where the pointer is
      showT = setTimeout(function () { // the preview waits for the names to finish moving
        shot.style.backgroundColor = it.tone || "";
        shot.style.backgroundImage = it.image ? "url(" + it.image + ")" : "none";
        cap.textContent = it.note + (it.url ? (hoverable ? " · click to open" : " · tap again to open") : " · not live yet");
        void frame.offsetWidth;
        frame.classList.add("is-in");
      }, reduceMotion ? 0 : (recentre ? PREVIEW_DELAY : 90)); // under a mouse it opens almost at once
    }
    var dragged = false;
    items.forEach(function (it, i) {
      var n = it.url ? outLink("", it.url, "play__item") : el("span", "play__item play__item--soon");
      n.textContent = it.domain;
      if (it.image) { var pre = new Image(); pre.src = it.image; } // loaded ahead, so the preview never waits on the network
      n.style.setProperty("--i", i);
      if (!it.url) n.tabIndex = 0;
      n.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
      // With a mouse, pointing at a name previews it and a click opens it.
      n.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") setActive(i, false); });
      n.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && active === i) setActive(-1); });
      // With a finger, the first tap previews it and a second tap opens it. A tap that lands before the
      // preview has had time to show never opens anything, so one tap can not count twice.
      n.addEventListener("click", function (e) {
        if (dragged) { e.preventDefault(); return; }
        if (lastPointer === "mouse" && active === i) return; // already previewed by pointing at it: open
        if (active !== i) { e.preventDefault(); setActive(i, true); return; }
        if (performance.now() - pickedAt < PREVIEW_DELAY + 250) e.preventDefault();
      });
      n.addEventListener("keydown", function (e) { if (e.key === "Enter" && active !== i) { e.preventDefault(); setActive(i, true); } });
      list.appendChild(n);
      nodes.push(n);
    });

    function fit() {
      if (view.hidden) return;
      var w = list.clientWidth, h = list.clientHeight;
      var size = Math.max(26, Math.min(w * (w < 600 ? 0.085 : 0.031), 44));
      lineH = size * 1.22;
      // the staircase runs roughly from the top-left corner towards the bottom-right one
      step = Math.max(size * 1.12, lineH * (w / h) * 0.72); // never steeper than about 47 degrees
      list.style.fontSize = size + "px";
      list.style.setProperty("--step", step + "px");
      list.style.setProperty("--line", lineH + "px");
      if (off < 0) off = 0;
      scrollTo(active >= 0 ? active * lineH : off);
    }
    footer(document.getElementById("play-foot"), false);
    window.__playShown = fit;
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    view.addEventListener("wheel", function (e) {
      e.preventDefault();
      scrollTo(off + (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 0.6);
    }, { passive: false });
    var downY = null, lastY = 0;
    view.addEventListener("pointerdown", function (e) { downY = lastY = e.clientY; dragged = false; });
    function endDrag() { downY = null; list.classList.remove("is-dragging"); }
    view.addEventListener("pointercancel", endDrag);
    view.addEventListener("pointermove", function (e) {
      if (downY !== null && e.pointerType !== "mouse") { // drag up and down to slide the staircase
        if (Math.abs(e.clientY - downY) > 8 && !dragged) {
          dragged = true;
          list.classList.add("is-dragging"); // follow the finger directly, with no easing in between
          if (active >= 0) setActive(-1);
        }
        if (dragged) scrollTo(off - (e.clientY - lastY));
        lastY = e.clientY;
      }
      if (e.pointerType !== "mouse") return;
      // cross-hair that spans the screen
      var r = view.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      view.classList.add("has-cross");
      document.getElementById("cross-h").style.transform = "translateY(" + y + "px)";
      document.getElementById("cross-v").style.transform = "translateX(" + x + "px)";
      var xy = document.getElementById("cross-xy");
      xy.textContent = "x " + ("000" + Math.round(x)).slice(-4) + "  y " + ("000" + Math.round(y)).slice(-4);
      xy.style.transform = "translate(" + (x + 12) + "px," + (y + 10) + "px)";
    });
    window.addEventListener("pointerup", endDrag);
    view.addEventListener("pointerleave", function () { view.classList.remove("has-cross"); });
    view.addEventListener("click", function (e) { if (!dragged && !e.target.closest(".play__item")) setActive(-1); });
  }

  buildIndex("all");
  wireIndex();
  (location.hash === "#play-flat" ? buildPlayFlat : buildPlayWheel)();
  document.querySelectorAll(".modes__btn, .index__title, .walk__intro h1").forEach(glitch); // titles and the switch only
  buildAbout();
  setMode();
  window.addEventListener("hashchange", setMode);
  requestFog();
})();
