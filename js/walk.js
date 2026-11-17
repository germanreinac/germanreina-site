/*
  The walkable gallery: a few platforms floating in dark space, seen in isometric view.

  The whole thing is described by four short lists below: PLATFORMS, LINKS (stairs and
  bridges), WALLS and SLOTS (hanging spots). Change those to change the building.

  - You land zoomed in on the entrance, with the name beside it.
  - Click (tap) a floor or stair to walk there. Click a piece: if you are close it opens,
    if not the figure walks over to it first and it opens on arrival.
  - Click out in space and the figure walks to the edge and jumps off, but only where
    the edge is open. A wall or another platform in the way stops it.
  - Other figures stand around. Walk into one to shove it, click one to throw it.
    Shove or throw one past an open edge and it falls out of the gallery.
  - The fall is a second way to browse: as you scroll, the projects spiral up around
    the falling figure, passing in front of it and behind it.

  Returns false if WebGL is not available, so main.js can fall back to the flat wall.
*/
window.Walk = {
  start: function (opts) {
    var THREE = window.THREE;
    if (!THREE) return false;
    var host = opts.host, projects = opts.projects;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return false;
    }

    var SPACE = 0x17151d, INK = 0x1f1a24, PENCIL = 0xffc52e;
    var SIZES = { wide: [6.4, 4], tall: [4.2, 5.6], square: [4.6, 4.6] };
    var ART = 0.78;          // pieces are scaled down a little to fit the walls
    var OPEN_RANGE = 4.5;    // how close the figure must be for a click to open a piece
    var JUMP_MARGIN = 2.5;   // a click this far out in space means "jump off"
    var WALL_T = 0.4, STEPS = 10;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- the building. The camera looks from +x +z, so -x and -z are "into the screen". ---- */
    var PLATFORMS = [
      { name: "entrance", x0: 2, x1: 12, z0: 2, z1: 12, y: 0, thick: 1.4 },
      { name: "hall", x0: -14, x1: 12, z0: -15, z1: -5, y: 4, thick: 1.4 },
      { name: "balcony", x0: -14, x1: -6, z0: -1, z1: 7, y: 4, thick: 1 },
      { name: "tower", x0: -14, x1: -4, z0: -32, z1: -22, y: 9, thick: 15 }
    ];
    // Stairs and bridges. "axis" is the direction you travel; l0..l1 the strip across;
    // a0 is the end at height lo, a1 the end at height hi (equal heights make a bridge).
    var LINKS = [
      { axis: "z", l0: 8, l1: 12, a0: 2, a1: -5, lo: 0, hi: 4 },        // entrance -> hall
      { axis: "z", l0: -14, l1: -10, a0: -15, a1: -22, lo: 4, hi: 9 },  // hall -> tower
      { axis: "z", l0: -12, l1: -8, a0: -1, a1: -5, lo: 4, hi: 4 }      // balcony <-> hall
    ];
    // Walls stand on the far edges. axis "z": runs along x at a fixed z; axis "x": runs along z.
    var WALLS = [
      { axis: "x", at: 2, a: 2, b: 12, base: 0, h: 5 },        // 0 entrance
      { axis: "z", at: -15, a: -10, b: 12, base: 4, h: 5.2 },  // 1 hall
      { axis: "x", at: -14, a: -1, b: 7, base: 4, h: 5 },      // 2 balcony
      { axis: "z", at: -32, a: -14, b: -4, base: 9, h: 5.2 },  // 3 tower
      { axis: "x", at: -14, a: -32, b: -22, base: 9, h: 5.2 }  // 4 tower
    ];
    // Hanging spots: which wall, and where along it. Projects fill them in projects.js order.
    var SLOTS = {
      studio: [
        { wall: 0, pos: 4.6 }, { wall: 0, pos: 9.5 },
        { wall: 1, pos: 9.3 }, { wall: 1, pos: 3.8 }, { wall: 1, pos: -1.7 }, { wall: 1, pos: -7.2 },
        { wall: 2, pos: 3 }
      ],
      own: [{ wall: 3, pos: -6.6 }, { wall: 4, pos: -24.6 }, { wall: 3, pos: -11.3 }, { wall: 4, pos: -29.3 }]
    };
    var LABELS = [
      { text: "Games and studio work", x: -9.5, z: -7.2, y: 4 },
      { text: "Own projects", x: -13.4, z: -23.4, y: 9 }
    ];
    var START = { x: 8, z: 8.5 };
    var MIDDLE = new THREE.Vector3(-1, 4, -10);

    function inRect(p, x, z, pad) { return x >= p.x0 + pad && x <= p.x1 - pad && z >= p.z0 + pad && z <= p.z1 - pad; }
    function onLink(l, x, z, pad, ext) {
      var across = l.axis === "z" ? x : z, along = l.axis === "z" ? z : x;
      return across >= l.l0 + pad && across <= l.l1 - pad &&
        along >= Math.min(l.a0, l.a1) - ext && along <= Math.max(l.a0, l.a1) + ext;
    }
    function heightAt(x, z, fallback) {
      for (var i = 0; i < LINKS.length; i++) {
        var l = LINKS[i];
        if (onLink(l, x, z, 0.4, 0)) {
          var along = l.axis === "z" ? z : x;
          return l.lo + ((along - l.a0) / (l.a1 - l.a0)) * (l.hi - l.lo);
        }
      }
      for (var j = 0; j < PLATFORMS.length; j++) if (inRect(PLATFORMS[j], x, z, -0.05)) return PLATFORMS[j].y;
      return fallback || 0;
    }
    function overAnything(x, z) {
      for (var i = 0; i < PLATFORMS.length; i++) if (inRect(PLATFORMS[i], x, z, 0)) return true;
      for (var j = 0; j < LINKS.length; j++) if (onLink(LINKS[j], x, z, 0, 0)) return true;
      return false;
    }
    function gapTo(x, z) { // 0 when over the building, otherwise roughly how far out in space
      var best = Infinity;
      PLATFORMS.forEach(function (r) {
        var dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
        best = Math.min(best, Math.hypot(dx, dz));
      });
      return overAnything(x, z) ? 0 : best;
    }
    function hitsWall(x, z, y) {
      for (var i = 0; i < WALLS.length; i++) {
        var w = WALLS[i];
        if (y < w.base - 0.5 || y > w.base + w.h) continue;
        var across = w.axis === "z" ? z : x, along = w.axis === "z" ? x : z;
        if (across >= w.at - WALL_T - 0.5 && across <= w.at + 0.5 && along >= w.a - 0.3 && along <= w.b + 0.3) return true;
      }
      return false;
    }
    // Can the figure jump from here in this direction? Only if the way out is open space:
    // no wall across it, and no other platform or stair right there to land on.
    function canJump(from, dir, y) {
      for (var t = 0.25; t <= 3.5; t += 0.25) {
        var x = from.x + dir.x * t, z = from.z + dir.z * t;
        if (hitsWall(x, z, y)) return false;
        if (!overAnything(x, z)) {
          for (var u = t; u <= t + 2; u += 0.25) { // and it stays open for a couple of steps
            var x2 = from.x + dir.x * u, z2 = from.z + dir.z * u;
            if (overAnything(x2, z2) || hitsWall(x2, z2, y)) return false;
          }
          return true;
        }
      }
      return false;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(SPACE, 0); // see-through: the page behind is the same dark, and cards can sit behind the canvas
    host.appendChild(renderer.domElement);
    var canvas = renderer.domElement;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    var CAM = new THREE.Vector3(60, 60, 60);
    camera.position.copy(CAM);
    camera.lookAt(0, 0, 0);
    scene.add(camera);
    // the camera never turns, so "up" and "right" on screen are fixed directions in the world
    var upV = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    var rightV = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    var towardV = CAM.clone().normalize();
    function flat(c) { return new THREE.MeshBasicMaterial({ color: c }); }

    /* ---- stars: two fine layers fixed to the camera; they slide at different speeds in the fall ---- */
    function starLayer(n, size, opacity) {
      var pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 130;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 170;
        pos[i * 3 + 2] = -380;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var pts = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xf5f5f1, size: size * renderer.getPixelRatio(), sizeAttenuation: false, transparent: true, opacity: opacity
      }));
      camera.add(pts);
      return pts;
    }
    var starsFar = starLayer(1100, 1.1, 0.6), starsNear = starLayer(150, 1.6, 0.85);

    /* ---- build the solids ---- */
    var solid = []; // everything a click can land on
    var tileCanvas = (function () {
      var c = document.createElement("canvas");
      c.width = c.height = 128;
      var g = c.getContext("2d");
      g.fillStyle = "#d6dbd9";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(31,26,36,0.08)";
      g.lineWidth = 2;
      g.strokeRect(0, 0, 128, 128);
      return c;
    })();
    var faceX = flat(0xe9ebe6), faceZ = flat(0xd3d8d4), under = flat(0xb9c0bd), topPlain = flat(0xf5f5f1);
    function box(x0, x1, y0, y1, z0, z1, top) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
        [faceX, faceX, top, under, faceZ, faceZ]
      );
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      scene.add(m);
      solid.push(m);
      return m;
    }
    PLATFORMS.forEach(function (p) {
      var t = new THREE.CanvasTexture(tileCanvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set((p.x1 - p.x0) / 2.5, (p.z1 - p.z0) / 2.5);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      box(p.x0, p.x1, p.y - p.thick, p.y, p.z0, p.z1, new THREE.MeshBasicMaterial({ map: t }));
    });
    LINKS.forEach(function (l) {
      var n = l.hi === l.lo ? 1 : STEPS;
      for (var i = 0; i < n; i++) {
        var s0 = l.a0 + ((l.a1 - l.a0) * i) / n, s1 = l.a0 + ((l.a1 - l.a0) * (i + 1)) / n;
        var top = n === 1 ? l.lo : l.lo + ((l.hi - l.lo) * (i + 1)) / n;
        var a = Math.min(s0, s1), b = Math.max(s0, s1);
        if (l.axis === "z") box(l.l0, l.l1, top - 0.9, top, a, b, topPlain);
        else box(a, b, top - 0.9, top, l.l0, l.l1, topPlain);
      }
    });
    WALLS.forEach(function (w) {
      if (w.axis === "z") box(w.a, w.b, w.base, w.base + w.h, w.at - WALL_T, w.at, topPlain);
      else box(w.at - WALL_T, w.at, w.base, w.base + w.h, w.a, w.b, topPlain);
    });

    /* ---- helpers ---- */
    function radial(inner, outer) {
      var c = document.createElement("canvas");
      c.width = c.height = 128;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, inner);
      grd.addColorStop(1, outer);
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    var shadowTex = radial("rgba(31,26,36,0.4)", "rgba(31,26,36,0)");
    function shadow(w, d) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.03;
      return m;
    }
    function placeholder(p, w, h) {
      var c = document.createElement("canvas");
      c.width = 1024;
      c.height = Math.round((1024 * h) / w);
      var g = c.getContext("2d");
      g.fillStyle = p.tone;
      g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = "rgba(31,26,36,0.07)";
      g.lineWidth = 5;
      for (var x = -c.height; x < c.width; x += 40) {
        g.beginPath();
        g.moveTo(x, c.height);
        g.lineTo(x + c.height, 0);
        g.stroke();
      }
      g.fillStyle = "#1f1a24";
      g.font = '500 26px "IBM Plex Mono", monospace';
      g.fillText("IMAGE PENDING", 56, 84);
      var size = 120;
      g.font = '800 ' + size + 'px "Bricolage Grotesque", Arial, sans-serif';
      while (g.measureText(p.title).width > c.width - 112 && size > 50) {
        size -= 8;
        g.font = '800 ' + size + 'px "Bricolage Grotesque", Arial, sans-serif';
      }
      g.fillText(p.title, 56, c.height - 64);
      return new THREE.CanvasTexture(c);
    }

    /* ---- pieces on the walls, floor labels, and the cards for the fall ---- */
    var pieces = [], cards = [];
    function build() {
      var loader = new THREE.TextureLoader();
      var used = { studio: 0, own: 0 };
      var edge = flat(0xffffff);
      projects.forEach(function (p, i) {
        cards.push(makeCard(p, i));
        var slots = SLOTS[p.kind] || SLOTS.studio;
        var slot = slots[used[p.kind]++];
        if (!slot) return; // more projects than hanging spots: add a slot above
        var wall = WALLS[slot.wall];
        var s = SIZES[p.shape] || SIZES.wide, w = s[0] * ART, h = s[1] * ART;
        var face = new THREE.MeshBasicMaterial({ map: p.images[0] ? loader.load(p.images[0]) : placeholder(p, s[0], s[1]) });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), [edge, edge, edge, edge, face, edge]);
        mesh.userData.index = pieces.length;
        var onZ = wall.axis === "z";
        var x = onZ ? slot.pos : wall.at + 0.09, z = onZ ? wall.at + 0.09 : slot.pos;
        mesh.position.set(x, wall.base + 0.35 + h / 2, z);
        mesh.rotation.y = onZ ? 0 : Math.PI / 2;
        scene.add(mesh);
        pieces.push({ mesh: mesh, project: p, level: wall.base, stand: { x: x + (onZ ? 0 : 2.6), z: z + (onZ ? 2.6 : 0) } });
      });

      LABELS.forEach(function (l) {
        var c = document.createElement("canvas");
        c.width = 1024;
        c.height = 128;
        var g = c.getContext("2d");
        g.fillStyle = "rgba(31,26,36,0.5)";
        g.font = '800 84px "Bricolage Grotesque", Arial, sans-serif';
        g.textBaseline = "middle";
        g.fillText(l.text, 8, 68);
        var m = new THREE.Mesh(
          new THREE.PlaneGeometry(9, 1.125),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(l.x + 4.5, l.y + 0.03, l.z);
        scene.add(m);
      });
    }

    // Fall cards are plain HTML over the canvas: crisp text and real perspective.
    function makeCard(p, i) {
      var doc = document, card = doc.createElement("article");
      card.className = "fcard" + (i % 2 ? " fcard--flip" : "");
      var art = doc.createElement("button");
      art.type = "button";
      art.className = "fcard__art";
      art.setAttribute("aria-label", p.title);
      var s = opts.shapes[p.shape] || opts.shapes.wide;
      art.style.setProperty("--ar", s.ar);
      art.style.setProperty("--tone", p.tone);
      art.appendChild(opts.makeFrame(p, p.images[0]));
      var pill = doc.createElement("span");
      pill.className = "fcard__pill";
      pill.textContent = p.title;
      art.appendChild(pill);
      var text = doc.createElement("div");
      text.className = "fcard__text";
      var h = doc.createElement("h3");
      h.textContent = p.title;
      var meta = doc.createElement("p");
      meta.className = "fcard__meta";
      meta.textContent = [p.year, p.role, p.with].filter(Boolean).join(" · ");
      var body = doc.createElement("p");
      body.textContent = p.notes.slice(0, 2).join(" ");
      text.appendChild(meta);
      text.appendChild(h);
      text.appendChild(body);
      card.appendChild(art);
      card.appendChild(text);
      card.hidden = true;
      opts.fallLayer.appendChild(card);
      art.addEventListener("click", function () { if (!dragged) opts.onOpen(p.slug); });
      return { el: card, art: art, text: text, side: i % 2 ? -1 : 1 };
    }

    /* ---- the walker: a plain stand-in until there is a real character ---- */
    var pawn = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 1.05, 20), flat(0xc98f12));
    body.position.y = 0.55;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), flat(PENCIL));
    head.position.y = 1.32;
    var pawnShadow = shadow(1.6, 1.6);
    pawn.add(body, head, pawnShadow);
    pawn.position.set(START.x, heightAt(START.x, START.z), START.z);
    scene.add(pawn);

    var marker = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false })
    );
    marker.rotation.x = -Math.PI / 2;
    scene.add(marker);

    /* ---- walking: a grid over the plan, A* between cells ---- */
    var GX0 = -16, GZ0 = -34, GW = 30, GH = 48, M = 0.6;
    function walkable(x, z) {
      for (var i = 0; i < LINKS.length; i++) if (onLink(LINKS[i], x, z, 0.9, 1.5)) return true;
      for (var j = 0; j < PLATFORMS.length; j++) if (inRect(PLATFORMS[j], x, z, M)) return true;
      return false;
    }
    var grid = [];
    for (var gz = 0; gz < GH; gz++) for (var gx = 0; gx < GW; gx++) grid.push(walkable(GX0 + gx + 0.5, GZ0 + gz + 0.5));
    function cellOf(x, z) { return { gx: Math.floor(x - GX0), gz: Math.floor(z - GZ0) }; }
    function ok(gx, gz) { return gx >= 0 && gz >= 0 && gx < GW && gz < GH && grid[gz * GW + gx]; }
    function nearestCell(x, z) {
      var best = null, bd = Infinity;
      for (var gz = 0; gz < GH; gz++) for (var gx = 0; gx < GW; gx++) {
        if (!grid[gz * GW + gx]) continue;
        var d = Math.pow(GX0 + gx + 0.5 - x, 2) + Math.pow(GZ0 + gz + 0.5 - z, 2);
        if (d < bd) { bd = d; best = { gx: gx, gz: gz }; }
      }
      return best;
    }
    function clear(a, b) {
      var d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.3);
      for (var i = 1; i < n; i++) {
        if (!walkable(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n)) return false;
      }
      return true;
    }
    function route(to) {
      var from = { x: pawn.position.x, z: pawn.position.z };
      var end = walkable(to.x, to.z) ? to : null;
      var ec = end ? cellOf(to.x, to.z) : nearestCell(to.x, to.z);
      if (!ok(ec.gx, ec.gz)) ec = nearestCell(to.x, to.z);
      if (!end) end = { x: GX0 + ec.gx + 0.5, z: GZ0 + ec.gz + 0.5 };
      if (clear(from, end)) return [end];
      var sc = cellOf(from.x, from.z);
      if (!ok(sc.gx, sc.gz)) sc = nearestCell(from.x, from.z);
      var open = [sc.gz * GW + sc.gx], came = {}, cost = {};
      cost[open[0]] = { g: 0, f: 0 };
      var goal = ec.gz * GW + ec.gx, found = false;
      while (open.length) {
        var bi = 0;
        for (var i = 1; i < open.length; i++) if (cost[open[i]].f < cost[open[bi]].f) bi = i;
        var cur = open.splice(bi, 1)[0];
        if (cur === goal) { found = true; break; }
        var cx = cur % GW, cz = (cur - cx) / GW, g0 = cost[cur].g;
        for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          var nx = cx + dx, nz = cz + dz;
          if (!ok(nx, nz) || (dx && dz && (!ok(cx + dx, cz) || !ok(cx, cz + dz)))) continue;
          var id = nz * GW + nx, g = g0 + (dx && dz ? 1.414 : 1);
          if (cost[id] !== undefined && cost[id].g <= g) continue;
          cost[id] = { g: g, f: g + Math.hypot(ec.gx - nx, ec.gz - nz) };
          came[id] = cur;
          if (open.indexOf(id) < 0) open.push(id);
        }
      }
      if (!found) return [];
      var pts = [end];
      for (var c = came[goal]; c !== undefined; c = came[c]) {
        var x = c % GW;
        pts.unshift({ x: GX0 + x + 0.5, z: GZ0 + (c - x) / GW + 0.5 });
      }
      // drop waypoints that can be skipped in a straight line
      var out = [], at = from, k = 0;
      while (k < pts.length) {
        var j = pts.length - 1;
        while (j > k && !clear(at, pts[j])) j--;
        out.push(pts[j]);
        at = pts[j];
        k = j + 1;
      }
      return out;
    }

    /* ---- camera ---- */
    // mode: "over" whole building, "walk", "drop" (jumped, still near it), "fall" (scroll gallery)
    var mode = "walk", zoom = 1, aspect = 1, halfW = 10, halfH = 10, pxWorld = 0.03, viewH = 1, viewW = 1;
    function layout() {
      viewW = host.clientWidth || 1;
      viewH = host.clientHeight || 1;
      aspect = viewW / viewH;
      renderer.setSize(viewW, viewH, false);
      frustum();
      fallLayout();
    }
    function frustum() {
      var e = zoom * zoom * (3 - 2 * zoom);
      var far = Math.max(22, 25 * aspect), close = Math.max(15 * aspect, 12);
      halfW = far + (close - far) * e;
      halfH = halfW / aspect;
      pxWorld = (2 * halfH) / viewH;
      camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", layout);
    layout();

    /* ---- the fall: projects spiral up around the falling figure ---- */
    var fallS = 0, fallTo = 0, fallEnd = false, fallFirst = 0, fallGap = 0, fallMax = 0; // all in screen pixels
    var SWEEP = 215; // degrees a card turns around the figure while it crosses the screen
    function fallLayout() {
      fallFirst = viewH * 0.72;
      fallGap = viewH * 0.46;
      fallMax = fallFirst + (projects.length - 1) * fallGap;
    }
    fallLayout();
    function placeCards() {
      var R = Math.min(viewW * 0.31, 470); // radius of the spiral
      cards.forEach(function (c, i) {
        var y = fallFirst + i * fallGap - fallS; // px below the middle of the screen
        var t = y / viewH;                        // -0.5 top edge, 0.5 bottom edge
        var show = Math.abs(t) < 0.95;
        if (c.el.hidden === show) c.el.hidden = !show;
        if (!show) return;
        // It comes up in front of the figure, swings round one side at the figure's height,
        // and leaves behind it. Odd cards go round the other side.
        var a = (90 - t * SWEEP) * Math.PI / 180;
        var depth = Math.cos(a);                  // 1 = nearest you, -1 = furthest behind the figure
        var x = c.side * Math.sin(a) * R;
        var z = depth * R - R * 0.55;
        var behind = depth < -0.12;
        if (behind !== c.behind) { // move it to the layer under or over the figure
          c.behind = behind;
          (behind ? opts.fallBack : opts.fallLayer).appendChild(c.el);
        }
        var tr = "translate(-50%,-50%) translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px)";
        if (!reduce) tr += " rotateY(" + (-c.side * Math.sin(a) * 48).toFixed(1) + "deg) rotateZ(" + (c.side * t * 7).toFixed(2) + "deg)";
        c.el.style.transform = tr;
        c.el.style.zIndex = String(1000 + Math.round(z));
        var edge = Math.max(0, Math.min(1, (0.62 - Math.abs(t)) * 5)); // fades at the top and bottom
        c.el.style.opacity = (edge * (0.42 + 0.58 * (depth + 1) / 2)).toFixed(2);
        c.art.style.pointerEvents = behind ? "none" : "auto";
      });
    }

    /* ---- input ---- */
    var path = [], pending = null, near = null, jumpDir = null, dropFrom = 0;
    var vel = new THREE.Vector3(), fallBase = new THREE.Vector3();
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null, lastY = 0, dragged = false;
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitPt = new THREE.Vector3();
    var clock = new THREE.Clock(), walkT = 0, time = 0;
    function setPtr(e) {
      var r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
    }
    function hitPiece() {
      var hits = ray.intersectObjects(pieces.map(function (p) { return p.mesh; }));
      return hits.length ? pieces[hits[0].object.userData.index] : null;
    }
    function distTo(pt) { return Math.hypot(pt.x - pawn.position.x, pt.z - pawn.position.z); }
    function walkTo(pt) {
      path = route(pt);
      if (!path.length) return;
      var end = path[path.length - 1];
      marker.position.set(end.x, heightAt(end.x, end.z) + 0.05, end.z);
      marker.material.opacity = 0.7;
    }
    function visit(pc) {
      jumpDir = null;
      if (Math.abs(pc.level - pawn.position.y) < 1 && distTo(pc.stand) <= OPEN_RANGE) { pending = null; path = []; opts.onOpen(pc.project.slug); }
      else { pending = pc; walkTo(pc.stand); }
    }
    function setMode(m) {
      mode = m;
      host.dataset.mode = m;
      opts.onState(mode, fallEnd);
    }
    function jumpOff(dir) {
      vel.set(dir.x * 5, 7, dir.z * 5);
      dropFrom = pawn.position.y;
      pawnShadow.visible = false;
      marker.material.opacity = 0;
      near = null;
      opts.onNear(null);
      setMode("drop");
    }
    function climbBack() {
      cards.forEach(function (c) { c.el.hidden = true; });
      pawn.position.set(START.x, heightAt(START.x, START.z), START.z);
      pawn.rotation.set(0, 0, 0);
      pawnShadow.visible = true;
      intro = 1;
      started = false;
      focus.copy(pawn.position).add(SIDE); // back to the opening view, name beside the building
      path = []; pending = null; jumpDir = null; fallS = 0; fallTo = 0; fallEnd = false;
      starsFar.position.y = starsNear.position.y = 0;
      setMode("walk");
    }
    function scrolled(by) { fallTo += by; }

    host.addEventListener("pointerdown", function (e) {
      downAt = [e.clientX, e.clientY];
      lastY = e.clientY;
      dragged = false;
    });
    host.addEventListener("pointermove", function (e) {
      if (downAt && mode === "fall") { // drag to scroll the fall
        if (Math.abs(e.clientY - downAt[1]) > 6) dragged = true;
        scrolled(lastY - e.clientY);
        lastY = e.clientY;
      }
      if (e.pointerType !== "mouse" || e.target !== canvas) return;
      setPtr(e);
      canvas.style.cursor = mode === "walk" && (hitPiece() || hitNpc()) ? "pointer" : "default";
    });
    window.addEventListener("pointerup", function () { downAt = null; });
    host.addEventListener("pointerup", function (e) {
      if (e.target !== canvas || !downAt || dragged) return;
      if (Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 10) return;
      if (mode !== "walk") return;
      started = true;
      setPtr(e);
      var pc = hitPiece();
      if (pc) { pendingKick = null; visit(pc); return; }
      var npc = hitNpc();
      if (npc) { kick(npc); return; }
      pending = null;
      jumpDir = null;
      pendingKick = null;
      var hits = ray.intersectObjects(solid);
      if (hits.length) { walkTo({ x: hits[0].point.x, z: hits[0].point.z }); return; }
      // nothing under the click: it is out in space, at the height the figure stands on
      plane.constant = -pawn.position.y;
      if (!ray.ray.intersectPlane(plane, hitPt)) return;
      walkTo({ x: hitPt.x, z: hitPt.z });
      if (!path.length || gapTo(hitPt.x, hitPt.z) < JUMP_MARGIN) return;
      var end = path[path.length - 1];
      var dx = hitPt.x - end.x, dz = hitPt.z - end.z, d = Math.hypot(dx, dz) || 1;
      // try straight towards the click, then straight out over whichever edge is nearer that way
      var tries = [{ x: dx / d, z: dz / d }, { x: dx > 0 ? 1 : -1, z: 0 }, { x: 0, z: dz > 0 ? 1 : -1 }];
      if (Math.abs(dz) > Math.abs(dx)) tries.push(tries.splice(1, 1)[0]);
      for (var i = 0; i < tries.length; i++) {
        if (canJump(end, tries[i], heightAt(end.x, end.z))) { jumpDir = tries[i]; marker.material.opacity = 0; break; }
      }
    });
    host.addEventListener("wheel", function (e) {
      if (mode !== "fall") return;
      scrolled(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if (!active() || document.activeElement !== document.body) return;
      if (mode === "fall" && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ")) {
        scrolled((e.key === "ArrowUp" ? -1 : 1) * fallGap);
        e.preventDefault();
      }
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (mode === "walk" && near) visit(near);
    });

    function active() { return !host.hidden && host.offsetParent !== null && !opts.isBlocked(); }

    /* ---- the others: stand-in characters you can shove around and throw out ---- */
    var NPC_SPOTS = [
      { x: 5, z: 5.5, color: 0xe8705f }, { x: 3, z: -9, color: 0x6f8fd6 }, { x: -6, z: -11.5, color: 0x8fbf6a },
      { x: -10, z: 3.5, color: 0xb9a2e6 }, { x: -8, z: -26, color: 0xf08fa8 }
    ];
    var npcs = [], thrown = 0, pendingKick = null;
    NPC_SPOTS.forEach(function (s, i) {
      var g = new THREE.Group();
      var b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 1.05, 20), flat(s.color));
      b.position.y = 0.55;
      var h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), flat(0xf5f5f1));
      h.position.y = 1.32;
      var sh = shadow(1.6, 1.6);
      b.userData.npc = h.userData.npc = i;
      g.add(b, h, sh);
      g.position.set(s.x, heightAt(s.x, s.z), s.z);
      scene.add(g);
      npcs.push({ group: g, parts: [b, h], shadow: sh, home: s, vx: 0, vz: 0, vy: 0, air: false, out: false, gone: 0, wait: 1 + i, tx: s.x, tz: s.z });
    });
    function hitNpc() {
      var list = [];
      npcs.forEach(function (n) { if (!n.gone) list.push(n.parts[0], n.parts[1]); });
      var hits = ray.intersectObjects(list);
      return hits.length ? npcs[hits[0].object.userData.npc] : null;
    }
    function kick(n) {
      var p = n.group.position;
      var dx = p.x - pawn.position.x, dz = p.z - pawn.position.z, d = Math.hypot(dx, dz);
      if (d > 3 || Math.abs(p.y - pawn.position.y) > 1.5) { // too far to reach: walk over first
        pending = null;
        jumpDir = null;
        pendingKick = n;
        walkTo({ x: p.x, z: p.z });
        return;
      }
      d = d || 1;
      n.vx = (dx / d) * 15;
      n.vz = (dz / d) * 15;
      n.vy = 8;
      n.air = true;
      n.kicked = true;
      pendingKick = null;
    }
    function updateNpcs(dt) {
      npcs.forEach(function (n) {
        var p = n.group.position;
        if (n.gone) { // thrown out: it is dropped back in from above after a while
          n.gone -= dt;
          if (n.gone <= 0) {
            n.gone = 0;
            p.set(n.home.x, heightAt(n.home.x, n.home.z) + 16, n.home.z);
            n.vx = n.vz = n.vy = 0;
            n.air = true;
            n.out = false;
            n.group.rotation.set(0, 0, 0);
            n.group.visible = true;
          }
          return;
        }
        // the figure bumps into it
        var dx = p.x - pawn.position.x, dz = p.z - pawn.position.z, d = Math.hypot(dx, dz);
        if (mode === "walk" && !n.air && d < 0.95 && Math.abs(p.y - pawn.position.y) < 1.2) {
          if (pendingKick === n) kick(n);
          else { d = d || 1; n.vx = (dx / d) * 5.5; n.vz = (dz / d) * 5.5; }
        }
        if (!n.air && Math.hypot(n.vx, n.vz) < 0.05) { // left alone: potter about
          n.wait -= dt;
          if (n.wait <= 0) {
            n.wait = 2 + Math.random() * 4;
            var a = Math.random() * 6.28, r = 1 + Math.random() * 2.5;
            if (walkable(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r)) { n.tx = p.x + Math.cos(a) * r; n.tz = p.z + Math.sin(a) * r; }
          }
          var wx = n.tx - p.x, wz = n.tz - p.z, wd = Math.hypot(wx, wz);
          if (wd > 0.1 && wd < 5 && !reduce) {
            p.x += (wx / wd) * 1.1 * dt;
            p.z += (wz / wd) * 1.1 * dt;
            p.y = heightAt(p.x, p.z, p.y);
          }
          return;
        }
        var nx = p.x + n.vx * dt, nz = p.z + n.vz * dt;
        if (hitsWall(nx, nz, p.y)) { n.vx *= -0.35; n.vz *= -0.35; nx = p.x; nz = p.z; } // walls stop it
        var over = overAnything(nx, nz), floor = over ? heightAt(nx, nz, p.y) : -1000;
        if (n.air) {
          n.vy -= 24 * dt;
          p.x = nx;
          p.z = nz;
          p.y += n.vy * dt;
          if (n.vy < 0 && over && p.y <= floor && p.y > floor - 1.2) { // lands on a floor
            p.y = floor;
            n.air = false;
            n.vx *= 0.5;
            n.vz *= 0.5;
            n.group.rotation.set(0, 0, 0);
          } else if (p.y < floor - 1.2 || !over) {
            if (p.y < heightAt(n.home.x, n.home.z) - 1.5) n.out = true;
            if (n.out && !reduce) n.group.rotation.z += dt * (n.kicked ? 2.2 : 0.9); // a slow tip, not a spin
          }
          if (p.y < -45) { // out of the gallery
            n.gone = 7;
            n.group.visible = false;
            thrown++;
            opts.onThrown(thrown);
          }
        } else if (over && Math.abs(floor - p.y) < 0.7) { // sliding along the floor
          p.x = nx;
          p.z = nz;
          p.y = floor;
          var f = Math.pow(0.03, dt);
          n.vx *= f;
          n.vz *= f;
        } else if (over && floor > p.y) { // a step up in the way
          n.vx *= -0.35;
          n.vz *= -0.35;
        } else { // over the edge: it just slips off
          n.air = true;
          n.kicked = false;
          n.vy = 0;
          n.vx *= 0.45;
          n.vz *= 0.45;
          p.x = nx;
          p.z = nz;
        }
        n.tx = p.x;
        n.tz = p.z;
        n.shadow.visible = !n.air;
      });
    }

    /* ---- loop ---- */
    // Until the first click the view is held off-centre, so the building sits beside the name.
    var SIDE = new THREE.Vector3(), intro = 1, started = false;
    if (aspect > 1.2) SIDE.addScaledVector(rightV, -halfW * 0.4).addScaledVector(upV, halfH * 0.1);
    else if (aspect < 0.8) SIDE.addScaledVector(upV, halfH * 0.3);
    var focus = pawn.position.clone().add(SIDE), want = new THREE.Vector3(), tmp = new THREE.Vector3();
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);
      if (!active()) return;
      time += dt;

      if (mode !== "over" && zoom < 1) { zoom = reduce ? 1 : Math.min(1, zoom + dt * 0.7); frustum(); }

      if (mode === "walk") {
        var moving = false;
        if (path.length) {
          var t = path[0], tx = t.x - pawn.position.x, tz = t.z - pawn.position.z;
          var dist = Math.sqrt(tx * tx + tz * tz), step = 8 * dt;
          if (dist <= step) {
            pawn.position.x = t.x;
            pawn.position.z = t.z;
            path.shift();
            if (!path.length) {
              if (pending) { var pc = pending; pending = null; opts.onOpen(pc.project.slug); }
              else if (jumpDir) { var jd = jumpDir; jumpDir = null; jumpOff(jd); }
            }
          } else {
            pawn.position.x += (tx / dist) * step;
            pawn.position.z += (tz / dist) * step;
          }
          moving = true;
        }
        if (mode === "walk") pawn.position.y = heightAt(pawn.position.x, pawn.position.z, pawn.position.y);
        if (moving && !reduce) walkT += dt * 12;
        body.position.y = 0.55 + Math.abs(Math.sin(walkT)) * 0.09;
        head.position.y = 1.32 + Math.abs(Math.sin(walkT)) * 0.13;
        marker.material.opacity = path.length ? Math.max(0.25, marker.material.opacity - dt * 0.6) : Math.max(0, marker.material.opacity - dt * 2);
      }
      if (mode === "walk") { // checked again: the figure may have just jumped
        var best = null, bestD = OPEN_RANGE;
        pieces.forEach(function (pc) {
          var ds = distTo(pc.stand);
          if (ds < bestD && Math.abs(pc.level - pawn.position.y) < 1) { bestD = ds; best = pc; }
        });
        if (best !== near) { near = best; opts.onNear(near ? near.project : null); }
      }

      if (mode === "drop") {
        vel.y -= 24 * dt;
        pawn.position.addScaledVector(vel, dt);
        pawn.rotation.z += dt * 3;
        if (pawn.position.y < dropFrom - 30) { // far enough below: the fall becomes the scroll gallery
          fallBase.copy(focus);
          fallS = 0;
          fallTo = fallFirst; // drift down to the first project, then it is yours to scroll
          setMode("fall");
        }
      }

      if (mode === "fall") {
        fallTo = Math.max(0, Math.min(fallMax, fallTo));
        fallS += (fallTo - fallS) * (reduce ? 1 : 1 - Math.pow(0.0008, dt)); // eased, so the wheel feels smooth
        var atEnd = fallTo >= fallMax - 4;
        if (atEnd !== fallEnd) { fallEnd = atEnd; opts.onState(mode, fallEnd); }
        var drop = fallS * pxWorld; // the scene moves with the cards, one to one
        want.copy(fallBase).addScaledVector(upV, -drop);
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.0001, dt));
        // the figure hangs in the upper part of the screen, tumbling
        tmp.copy(focus).addScaledVector(upV, halfH * 0.04).addScaledVector(rightV, Math.sin(time * 0.7) * 0.6).addScaledVector(towardV, 6);
        pawn.position.lerp(tmp, 1 - Math.pow(0.01, dt));
        if (!reduce) pawn.rotation.z = Math.sin(time * 1.6) * 0.7;
        starsFar.position.y = drop * 0.06;
        starsNear.position.y = drop * 0.16;
        placeCards();
      } else {
        if (started && intro > 0) intro = Math.max(0, intro - dt * 0.9);
        want.copy(pawn.position).addScaledVector(SIDE, intro * intro * (3 - 2 * intro));
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.02, dt));
      }
      if (mode !== "fall") updateNpcs(dt);
      camera.position.copy(focus).add(CAM);
      opts.onMove((1 - intro) * 7);

      renderer.render(scene, camera);
    }

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
      build();
      host.dataset.mode = mode;
      frame();
    });
    return { climbBack: climbBack, debug: { npcs: npcs, pawn: pawn, kick: kick, walkTo: walkTo } };
  }
};
