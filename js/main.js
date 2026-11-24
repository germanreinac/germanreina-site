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
        glitch(t);
        r.addEventListener("pointerenter", function () { burst(t); });
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
    var mode = name === "index" ? "index" : (name === "about" && about ? "about" : (name === "play" && playView ? "play" : "gallery"));
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
    intro.appendChild(el("h1", null, site.name));
    intro.appendChild(el("p", null, site.intro));
    document.getElementById("hint").textContent = site.motto || "";
    document.getElementById("room-count").textContent = "";

    var poster = new Image();
    poster.src = heroVideo.getAttribute("poster");
    var W = 0, H = 0, dpr = 1, last = performance.now();
    // the clean frame is drawn here first, then copied to the visible canvas with the glitch applied
    var buf = document.createElement("canvas"), bctx = buf.getContext("2d");
    var tint = document.createElement("canvas"), tctx = tint.getContext("2d");

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      var r = canvas.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top, t = performance.now();
      if (!lastPt || t - lastPt.t > 250) { lastPt = { x: x, y: y, t: t }; trail.push({ x: x, y: y, vx: 0, vy: 0, life: 1 }); return; }
      var dx = x - lastPt.x, dy = y - lastPt.y, d = Math.hypot(dx, dy);
      if (d < STEP) return;
      var dtp = Math.max(8, t - lastPt.t) / 1000;
      var vx = dx / dtp, vy = dy / dtp;
      // fill the gap since the last event, so a fast flick still leaves an unbroken wake
      var n = Math.min(12, Math.floor(d / STEP));
      for (var k = 1; k <= n; k++) {
        trail.push({ x: lastPt.x + (dx * k) / n, y: lastPt.y + (dy * k) / n, vx: vx, vy: vy, life: 1 });
      }
      if (trail.length > MAX_POINTS) trail.splice(0, trail.length - MAX_POINTS);
      lastPt = { x: x, y: y, t: t };
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
    function tinted(c2d, cv, colour) {
      if (cv.width !== buf.width || cv.height !== buf.height) { cv.width = buf.width; cv.height = buf.height; }
      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.globalCompositeOperation = "source-over";
      c2d.clearRect(0, 0, cv.width, cv.height);
      c2d.drawImage(buf, 0, 0);
      c2d.globalCompositeOperation = "source-atop";
      c2d.fillStyle = colour;
      c2d.fillRect(0, 0, cv.width, cv.height);
      c2d.globalCompositeOperation = "multiply";
      c2d.drawImage(buf, 0, 0);
    }

    /* ---- skull mode: the figure's head pops off as a jelly skull to roll, bounce, stretch and burst ---- */
    var day = false, dayT = 9, head = null, held = false, grabAt = null, downAt = null;
    var touches = {}, pinch = null, wheelAt = 0;
    var THREE_SRC = "js/vendor/three.min.js";
    var BG = 0x131118;           // the page colour in this mode; the skull fades into it with distance
    var FAR = -26;               // how far back it may go
    var REST = 1.02;             // height of its centre when it sits on the floor (its radius is about 1)
    var BURST_HI = 2.3, BURST_LO = 0.36; // stretched or squashed past these, it bursts
    function loadThree(done) {
      if (window.THREE) { done(); return; }
      var s = document.createElement("script");
      s.src = THREE_SRC;
      s.onload = done;
      document.head.appendChild(s);
    }
    // A provisional skull built from simple shapes. Swap this for the real model when it is exported.
    function buildHead() {
      var THREE = window.THREE, renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
      catch (e) { return null; }
      renderer.setClearColor(0x000000, 0);
      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(BG, 17, 46);
      scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      var sun = new THREE.DirectionalLight(0xffffff, 0.5);
      sun.position.set(-0.6, 1.6, 1.2);
      scene.add(sun);
      var rim = new THREE.DirectionalLight(0xff6b9a, 0.35); // a pink edge light, the figure's colour
      rim.position.set(1.5, 0.4, -1);
      scene.add(rim);
      var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
      var bone = new THREE.MeshPhongMaterial({ color: 0xf1ebe4, shininess: 90, specular: 0x666666 }); // glossy, like jelly
      var hole = new THREE.MeshBasicMaterial({ color: 0x17151d });
      function ball(mat, r, x, y, z, sx, sy, sz) {
        var b = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), mat);
        b.position.set(x, y, z);
        b.scale.set(sx || 1, sy || 1, sz || 1);
        return b;
      }
      var g = new THREE.Group();
      g.add(ball(bone, 1, 0, 0.12, 0, 1.06, 0.94, 1));                         // cranium
      g.add(ball(bone, 0.62, 0, -0.58, 0.3, 1.02, 0.68, 0.86));                 // jaw
      g.add(ball(bone, 0.3, -0.98, 0.1, -0.05, 0.6, 0.8, 0.6));                 // stubs where the ears were
      g.add(ball(bone, 0.3, 0.98, 0.1, -0.05, 0.6, 0.8, 0.6));
      g.add(ball(hole, 0.31, -0.4, 0.08, 0.82, 1, 1.08, 0.5));                  // eye sockets
      g.add(ball(hole, 0.31, 0.4, 0.08, 0.82, 1, 1.08, 0.5));
      var pupil = new THREE.MeshBasicMaterial({ color: 0xffe45e, fog: false });
      g.add(ball(pupil, 0.07, -0.4, 0.08, 0.9));                                // the yellow eyes are still in there
      g.add(ball(pupil, 0.07, 0.4, 0.08, 0.9));
      g.add(ball(hole, 0.1, 0, -0.26, 0.97, 0.9, 1.3, 0.5));                    // nose
      for (var t = -2; t <= 2; t++) {                                           // teeth
        var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.1), bone);
        tooth.position.set(t * 0.165, -0.7, 0.78 - Math.abs(t) * 0.035);
        g.add(tooth);
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
      var grid = new THREE.GridHelper(160, 64, 0x2c2935, 0x24212c); // a faint floor, so depth reads
      grid.position.y = -0.01;
      scene.add(grid);
      return {
        renderer: renderer, scene: scene, camera: camera, group: g, outer: outer, shadow: shadow,
        pos: new THREE.Vector3(0, REST, 0), vel: new THREE.Vector3(), w: new THREE.Vector3(),
        q: new THREE.Quaternion(), tmp: new THREE.Quaternion(), ax: new THREE.Vector3(),
        ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), hit: new THREE.Vector3(), proj: new THREE.Vector3(),
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -(REST + 0.45)),
        s: 1, sv: 0,      // jelly: how tall it is against its normal height, and how fast that is changing
        wide: 1,          // sideways stretch from two fingers
        rest: 1           // the shape the jelly is pulling towards (the mouse wheel moves this)
      };
    }
    function fitHead() {
      if (!head) return;
      var tall = W / H < 0.8;
      head.renderer.setPixelRatio(dpr);
      head.renderer.setSize(W, H, false);
      head.camera.aspect = W / H;
      head.camera.fov = tall ? 52 : 32;
      // high enough that the floor runs from the bottom edge of the screen to well up it
      head.camera.position.set(0, tall ? 9.5 : 7.5, tall ? 15 : 14.5);
      head.camera.lookAt(0, 0, tall ? -3.5 : -1.5);
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
      return { x: W * 0.5, y: H * (tall ? 0.56 : 0.5) - sh * scale * 0.17 };
    }
    function dropHead() {
      if (!head) return;
      // it pops off the body: starts where the figure's head is, jumps, and falls to the floor
      var at = figureHead(), r = aim(at.x, at.y);
      var t = -r.origin.z / r.direction.z;
      head.pos.copy(r.direction).multiplyScalar(t).add(r.origin);
      if (head.pos.y < REST) head.pos.y = REST;
      head.vel.set((Math.random() - 0.5) * 4, 8, 0.8);
      head.w.set(5, 0, (Math.random() - 0.5) * 7);
      head.q.set(0, 0, 0, 1);
      head.s = 1.25;
      head.sv = 0;
      head.wide = 1;
      head.rest = 1;
      head.outer.visible = head.shadow.visible = true;
    }
    function stepHead(dt) {
      var p = head.pos, v = head.vel;
      if (held && grabAt && !pinch) {
        // it follows the finger anywhere on the floor, lifted a little; its speed is the speed it is thrown with
        if (aim(grabAt.x, grabAt.y).intersectPlane(head.plane, head.hit)) {
          var tz = Math.max(FAR, head.hit.z);
          v.x = (head.hit.x - p.x) * 14;
          v.z = (tz - p.z) * 14;
          v.y = (REST + 0.45 - p.y) * 14;
          head.sv += Math.hypot(v.x, v.z) * 0.012 * (Math.random() - 0.4); // it wobbles as it is dragged
        }
      } else if (pinch) {
        v.set(0, (REST + 0.6 - p.y) * 10, 0);
      } else {
        v.y -= 30 * dt;
      }
      p.addScaledVector(v, dt);

      // jelly: a spring pulls it back to its shape, so it overshoots and wobbles
      if (performance.now() - wheelAt > 260) head.rest += (1 - head.rest) * Math.min(1, dt * 5); // a wheel stretch relaxes once the wheel stops
      head.sv += (-(head.s - head.rest) * 190 - head.sv * 6.5) * dt;
      head.s += head.sv * dt;
      if (!pinch) head.wide += (1 - head.wide) * Math.min(1, dt * 9);

      var floor = REST * Math.min(1, head.s);
      var onFloor = p.y <= floor;
      if (onFloor) {
        if (v.y < -3) { head.sv -= -v.y * 0.5; v.y = -v.y * 0.52; } // lands, squashes, bounces
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
      // free to roam the whole screen; it only bounces off the screen's own edges
      if (p.z < FAR) { p.z = FAR; v.z = Math.abs(v.z) * 0.6; }
      head.proj.copy(p).project(head.camera);
      if (!held) {
        if (head.proj.x < -0.88 && v.x < 0) { v.x = -v.x * 0.7; head.sv += 3; }
        if (head.proj.x > 0.88 && v.x > 0) { v.x = -v.x * 0.7; head.sv += 3; }
        if (head.proj.y < -0.8 && v.z > 0) { v.z = -v.z * 0.7; head.sv += 3; }
      }
      var s = Math.max(0.2, head.s), side = 1 / Math.sqrt(s);
      head.outer.position.copy(p);
      head.outer.scale.set(side * head.wide, s / Math.sqrt(head.wide), side);
      head.group.quaternion.copy(head.q);
      var lift = p.y - REST;
      head.shadow.position.set(p.x, 0.01, p.z);
      head.shadow.scale.set(side * head.wide / (1 + lift * 0.3), side / (1 + lift * 0.3), 1);
      head.shadow.material.opacity = 0.5 / (1 + lift * 0.7);
      head.renderer.render(head.scene, head.camera);
      // pushed too far out of shape, it bursts
      if (head.s > BURST_HI || head.s < BURST_LO || head.wide > BURST_HI) burstHead();
    }
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onSkull(pt) { return aim(pt.x, pt.y).distanceToPoint(head.pos) < 1.5; }
    hero.addEventListener("pointerdown", function (e) {
      if (!day || !head || !head.outer.visible) return;
      var pt = local(e);
      touches[e.pointerId] = pt;
      var ids = Object.keys(touches);
      if (ids.length === 2 && (held || onSkull(pt))) { // a second finger: stretch it between the two
        var a = touches[ids[0]], b = touches[ids[1]];
        pinch = { d0: Math.max(30, Math.hypot(a.x - b.x, a.y - b.y)), s0: head.s, w0: head.wide };
        held = true;
        return;
      }
      if (!onSkull(pt)) return;
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
        var f = Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0;
        // fingers side by side pull it wide, fingers one above the other pull it tall
        if (Math.abs(a.x - b.x) > Math.abs(a.y - b.y)) head.wide = pinch.w0 * f;
        else { head.s = pinch.s0 * f; head.sv = 0; }
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
      if (quick) head.sv += 5;
    }
    hero.addEventListener("pointerup", letGo);
    hero.addEventListener("pointercancel", letGo);
    // with a mouse there is no second finger: the wheel stretches it while the pointer is on it
    hero.addEventListener("wheel", function (e) {
      if (!day || !head || !head.outer.visible) return;
      if (!onSkull(local(e))) return;
      e.preventDefault();
      head.rest = Math.max(0.25, Math.min(2.6, head.rest * Math.exp(-e.deltaY * 0.0016)));
      wheelAt = performance.now();
    }, { passive: false });

    window.__head = function () { // for poking at it from the console: where it is on screen and on the floor
      if (!head) return null;
      head.proj.copy(head.pos).project(head.camera);
      var cr = canvas.getBoundingClientRect();
      return { x: Math.round((head.proj.x + 1) / 2 * W + cr.left), y: Math.round((1 - head.proj.y) / 2 * H + cr.top), fx: +head.pos.x.toFixed(2), fy: +head.pos.y.toFixed(2), fz: +head.pos.z.toFixed(2), s: +head.s.toFixed(2), on: day };
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
      if (dayBtn) {
        dayBtn.setAttribute("aria-pressed", String(day));
        document.getElementById("daybtn-label").textContent = day ? "Put it back" : "Behead";
      }
      document.getElementById("room-count").textContent = "";
      held = false;
      pinch = null;
      touches = {};
      if (day) {
        heroVideo.pause();
        dayT = 0;
        loadThree(function () {
          if (!head) { head = buildHead(); fitHead(); }
          if (day) dropHead();
        });
      } else if (!reduceMotion) {
        var pl = heroVideo.play();
        if (pl && pl.catch) pl.catch(function () {});
      }
    }
    function burstHead() { // it pops, the screen tears, and the whole figure is back
      if (!day) return;
      if (!reduceMotion && head) {
        head.proj.copy(head.pos).project(head.camera);
        var bx = (head.proj.x + 1) / 2 * W, by = (1 - head.proj.y) / 2 * H;
        for (var i = 0; i < 40; i++) { // a ring of tears flying out from where it was
          var a = (i / 40) * 6.283;
          trail.push({ x: bx + Math.cos(a) * 60, y: by + Math.sin(a) * 60, vx: Math.cos(a) * 1400, vy: Math.sin(a) * 1400, life: 0.6 + Math.random() * 0.4 });
        }
      }
      if (head) head.outer.visible = head.shadow.visible = false;
      glitchScreen(50);
      setSkull(false);
    }
    if (dayBtn) dayBtn.addEventListener("click", function () {
      glitchScreen(34);
      setSkull(!day);
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      if (!day && !src) return;

      // 1. the clean frame
      var sw = 1, sh = 1, scale = 1, cx = W * 0.5, cy = H * 0.5;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.globalAlpha = 1;
      bctx.clearRect(0, 0, W, H);
      if (day) {
        dayT += dt;
        if (frame && dayT < 0.5) { // the body lingers for a moment after the head leaves it
          var fw = frame.videoWidth || frame.naturalWidth, fh = frame.videoHeight || frame.naturalHeight;
          var ftall = W / H < 0.8, fs = Math.max(W / fw, H / fh) * (ftall ? 0.74 : 1), fy = H * (ftall ? 0.56 : 0.5);
          bctx.globalAlpha = 0.85 * (1 - dayT / 0.5);
          bctx.drawImage(frame, cx - (fw * fs) / 2, fy - (fh * fs) / 2, fw * fs, fh * fs);
          bctx.globalAlpha = 1;
          // soft-edged, so it dissolves instead of leaving a hard shape
          var mrx = fh * fs * 0.3, mry = fh * fs * 0.46;
          bctx.globalCompositeOperation = "destination-in";
          bctx.save();
          bctx.translate(cx, fy);
          bctx.scale(mrx / mry, 1);
          var mg = bctx.createRadialGradient(0, 0, mry * 0.3, 0, 0, mry);
          mg.addColorStop(0, "rgba(0,0,0,1)");
          mg.addColorStop(1, "rgba(0,0,0,0)");
          bctx.fillStyle = mg;
          bctx.fillRect(-mry * 4, -mry * 4, mry * 8, mry * 8);
          bctx.restore();
          bctx.globalCompositeOperation = "source-over";
        }
        if (head && head.outer.visible) {
          stepHead(dt);
          if (day) bctx.drawImage(head.renderer.domElement, 0, 0, W, H);
        }
      } else {
        sw = src.videoWidth || src.naturalWidth;
        sh = src.videoHeight || src.naturalHeight;
        var tall = W / H < 0.8;
        // the figure sits in the middle of the screen; on a tall screen it is drawn smaller so it fits under the name
        scale = Math.max(W / sw, H / sh) * (tall ? 0.74 : 1);
        cy = H * (tall ? 0.56 : 0.5);
        bctx.drawImage(src, cx - (sw * scale) / 2, cy - (sh * scale) / 2, sw * scale, sh * scale);
      }
      ctx.drawImage(buf, 0, 0, W, H);

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
          var reach = REACH * (0.4 + 0.6 * ease);
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
          tinted(rctx, bufR, "#ff0000");
          tinted(cctx, bufC, "#00ffff");
          var tick = Math.floor(now / 80);
          for (var r = r0; r <= r1; r++) {
            var n1 = noise(r, tick), tear = n1 > 0.88 ? 2.4 : 1;   // now and then a whole row jumps further
            var y0 = r * ROW;
            for (var c = c0; c <= c1; c++) {
              var id = r * cols + c, a = ga[id];
              if (a <= 0) continue;
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

  /* Play: the interactive sites, in the same light style as the Index. The names step down
     and to the right like a staircase. Pointing at one (or tapping it) nudges the others
     apart so it reads clearly, and shows a framed preview of the site. */
  function buildPlay() {
    var view = document.getElementById("view-play"), items = site.play;
    if (!view || !items) return;
    var list = document.getElementById("play-list"), frame = document.getElementById("play-frame");
    var shot = document.getElementById("play-shot"), cap = document.getElementById("play-cap");
    var nodes = [], active = -1;
    var touch = window.matchMedia("(pointer: coarse)").matches;

    function setActive(i) {
      if (i === active) return;
      active = i;
      nodes.forEach(function (n, k) {
        n.classList.toggle("is-active", k === i);
        // like a magnet turned the wrong way round: everything else jumps away from the chosen name
        n.style.setProperty("--push", i < 0 || k === i ? "0" : (k < i ? "-1" : "1"));
      });
      view.classList.toggle("has-active", i >= 0);
      if (i < 0) return;
      var it = items[i];
      shot.style.backgroundColor = it.tone || "";
      shot.style.backgroundImage = it.image ? "url(" + it.image + ")" : "none";
      cap.textContent = it.note + (it.url ? "" : " · not live yet");
      frame.classList.remove("is-in");
      void frame.offsetWidth;
      frame.classList.add("is-in");
      burst(nodes[i]);
    }
    items.forEach(function (it, i) {
      var n = it.url ? outLink("", it.url, "play__item") : el("span", "play__item play__item--soon");
      n.textContent = it.domain;
      n.style.setProperty("--i", i);
      glitch(n);
      n.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") setActive(i); });
      n.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") setActive(-1); });
      n.addEventListener("focus", function () { setActive(i); });
      n.addEventListener("blur", function () { if (!touch) setActive(-1); });
      n.addEventListener("click", function (e) { // on touch the first tap picks it, the second opens it
        if (touch && active !== i) { e.preventDefault(); setActive(i); }
      });
      list.appendChild(n);
      nodes.push(n);
    });

    // Size the type and the steps so the staircase runs from one side of the screen to the other.
    // The step is as big as the last name allows; a long name in the middle is pulled back just enough to fit.
    function fit() {
      if (view.hidden) return;
      var w = list.clientWidth, h = list.clientHeight, n = nodes.length;
      var size = Math.max(22, Math.min(w * (w < 600 ? 0.085 : 0.07), h / (n * 1.22 + 2.6), 104));
      list.style.fontSize = size + "px";
      var widest = 0;
      nodes.forEach(function (node) { node.style.marginLeft = "0"; widest = Math.max(widest, node.offsetWidth); });
      if (widest > w) { size *= w / widest; list.style.fontSize = size + "px"; }
      var step = n > 1 ? Math.max(0, (w - nodes[n - 1].offsetWidth) / (n - 1)) : 0;
      nodes.forEach(function (node, k) { node.style.marginLeft = Math.max(0, Math.min(k * step, w - node.offsetWidth)) + "px"; });
    }
    window.__playShown = fit;
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    view.addEventListener("pointermove", function (e) {
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
    view.addEventListener("pointerleave", function () { view.classList.remove("has-cross"); });
    view.addEventListener("click", function (e) { if (touch && !e.target.closest(".play__item")) setActive(-1); });
  }

  buildIndex("all");
  wireIndex();
  buildPlay();
  document.querySelectorAll(".modes__btn, .bar__out, .chip, .index__title, #view-index .index__foot a, .sheet__links a, .walk__intro h1").forEach(glitch);
  buildAbout();
  setMode();
  window.addEventListener("hashchange", setMode);
  requestFog();
})();
