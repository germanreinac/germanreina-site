/*
  The walkable gallery: an isometric diorama floating in dark space, with fog around it.
  An entrance, two rooms (studio work, own projects) and the hallways between them.

  - You land on a view of the whole thing; the first click steps in.
  - Click (tap) the floor to walk. Click a piece: if you are close it opens, if not the
    figure walks over to it first and it opens on arrival.
  - Click well outside the platform and the figure walks to the edge and jumps off.
    The fall becomes a second way to browse: scroll (or drag) down past the projects.

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
    var OPEN_RANGE = 4.5;      // how close the figure must be for a click to open a piece
    var CLEAR = 9, FADE = 12;  // pieces are clear within CLEAR, veiled by CLEAR + FADE
    var JUMP_MARGIN = 2.5;     // a click this far outside the floor means "jump off"
    var FALL_FIRST = 14, FALL_GAP = 10; // spacing of the projects on the way down
    var WALL_H = 6.8, CURB_H = 0.9, WALL_T = 0.4, SLAB = 1.4;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- floor plan. The camera looks from +x +z, so -x and -z are "into the screen". ---- */
    var FLOORS = [
      { x0: -5, x1: 5, z0: -5, z1: 5 },        // entrance
      { x0: -2, x1: 2, z0: -13, z1: -5 },      // hallway to the studio room
      { x0: -14, x1: 14, z0: -35, z1: -13 },   // studio room
      { x0: -13, x1: -5, z0: -2, z1: 2 },      // hallway to the own-projects room
      { x0: -27, x1: -13, z0: -8, z1: 8 }      // own-projects room
    ];
    // Same shapes for walking, with the hallways reaching into the rooms so they connect.
    var WALKS = [FLOORS[0], { x0: -2, x1: 2, z0: -15, z1: -3 }, FLOORS[2], { x0: -15, x1: -3, z0: -2, z1: 2 }, FLOORS[4]];
    // Walls: axis "z" = runs along x at a fixed z (faces the camera on +z); axis "x" = runs along z.
    var WALLS = [
      { axis: "z", at: -35, a: -14, b: 14, h: WALL_H }, { axis: "x", at: -14, a: -35, b: -13, h: WALL_H },
      { axis: "z", at: -8, a: -27, b: -13, h: WALL_H }, { axis: "x", at: -27, a: -8, b: 8, h: WALL_H },
      { axis: "z", at: -5, a: -5, b: -2, h: CURB_H }, { axis: "z", at: -5, a: 2, b: 5, h: CURB_H },
      { axis: "x", at: -5, a: -5, b: -2, h: CURB_H }, { axis: "x", at: -5, a: 2, b: 5, h: CURB_H },
      { axis: "x", at: -2, a: -13, b: -5, h: CURB_H }, { axis: "z", at: -2, a: -13, b: -5, h: CURB_H }
    ];
    // Hanging spots. Projects fill them in the order they appear in projects.js.
    var SLOTS = {
      studio: [
        { axis: "z", at: -35, pos: -10.5 }, { axis: "z", at: -35, pos: -3.5 }, { axis: "z", at: -35, pos: 3.5 },
        { axis: "z", at: -35, pos: 10.5 }, { axis: "x", at: -14, pos: -30.5 }, { axis: "x", at: -14, pos: -23.5 },
        { axis: "x", at: -14, pos: -16.5 }
      ],
      own: [{ axis: "x", at: -27, pos: -4 }, { axis: "x", at: -27, pos: 4 }, { axis: "z", at: -8, pos: -20 }]
    };
    var LABELS = [
      { text: "Games and studio work", x: 1, z: -15.5 },
      { text: "Own projects", x: -19.5, z: 6 }
    ];
    var START = { x: 1.5, z: 1.5 };
    var CENTER = { x: -6.5, z: -13.5 };

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

    /* ---- stars: two layers fixed to the camera, they slide at different speeds in the fall ---- */
    function starLayer(n, size, opacity) {
      var pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 190;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 220;
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
    var starsFar = starLayer(320, 1.8, 0.65), starsNear = starLayer(70, 3, 0.9);

    /* ---- floor slabs ---- */
    var tile = (function () {
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
    var sideX = flat(0x9aa4a3), sideZ = flat(0x818c8c), hiddenM = flat(0x818c8c);
    FLOORS.forEach(function (r) {
      var w = r.x1 - r.x0, d = r.z1 - r.z0;
      var t = new THREE.CanvasTexture(tile);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(w / 2, d / 2);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      var top = new THREE.MeshBasicMaterial({ map: t });
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, SLAB, d), [sideX, hiddenM, top, hiddenM, sideZ, hiddenM]);
      m.position.set((r.x0 + r.x1) / 2, -SLAB / 2, (r.z0 + r.z1) / 2);
      scene.add(m);
    });

    /* ---- walls ---- */
    var wallMats = [flat(0xe6e8e3), flat(0xe6e8e3), flat(0xf5f5f1), flat(0xf5f5f1), flat(0xd9ddd8), flat(0xd9ddd8)];
    WALLS.forEach(function (w) {
      var len = w.b - w.a, mid = (w.a + w.b) / 2;
      var geo = w.axis === "z" ? new THREE.BoxGeometry(len, w.h, WALL_T) : new THREE.BoxGeometry(WALL_T, w.h, len);
      var m = new THREE.Mesh(geo, wallMats);
      if (w.axis === "z") m.position.set(mid, w.h / 2, w.at - WALL_T / 2);
      else m.position.set(w.at - WALL_T / 2, w.h / 2, mid);
      scene.add(m);
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
    var puffTex = radial("rgba(236,239,236,0.95)", "rgba(236,239,236,0)");
    function shadow(w, d) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.02;
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

    /* ---- pieces on the walls, the same pieces again for the fall, floor labels ---- */
    var pieces = [], fallPieces = [];
    var FALL_DEPTH = [1, 0.82, 1.12]; // parallax: below 1 is further away (smaller, slower)
    function build() {
      var loader = new THREE.TextureLoader();
      var used = { studio: 0, own: 0 };
      projects.forEach(function (p, i) {
        var s = SIZES[p.shape] || SIZES.wide;
        var tex = p.images[0] ? loader.load(p.images[0]) : placeholder(p, s[0], s[1]);

        var k = FALL_DEPTH[i % FALL_DEPTH.length];
        var fm = new THREE.Mesh(
          new THREE.PlaneGeometry(s[0], s[1]),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: k < 1 ? 0.8 : 1 })
        );
        fm.quaternion.copy(camera.quaternion);
        fm.visible = false;
        fm.userData.index = fallPieces.length;
        scene.add(fm);
        fallPieces.push({ mesh: fm, project: p, k: k, side: i % 2 ? -1 : 1, v: FALL_FIRST + i * FALL_GAP, w: s[0] });

        var slots = SLOTS[p.kind] || SLOTS.studio;
        var slot = slots[used[p.kind]++];
        if (!slot) return; // more projects than hanging spots: add a slot above
        var face = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        var edge = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], 0.14), [edge, edge, edge, edge, face, edge]);
        mesh.userData.index = pieces.length;
        var onZ = slot.axis === "z";
        var x = onZ ? slot.pos : slot.at + 0.09, z = onZ ? slot.at + 0.09 : slot.pos;
        mesh.position.set(x, WALL_H / 2 + 0.2, z);
        mesh.rotation.y = onZ ? 0 : Math.PI / 2;
        scene.add(mesh);
        pieces.push({
          mesh: mesh, project: p, mats: [face, edge], x: x, z: z,
          stand: { x: x + (onZ ? 0 : 2.8), z: z + (onZ ? 2.8 : 0) }
        });
      });

      LABELS.forEach(function (l) {
        var c = document.createElement("canvas");
        c.width = 1024;
        c.height = 128;
        var g = c.getContext("2d");
        g.fillStyle = "rgba(31,26,36,0.55)";
        g.font = '800 84px "Bricolage Grotesque", Arial, sans-serif';
        g.textBaseline = "middle";
        g.fillText(l.text, 8, 68);
        var m = new THREE.Mesh(
          new THREE.PlaneGeometry(11, 1.375),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(l.x + 5.5, 0.03, l.z);
        scene.add(m);
      });
    }
    var fallMax = FALL_FIRST + (projects.length - 1) * FALL_GAP + 5;

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
    marker.position.y = 0.04;
    scene.add(marker);

    /* ---- fog: thicker over the diorama, thin wisps in the space around and below it ---- */
    var puffs = [];
    for (var i = 0; i < 70; i++) {
      var over = i % 2 === 0;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: puffTex, transparent: true, opacity: over ? 0.2 : 0.045, depthWrite: false
      }));
      var sc = over ? 8 + Math.random() * 9 : 12 + Math.random() * 14;
      sp.scale.set(sc, sc * 0.55, 1);
      var spread = over ? 48 : 80;
      sp.position.set(
        CENTER.x + (Math.random() - 0.5) * spread,
        over ? 1 + Math.random() * 4 : -3 - Math.random() * 10,
        CENTER.z + (Math.random() - 0.5) * spread
      );
      sp.userData.v = (Math.random() - 0.5) * 0.6;
      scene.add(sp);
      puffs.push(sp);
    }

    /* ---- walking: a grid over the floor plan, A* between cells ---- */
    var GX0 = -29, GZ0 = -37, GW = 46, GH = 48, M = 0.6;
    function walkable(x, z) {
      for (var i = 0; i < WALKS.length; i++) {
        var r = WALKS[i];
        if (x >= r.x0 + M && x <= r.x1 - M && z >= r.z0 + M && z <= r.z1 - M) return true;
      }
      return false;
    }
    function offFloorBy(x, z) { // 0 when over a floor, otherwise distance to the nearest floor
      var best = Infinity;
      FLOORS.forEach(function (r) {
        var dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
        best = Math.min(best, Math.hypot(dx, dz));
      });
      return best;
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
    // mode: "over" whole diorama, "walk", "drop" (jumped, still near the platform), "fall" (scroll gallery)
    var mode = "over", zoom = 0, aspect = 1, halfW = 10, halfH = 10, pxWorld = 0.03;
    function layout() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      aspect = w / h;
      renderer.setSize(w, h, false);
      frustum();
    }
    function frustum() {
      var e = zoom * zoom * (3 - 2 * zoom);
      var far = Math.max(31, 25 * aspect), close = Math.max(13 * aspect, 10);
      halfW = far + (close - far) * e;
      halfH = halfW / aspect;
      pxWorld = (2 * halfH) / (host.clientHeight || 1);
      camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", layout);
    layout();

    /* ---- input ---- */
    var path = [], pending = null, near = null, jumpDir = null;
    var vel = new THREE.Vector3(), fallBase = new THREE.Vector3(), fallS = 0, fallEnd = false;
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null, lastY = 0, dragged = false;
    var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitPt = new THREE.Vector3();
    function setPtr(e) {
      var r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
    }
    function hit(list) {
      var hits = ray.intersectObjects(list.map(function (p) { return p.mesh; }));
      return hits.length ? list[hits[0].object.userData.index] : null;
    }
    function distTo(pt) { return Math.hypot(pt.x - pawn.position.x, pt.z - pawn.position.z); }
    function walkTo(pt) {
      path = route(pt);
      if (!path.length) return;
      var end = path[path.length - 1];
      marker.position.x = end.x;
      marker.position.z = end.z;
      marker.material.opacity = 0.7;
    }
    function visit(pc) {
      jumpDir = null;
      if (distTo(pc.stand) <= OPEN_RANGE) { pending = null; path = []; opts.onOpen(pc.project.slug); }
      else { pending = pc; walkTo(pc.stand); }
    }
    function setMode(m) {
      mode = m;
      opts.onState(mode, fallEnd);
    }
    function jumpOff(dir) {
      vel.set(dir.x * 5, 7, dir.z * 5);
      pawnShadow.visible = false;
      marker.material.opacity = 0;
      near = null;
      opts.onNear(null);
      setMode("drop");
    }
    function climbBack() {
      fallPieces.forEach(function (f) { f.mesh.visible = false; });
      pawn.position.set(START.x, 0, START.z);
      pawn.rotation.set(0, 0, 0);
      pawnShadow.visible = true;
      focus.set(START.x, 0, START.z);
      path = []; pending = null; jumpDir = null; fallS = 0; fallEnd = false;
      starsFar.position.y = starsNear.position.y = 0;
      setMode("walk");
    }

    canvas.addEventListener("pointerdown", function (e) {
      downAt = [e.clientX, e.clientY];
      lastY = e.clientY;
      dragged = false;
    });
    canvas.addEventListener("pointermove", function (e) {
      if (downAt && mode === "fall") { // drag to scroll the fall
        if (Math.abs(e.clientY - downAt[1]) > 6) dragged = true;
        fallS += (lastY - e.clientY) * pxWorld;
        lastY = e.clientY;
      }
      if (e.pointerType !== "mouse") return;
      setPtr(e);
      var over = mode === "over" || (mode === "walk" && hit(pieces)) || (mode === "fall" && hit(fallPieces));
      canvas.style.cursor = over ? "pointer" : "default";
    });
    window.addEventListener("pointerup", function () { downAt = null; });
    canvas.addEventListener("pointerup", function (e) {
      if (!downAt || dragged || Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 10) return;
      if (mode === "over") { setMode("walk"); return; } // first click steps in
      setPtr(e);
      if (mode === "fall") {
        var f = hit(fallPieces);
        if (f) opts.onOpen(f.project.slug);
        return;
      }
      if (mode !== "walk") return;
      var pc = hit(pieces);
      if (pc) { visit(pc); return; }
      if (!ray.ray.intersectPlane(groundPlane, hitPt)) return;
      pending = null;
      jumpDir = null;
      walkTo({ x: hitPt.x, z: hitPt.z });
      if (offFloorBy(hitPt.x, hitPt.z) > JUMP_MARGIN && path.length) {
        // a click well outside: walk to the edge, then jump towards the click
        var end = path[path.length - 1];
        var dx = hitPt.x - end.x, dz = hitPt.z - end.z, d = Math.hypot(dx, dz) || 1;
        jumpDir = { x: dx / d, z: dz / d };
        marker.position.x = hitPt.x;
        marker.position.z = hitPt.z;
      }
    });
    canvas.addEventListener("wheel", function (e) {
      if (mode !== "fall") return;
      fallS += e.deltaY * 0.03;
      e.preventDefault();
    }, { passive: false });
    window.addEventListener("keydown", function (e) {
      if (!active() || document.activeElement !== document.body) return;
      if (mode === "fall" && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ")) {
        fallS += e.key === "ArrowUp" ? -4 : 4;
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
    var overShift = aspect > 1.2 ? 6.5 : 0; // on wide screens the diorama sits to the right of the name
    var focus = new THREE.Vector3(CENTER.x - overShift, 0, CENTER.z + overShift), want = new THREE.Vector3(), tmp = new THREE.Vector3();
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
        if (moving && !reduce) walkT += dt * 12;
        body.position.y = 0.55 + Math.abs(Math.sin(walkT)) * 0.09;
        head.position.y = 1.32 + Math.abs(Math.sin(walkT)) * 0.13;
        marker.material.opacity = path.length ? Math.max(0.25, marker.material.opacity - dt * 0.6) : Math.max(0, marker.material.opacity - dt * 2);
      }

      if (mode === "drop") {
        vel.y -= 24 * dt;
        pawn.position.addScaledVector(vel, dt);
        pawn.rotation.z += dt * 3;
        if (pawn.position.y < -20) { // far enough below: the fall becomes the scroll gallery
          fallBase.copy(focus);
          fallS = 0;
          setMode("fall");
        }
      }

      if (mode === "fall") {
        if (!downAt && fallS < fallMax && !reduce) fallS += dt * 1.1; // keeps drifting down
        fallS = Math.max(0, Math.min(fallMax, fallS));
        var atEnd = fallS >= fallMax - 0.01;
        if (atEnd !== fallEnd) { fallEnd = atEnd; opts.onState(mode, fallEnd); }
        want.copy(fallBase).addScaledVector(upV, -fallS);
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.0005, dt));
        // the figure hangs in the upper part of the screen, tumbling
        tmp.copy(focus).addScaledVector(upV, halfH * 0.42).addScaledVector(rightV, Math.sin(time * 0.7) * 0.6).addScaledVector(towardV, 6);
        pawn.position.lerp(tmp, 1 - Math.pow(0.01, dt));
        if (!reduce) pawn.rotation.z = Math.sin(time * 1.6) * 0.7;
        var drop = fallS; // how far we have fallen, in world units
        fallPieces.forEach(function (f) {
          var fit = Math.min(2.2, (halfW * 0.75) / 6.4) * f.k;
          var y = (drop - f.v) * f.k;
          f.mesh.visible = Math.abs(y) < halfH + 14;
          f.mesh.scale.set(fit, fit, 1);
          f.mesh.position.copy(focus)
            .addScaledVector(upV, y)
            .addScaledVector(rightV, f.side * halfW * (aspect > 1 ? 0.42 : 0.3))
            .addScaledVector(towardV, f.k * 4);
        });
        starsFar.position.y = drop * 0.05;
        starsNear.position.y = drop * 0.13;
      } else {
        if (mode === "over") want.set(CENTER.x - overShift, 0, CENTER.z + overShift);
        else want.copy(pawn.position);
        focus.lerp(want, reduce ? 1 : 1 - Math.pow(0.02, dt));
      }
      camera.position.copy(focus).add(CAM);
      starsNear.material.opacity = 0.75 + Math.sin(time * 1.3) * 0.2;

      if (!reduce) {
        puffs.forEach(function (s) {
          s.position.x += s.userData.v * dt;
          s.position.z -= s.userData.v * dt;
        });
      }

      // fog: pieces away from the figure are veiled (all clear in the overview)
      if (mode === "over" || mode === "walk") {
        var best = null, bestD = OPEN_RANGE;
        pieces.forEach(function (pc) {
          var o = Math.max(0.22, Math.min(1, 1 - (distTo(pc) - CLEAR) / FADE));
          o = Math.max(o, 1 - zoom);
          pc.mats[0].opacity = o;
          pc.mats[1].opacity = o;
          var ds = distTo(pc.stand);
          if (ds < bestD) { bestD = ds; best = pc; }
        });
        if (mode === "over") best = null;
        if (best !== near) { near = best; opts.onNear(near ? near.project : null); }
      }
      opts.onMove(zoom * 7);

      renderer.render(scene, camera);
    }

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
      build();
      frame();
    });
    return { climbBack: climbBack };
  }
};
