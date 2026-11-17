/*
  The walkable gallery. A small figure walks through fog between standing pieces.
  Controls: arrows / WASD, scroll, or click (tap) the floor. Click a piece to open it.
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

    var FOG = 0xdde2e0, INK = 0x1f1a24, PENCIL = 0xffc52e;
    var SIZES = { wide: [6.4, 4], tall: [4.2, 5.6], square: [4.6, 4.6] };
    var GAP = 11, FIRST = -10;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(FOG);
    host.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG, 0.042);
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    var portrait = false;

    /* ground and path */
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({ color: 0xc3cbc9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    var endZ = FIRST - projects.length * GAP;
    var path = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, Math.abs(endZ) + 30),
      new THREE.MeshBasicMaterial({ color: 0xd3d9d7 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.01, endZ / 2);
    scene.add(path);

    /* soft round texture, used for shadows and fog puffs */
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
    var shadowTex = radial("rgba(31,26,36,0.38)", "rgba(31,26,36,0)");
    var puffTex = radial("rgba(245,245,241,0.9)", "rgba(245,245,241,0)");

    function shadow(w, d) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.02;
      return m;
    }

    /* placeholder face for a piece with no image yet */
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

    /* pieces */
    var pieces = [];
    var edge = new THREE.MeshBasicMaterial({ color: 0xf5f5f1 });
    function buildPieces() {
      var loader = new THREE.TextureLoader();
      projects.forEach(function (p, i) {
        var s = SIZES[p.shape] || SIZES.wide;
        var face = new THREE.MeshBasicMaterial({
          map: p.images[0] ? loader.load(p.images[0]) : placeholder(p, s[0], s[1])
        });
        var mesh = new THREE.Mesh(
          new THREE.BoxGeometry(s[0], s[1], 0.18),
          [edge, edge, edge, edge, face, edge]
        );
        var side = i % 2 ? -1 : 1;
        var off = 4.6 + (i % 3) * 0.8;
        var g = new THREE.Group();
        mesh.position.y = s[1] / 2 + 0.7;
        g.add(mesh);
        g.add(shadow(s[0] * 1.3, 2.6));
        g.userData = { side: side, off: off };
        g.position.z = FIRST - i * GAP;
        g.rotation.y = -side * 0.45;
        mesh.userData.slug = p.slug;
        scene.add(g);
        pieces.push({ group: g, mesh: mesh, project: p });
      });
      layout();
    }

    /* the walker: a plain stand-in until there is a real character */
    var pawn = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.42, 1.05, 20),
      new THREE.MeshBasicMaterial({ color: INK })
    );
    body.position.y = 0.55;
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 20, 16),
      new THREE.MeshBasicMaterial({ color: PENCIL })
    );
    head.position.y = 1.32;
    pawn.add(body, head, shadow(1.6, 1.6));
    pawn.position.set(0, 0, 2);
    scene.add(pawn);

    /* drifting fog puffs */
    var puffs = [];
    for (var i = 0; i < 46; i++) {
      var sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.32, depthWrite: false })
      );
      var sc = 7 + Math.random() * 9;
      sp.scale.set(sc, sc * 0.6, 1);
      sp.position.set((Math.random() - 0.5) * 34, 0.8 + Math.random() * 3.5, 6 + Math.random() * (endZ - 16));
      sp.userData.v = (Math.random() - 0.5) * 0.35;
      scene.add(sp);
      puffs.push(sp);
    }

    function layout() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      portrait = w / h < 0.85;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = portrait ? 64 : 50;
      camera.updateProjectionMatrix();
      pieces.forEach(function (pc) {
        var u = pc.group.userData;
        pc.group.position.x = u.side * u.off * (portrait ? 0.5 : 1);
        pc.group.rotation.y = -u.side * (portrait ? 0.25 : 0.45);
        var k = portrait ? 0.62 : 1;
        pc.group.scale.set(k, k, k);
      });
    }
    window.addEventListener("resize", layout);

    /* input */
    var keys = {}, target = null, mouseX = 0;
    var KEYMAP = {
      ArrowUp: "f", w: "f", W: "f", ArrowDown: "b", s: "b", S: "b",
      ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r"
    };
    var near = null;
    window.addEventListener("keydown", function (e) {
      if (!active()) return;
      if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; target = null; e.preventDefault(); }
      if (e.key === "Enter" && near) { e.preventDefault(); opts.onOpen(near.project.slug); }
    });
    window.addEventListener("keyup", function (e) {
      if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false;
    });
    window.addEventListener("blur", function () { keys = {}; });

    var canvas = renderer.domElement;
    canvas.addEventListener("wheel", function (e) {
      var base = target ? target.z : pawn.position.z;
      target = { x: target ? target.x : pawn.position.x, z: clampZ(base + e.deltaY * 0.02) };
      e.preventDefault();
    }, { passive: false });

    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null;
    function setPtr(e) {
      var r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
    }
    function hitPiece() {
      var hits = ray.intersectObjects(pieces.map(function (p) { return p.mesh; }));
      return hits.length ? hits[0].object : null;
    }
    canvas.addEventListener("pointerdown", function (e) { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width) * 2 - 1;
      if (e.pointerType === "mouse") {
        setPtr(e);
        canvas.style.cursor = hitPiece() ? "pointer" : "default";
      }
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!downAt || Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 10) return;
      setPtr(e);
      var piece = hitPiece();
      if (piece) { opts.onOpen(piece.userData.slug); return; }
      var g = ray.intersectObject(ground);
      if (g.length) target = { x: clampX(g[0].point.x), z: clampZ(g[0].point.z) };
    });

    function clampX(x) { return Math.max(-9, Math.min(9, x)); }
    function clampZ(z) { return Math.max(endZ, Math.min(4, z)); }
    function active() { return !host.hidden && host.offsetParent !== null && !opts.isBlocked(); }

    /* loop */
    var clock = new THREE.Clock(), walkT = 0;
    var camPos = new THREE.Vector3(0, 3.4, 10), look = new THREE.Vector3();
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);
      if (!active()) return;

      var dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      var dz = (keys.b ? 1 : 0) - (keys.f ? 1 : 0);
      var speed = 7;
      if (!dx && !dz && target) {
        var tx = target.x - pawn.position.x, tz = target.z - pawn.position.z;
        var dist = Math.sqrt(tx * tx + tz * tz);
        if (dist < 0.08) target = null;
        else { dx = tx / dist; dz = tz / dist; if (dist < 1) { dx *= dist; dz *= dist; } speed = Math.max(7, Math.min(22, dist * 2)); }
      }
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len > 1) { dx /= len; dz /= len; len = 1; }
      pawn.position.x = clampX(pawn.position.x + dx * speed * dt);
      pawn.position.z = clampZ(pawn.position.z + dz * speed * dt);
      if (len > 0.05 && !reduce) walkT += dt * 11 * len;
      body.position.y = 0.55 + Math.abs(Math.sin(walkT)) * 0.09;
      head.position.y = 1.32 + Math.abs(Math.sin(walkT)) * 0.13;
      pawn.rotation.z = -dx * 0.12;

      var back = portrait ? 10.5 : 7.5, up = portrait ? 4.6 : 3.2;
      camPos.set(pawn.position.x * 0.75 + mouseX * 0.5, up, pawn.position.z + back);
      camera.position.lerp(camPos, reduce ? 1 : 1 - Math.pow(0.002, dt));
      look.set(camera.position.x * 0.9, portrait ? 3 : 1.9, camera.position.z - back - 5);
      camera.lookAt(look);

      if (!reduce) {
        puffs.forEach(function (s) {
          s.position.x += s.userData.v * dt;
          if (s.position.x > 18) s.position.x = -18;
          if (s.position.x < -18) s.position.x = 18;
        });
      }

      var best = null, bestD = 7;
      pieces.forEach(function (pc) {
        var d = Math.hypot(pc.group.position.x - pawn.position.x, pc.group.position.z - pawn.position.z);
        if (d < bestD) { bestD = d; best = pc; }
      });
      if (best !== near) { near = best; opts.onNear(near ? near.project : null); }
      opts.onMove(2 - pawn.position.z, pawn.position.z <= endZ + 3);

      renderer.render(scene, camera);
    }

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
      buildPieces();
      frame();
    });
    return true;
  }
};
