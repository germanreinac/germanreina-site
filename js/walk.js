/*
  The walkable gallery: an isometric stepped block floating in dark space.

  Four terraces on three levels, joined by four staircases in a loop:
    front (ground) -> right and left (middle) -> back (top).
  Art hangs on the risers between levels and on the two walls of the top terrace.

  - You land on a view of the whole thing; the first click steps in.
  - Click (tap) a floor or stair to walk there. Click a piece: if you are close it opens,
    if not the figure walks over to it first and it opens on arrival.
  - Click well outside the block and the figure walks to the edge and jumps off.
    The fall is a second way to browse: scroll (or drag) down past the projects.

  Returns false if WebGL is not available, so main.js can fall back to the flat wall.
*/
window.Walk = {
  start: function (opts) {
    var THREE = window.THREE;
    if (!THREE) return false;
    var host = opts.host, projects = opts.projects;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      return false;
    }

    var SPACE = 0x17151d, INK = 0x1f1a24, PENCIL = 0xffc52e;
    var SIZES = { wide: [6.4, 4], tall: [4.2, 5.6], square: [4.6, 4.6] };
    var ART = 0.78;          // pieces are scaled down a little to fit the risers
    var OPEN_RANGE = 4.5;    // how close the figure must be for a click to open a piece
    var JUMP_MARGIN = 2.5;   // a click this far outside the block means "jump off"
    var S = 15;              // side of one terrace
    var H = 5;               // height of one level
    var BASE = 1.4;          // how far the block continues below the ground terrace
    var WALL_H = 5.2, WALL_T = 0.4, STEPS = 10, RUN = 7;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- plan. The camera looks from +x +z, so -x and -z are "into the screen". ---- */
    function levelAt(x, z) { return x >= 0 ? (z >= 0 ? 0 : H) : (z >= 0 ? H : 2 * H); }
    // Stairs: "run" is the axis you climb along (from RUN down to 0), l0..l1 the strip they occupy across.
    var STAIRS = [
      { run: "z", l0: 11, l1: 15, lo: 0 },     // front -> right
      { run: "x", l0: 11, l1: 15, lo: 0 },     // front -> left
      { run: "x", l0: -15, l1: -11, lo: H },   // right -> back
      { run: "z", l0: -15, l1: -11, lo: H }    // left -> back
    ];
    function onStair(st, x, z, pad, ext) {
      var across = st.run === "z" ? x : z, along = st.run === "z" ? z : x;
      return across >= st.l0 + pad && across <= st.l1 - pad && along >= -ext && along <= RUN + ext;
    }
    function heightAt(x, z) {
      for (var i = 0; i < STAIRS.length; i++) {
        var st = STAIRS[i];
        if (onStair(st, x, z, 0.5, 1.6)) {
          var along = st.run === "z" ? z : x;
          return st.lo + Math.max(0, Math.min(1, (RUN - along) / RUN)) * H;
        }
      }
      return levelAt(x, z);
    }
    // Hanging spots. axis "z": on a face at fixed z, looking at the camera on +z. axis "x": same for x.
    var SLOTS = {
      studio: [
        // one per ground riser (the stairs hide anything hung closer to them), two per middle riser
        { axis: "z", at: 0, pos: 4.6, level: 0 }, { axis: "x", at: 0, pos: 4.6, level: 0 },
        { axis: "x", at: 0, pos: -3.4, level: H }, { axis: "z", at: 0, pos: -3.4, level: H },
        { axis: "x", at: 0, pos: -8.4, level: H }, { axis: "z", at: 0, pos: -8.4, level: H },
        { axis: "x", at: -S, pos: -4.4, level: 2 * H }, { axis: "x", at: -S, pos: -10.4, level: 2 * H }
      ],
      own: [
        { axis: "z", at: -S, pos: -2.7, level: 2 * H }, { axis: "z", at: -S, pos: -7.4, level: 2 * H },
        { axis: "z", at: -S, pos: -12.1, level: 2 * H }
      ]
    };
    var LABELS = [
      { text: "Games and studio work", x: 1.2, z: 9.6, y: 0 },
      { text: "Own projects", x: -13.6, z: -1.6, y: 2 * H }
    ];
    var START = { x: 7.5, z: 7.5 };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(SPACE);
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
        pos[i * 3] = (Math.random() - 0.5) * 190;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 240;
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
    var starsFar = starLayer(260, 1, 0.3), starsNear = starLayer(34, 1.5, 0.6);

    /* ---- the block: four terraces, stairs, two walls on the top terrace ---- */
    var solid = []; // everything a click can land on
    var tile = (function () {
      var c = document.createElement("canvas");
      c.width = c.height = 128;
      var g = c.getContext("2d");
      g.fillStyle = "#d6dbd9";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(31,26,36,0.08)";
      g.lineWidth = 2;
      g.strokeRect(0, 0, 128, 128);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(S / 2.5, S / 2.5);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    })();
    var faceX = flat(0xe9ebe6), faceZ = flat(0xd3d8d4), topPlain = flat(0xf5f5f1);
    var topTile = new THREE.MeshBasicMaterial({ map: tile });
    function box(x0, x1, y0, y1, z0, z1, top) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
        [faceX, faceX, top, faceZ, faceZ, faceZ]
      );
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      scene.add(m);
      solid.push(m);
      return m;
    }
    box(0, S, -BASE, 0, 0, S, topTile);          // front, ground level
    box(0, S, -BASE, H, -S, 0, topTile);         // right, middle level
    box(-S, 0, -BASE, H, 0, S, topTile);         // left, middle level
    box(-S, 0, -BASE, 2 * H, -S, 0, topTile);    // back, top level
    STAIRS.forEach(function (st) {
      for (var i = 0; i < STEPS; i++) {
        var a1 = RUN - (i * RUN) / STEPS, a0 = RUN - ((i + 1) * RUN) / STEPS;
        var y1 = st.lo + ((i + 1) * H) / STEPS;
        if (st.run === "z") box(st.l0, st.l1, st.lo, y1, a0, a1, topPlain);
        else box(a0, a1, st.lo, y1, st.l0, st.l1, topPlain);
      }
    });
    box(-S, 0, 2 * H, 2 * H + WALL_H, -S - WALL_T, -S, topPlain);
    box(-S - WALL_T, -S, 2 * H, 2 * H + WALL_H, -S - WALL_T, 0, topPlain);

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

    /* ---- pieces on the block, floor labels, and the cards for the fall ---- */
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
        var s = SIZES[p.shape] || SIZES.wide, w = s[0] * ART, h = s[1] * ART;
        var face = new THREE.MeshBasicMaterial({ map: p.images[0] ? loader.load(p.images[0]) : placeholder(p, s[0], s[1]) });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.14), [edge, edge, edge, edge, face, edge]);
        mesh.userData.index = pieces.length;
        var onZ = slot.axis === "z";
        var x = onZ ? slot.pos : slot.at + 0.09, z = onZ ? slot.at + 0.09 : slot.pos;
        mesh.position.set(x, slot.level + 0.35 + h / 2, z);
        mesh.rotation.y = onZ ? 0 : Math.PI / 2;
        scene.add(mesh);
        pieces.push({ mesh: mesh, project: p, stand: { x: x + (onZ ? 0 : 2.6), z: z + (onZ ? 2.6 : 0) } });
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
      placeCards();
    }

    // Fall cards are plain HTML over the canvas: crisp text and real perspective.
    function makeCard(p, i) {
      var doc = document, card = doc.createElement("article");
      card.className = "fcard" + (i % 2 ? " fcard--flip" : "");
      var art = doc.createElement("button");
      art.type = "button";
      art.className = "fcard__art";
      art.setAttribute("aria-label", "Open " + p.title);
      var s = opts.shapes[p.shape] || opts.shapes.wide;
      art.style.setProperty("--ar", s.ar);
      art.style.setProperty("--tone", p.tone);
      art.appendChild(opts.makeFrame(p, p.images[0]));
      art.addEventListener("click", function () { if (!dragged) opts.onOpen(p.slug); });
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
    pawn.position.set(START.x, 0, START.z);
    scene.add(pawn);

    var marker = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false })
    );
    marker.rotation.x = -Math.PI / 2;
    scene.add(marker);

    /* ---- walking: a grid over the plan, A* between cells ---- */
    var GX0 = -16, GZ0 = -16, GW = 32, GH = 32, M = 0.6;
    function walkable(x, z) {
      for (var i = 0; i < STAIRS.length; i++) if (onStair(STAIRS[i], x, z, 0.9, 1.5)) return true;
      for (var j = 0; j < STAIRS.length; j++) if (onStair(STAIRS[j], x, z, -0.6, 0)) return false; // no stepping on from the side
      var qx = x >= 0 ? x : -x, qz = z >= 0 ? z : -z;
      return qx >= M && qx <= S - M && qz >= M && qz <= S - M;
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
    // mode: "over" whole block, "walk", "drop" (jumped, still near the block), "fall" (scroll gallery)
    var mode = "over", zoom = 0, aspect = 1, halfW = 10, halfH = 10, pxWorld = 0.03, viewH = 1;
    var fallS = 0, fallFirst = 0, fallGap = 0, fallMax = 0, fallEnd = false; // the fall is measured in screen pixels
    function layout() {
      var w = host.clientWidth || 1;
      viewH = host.clientHeight || 1;
      aspect = w / viewH;
      renderer.setSize(w, viewH, false);
      fallFirst = viewH * 0.8;
      fallGap = Math.max(viewH * 0.66, aspect < 0.8 ? 560 : 440);
      fallMax = fallFirst + (projects.length - 1) * fallGap;
      frustum();
    }
    function frustum() {
      var e = zoom * zoom * (3 - 2 * zoom);
      var far = Math.max(26, 24 * aspect), close = Math.max(15 * aspect, 12);
      halfW = far + (close - far) * e;
      halfH = halfW / aspect;
      pxWorld = (2 * halfH) / viewH;
      camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", layout);
    layout();

    function placeCards() {
      if (mode !== "fall") return;
      cards.forEach(function (c, i) {
        var y = fallFirst + i * fallGap - fallS; // px below the middle of the screen
        var t = y / viewH;                        // -0.5 top edge, 0.5 bottom edge
        var show = Math.abs(t) < 1.1;
        if (c.el.hidden === show) c.el.hidden = !show;
        if (!show) return;
        var turn = Math.max(-1, Math.min(1, t * 1.6));
        c.el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
        c.el.style.opacity = Math.max(0, Math.min(1, 1.25 - Math.abs(t) * 1.7)).toFixed(2);
        if (reduce) return;
        // the art leans towards the figure and tips as it passes; the text slides at its own speed
        c.art.style.transform = "rotateY(" + (-c.side * 14).toFixed(1) + "deg) rotateX(" + (-turn * 20).toFixed(1) + "deg)";
        c.text.style.transform = "translate3d(0," + (y * 0.14).toFixed(1) + "px,0)";
      });
    }

    /* ---- input ---- */
    var path = [], pending = null, near = null, jumpDir = null, dropFrom = 0;
    var vel = new THREE.Vector3(), fallBase = new THREE.Vector3();
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null, lastY = 0, dragged = false;
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitPt = new THREE.Vector3();
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
      var sameLevel = Math.abs(heightAt(pc.stand.x, pc.stand.z) - pawn.position.y) < 1;
      if (sameLevel && distTo(pc.stand) <= OPEN_RANGE) { pending = null; path = []; opts.onOpen(pc.project.slug); }
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
      pawn.position.set(START.x, 0, START.z);
      pawn.rotation.set(0, 0, 0);
      pawnShadow.visible = true;
      focus.copy(pawn.position);
      path = []; pending = null; jumpDir = null; fallS = 0; fallEnd = false;
      starsFar.position.y = starsNear.position.y = 0;
      setMode("walk");
    }

    host.addEventListener("pointerdown", function (e) {
      downAt = [e.clientX, e.clientY];
      lastY = e.clientY;
      dragged = false;
    });
    host.addEventListener("pointermove", function (e) {
      if (downAt && mode === "fall") { // drag to scroll the fall
        if (Math.abs(e.clientY - downAt[1]) > 6) dragged = true;
        fallS += lastY - e.clientY;
        lastY = e.clientY;
      }
      if (e.pointerType !== "mouse" || e.target !== canvas) return;
      setPtr(e);
      canvas.style.cursor = mode === "over" || (mode === "walk" && hitPiece()) ? "pointer" : "default";
    });
    window.addEventListener("pointerup", function () { downAt = null; });
    host.addEventListener("pointerup", function (e) {
      if (e.target !== canvas || !downAt || dragged) return;
      if (Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 10) return;
      if (mode === "over") { setMode("walk"); return; } // first click steps in
      if (mode !== "walk") return;
      setPtr(e);
      var pc = hitPiece();
      if (pc) { visit(pc); return; }
      pending = null;
      jumpDir = null;
      var hits = ray.intersectObjects(solid);
      if (hits.length) { walkTo({ x: hits[0].point.x, z: hits[0].point.z }); return; }
      // nothing under the click: it is out in space, at the height the figure stands on
      plane.constant = -pawn.position.y;
      if (!ray.ray.intersectPlane(plane, hitPt)) return;
      walkTo({ x: hitPt.x, z: hitPt.z });
      var outside = Math.max(Math.abs(hitPt.x), Math.abs(hitPt.z)) - S;
      if (outside > JUMP_MARGIN && path.length) {
        var end = path[path.length - 1];
        var dx = hitPt.x - end.x, dz = hitPt.z - end.z, d = Math.hypot(dx, dz) || 1;
        jumpDir = { x: dx / d, z: dz / d };
        marker.material.opacity = 0;
      }
    });
    host.addEventListener("wheel", function (e) {
      if (mode !== "fall") return;
      fallS += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if (!active() || document.activeElement !== document.body) return;
      if (mode === "fall" && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ")) {
        fallS += (e.key === "ArrowUp" ? -1 : 1) * viewH * 0.4;
        e.preventDefault();
      }
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (mode === "over") setMode("walk");
      else if (mode === "walk" && near) visit(near);
    });

    function active() { return !host.hidden && host.offsetParent !== null && !opts.isBlocked(); }

    /* ---- loop ---- */
    var clock = new THREE.Clock(), walkT = 0, time = 0;
    var OVER = new THREE.Vector3(0, 4.5, 0);
    if (aspect > 1.2) OVER.addScaledVector(rightV, -10); // on wide screens the block sits to the right of the name
    if (aspect < 0.8) OVER.addScaledVector(upV, 7);      // on tall screens it sits below the name
    var focus = OVER.clone(), want = new THREE.Vector3(), tmp = new THREE.Vector3();
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
        if (mode === "walk") pawn.position.y = heightAt(pawn.position.x, pawn.position.z);
        if (moving && !reduce) walkT += dt * 12;
        body.position.y = 0.55 + Math.abs(Math.sin(walkT)) * 0.09;
        head.position.y = 1.32 + Math.abs(Math.sin(walkT)) * 0.13;
        marker.material.opacity = path.length ? Math.max(0.25, marker.material.opacity - dt * 0.6) : Math.max(0, marker.material.opacity - dt * 2);

      }
      if (mode === "walk") { // checked again: the figure may have just jumped
        var best = null, bestD = OPEN_RANGE;
        pieces.forEach(function (pc) {
          var ds = distTo(pc.stand);
          if (ds < bestD && Math.abs(heightAt(pc.stand.x, pc.stand.z) - pawn.position.y) < 1) { bestD = ds; best = pc; }
        });
        if (best !== near) { near = best; opts.onNear(near ? near.project : null); }
      }

      if (mode === "drop") {
        vel.y -= 24 * dt;
        pawn.position.addScaledVector(vel, dt);
        pawn.rotation.z += dt * 3;
        if (pawn.position.y < dropFrom - 26) { // far enough below: the fall becomes the scroll gallery
          fallBase.copy(focus);
          fallS = 0;
          setMode("fall");
        }
      }

      if (mode === "fall") {
        if (!downAt && fallS < fallMax && !reduce) fallS += dt * 34; // keeps drifting down
        fallS = Math.max(0, Math.min(fallMax, fallS));
        var atEnd = fallS >= fallMax - 1;
        if (atEnd !== fallEnd) { fallEnd = atEnd; opts.onState(mode, fallEnd); }
        var drop = fallS * pxWorld; // the same distance in world units, so the scene moves with the cards
        want.copy(fallBase).addScaledVector(upV, -drop);
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.0001, dt));
        // the figure hangs in the upper part of the screen, tumbling
        tmp.copy(focus).addScaledVector(upV, halfH * 0.5).addScaledVector(rightV, Math.sin(time * 0.7) * 0.6).addScaledVector(towardV, 6);
        pawn.position.lerp(tmp, 1 - Math.pow(0.01, dt));
        if (!reduce) pawn.rotation.z = Math.sin(time * 1.6) * 0.7;
        starsFar.position.y = drop * 0.06;
        starsNear.position.y = drop * 0.16;
        placeCards();
      } else {
        if (mode === "over") want.copy(OVER);
        else want.copy(pawn.position);
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.02, dt));
      }
      camera.position.copy(focus).add(CAM);
      opts.onMove(zoom * 7);

      renderer.render(scene, camera);
    }

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
      build();
      host.dataset.mode = mode;
      frame();
    });
    return { climbBack: climbBack };
  }
};
