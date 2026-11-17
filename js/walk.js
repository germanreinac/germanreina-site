/*
  The walkable gallery, isometric. A small figure walks through fog between standing pieces.
  Click (tap) the floor to walk. Click a piece: if you are close it opens, if not the
  figure walks over to it first and it opens on arrival.
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

    var FLOOR = 0xd3d9d7, INK = 0x1f1a24, PENCIL = 0xffc52e;
    var SIZES = { wide: [6.4, 4], tall: [4.2, 5.6], square: [4.6, 4.6] };
    // Where each piece stands, as (across the screen, into the screen). Edit freely.
    var SPOTS = [[6, 7], [-7, 10], [3, 17], [-10, 21], [10, 25], [-2, 29], [-12, 34], [7, 37], [-5, 43], [4, 49]];
    var OPEN_RANGE = 4.5;   // how close the figure must be for a click to open a piece
    var CLEAR = 9, FADE = 13; // pieces are clear within CLEAR, gone into fog by CLEAR + FADE
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var R = Math.SQRT1_2;

    // screen-ish coordinates (across, into) to world x/z for a camera looking from +x +z
    function world(u, v) { return { x: (u - v) * R, z: (-u - v) * R }; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(FLOOR);
    host.appendChild(renderer.domElement);
    var canvas = renderer.domElement;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);

    /* floor with a faint tile grid, so movement reads */
    var floor = (function () {
      var c = document.createElement("canvas");
      c.width = c.height = 128;
      var g = c.getContext("2d");
      g.fillStyle = "#d3d9d7";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(31,26,36,0.07)";
      g.lineWidth = 2;
      g.strokeRect(0, 0, 128, 128);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(100, 100);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      var f = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ map: t }));
      f.rotation.x = -Math.PI / 2;
      scene.add(f);
      return f;
    })();

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
    function buildPieces() {
      var loader = new THREE.TextureLoader();
      projects.forEach(function (p, i) {
        var s = SIZES[p.shape] || SIZES.wide;
        var spot = SPOTS[i] || [((i % 2) * 2 - 1) * 7, 7 + i * 6];
        var face = new THREE.MeshBasicMaterial({
          map: p.images[0] ? loader.load(p.images[0]) : placeholder(p, s[0], s[1]),
          transparent: true
        });
        var edge = new THREE.MeshBasicMaterial({ color: 0xf5f5f1, transparent: true });
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], 0.2), [edge, edge, edge, edge, face, edge]);
        mesh.position.y = s[1] / 2 + 0.6;
        mesh.userData.index = i;
        var sh = shadow(s[0] * 1.3, 2.4);
        var g = new THREE.Group();
        g.add(mesh, sh);
        var w = world(spot[0], spot[1]);
        g.position.set(w.x, 0, w.z);
        // pieces on the right of the screen face left, and the other way round
        var facesX = spot[0] < 0;
        g.rotation.y = facesX ? Math.PI / 2 : 0;
        scene.add(g);
        pieces.push({
          group: g, mesh: mesh, project: p, mats: [face, edge, sh.material],
          // the spot in front of the piece where the figure stands to look at it
          stand: { x: w.x + (facesX ? 2.6 : 0), z: w.z + (facesX ? 0 : 2.6) }
        });
      });
    }

    /* the walker: a plain stand-in until there is a real character */
    var pawn = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 1.05, 20), new THREE.MeshBasicMaterial({ color: INK }));
    body.position.y = 0.55;
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), new THREE.MeshBasicMaterial({ color: PENCIL }));
    head.position.y = 1.32;
    pawn.add(body, head, shadow(1.6, 1.6));
    scene.add(pawn);

    /* marker where you clicked */
    var marker = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.03;
    scene.add(marker);

    /* drifting fog puffs */
    var puffs = [];
    for (var i = 0; i < 40; i++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.4, depthWrite: false }));
      var sc = 7 + Math.random() * 9;
      sp.scale.set(sc, sc * 0.6, 1);
      var pw = world((Math.random() - 0.5) * 44, -8 + Math.random() * 68);
      sp.position.set(pw.x, 1 + Math.random() * 3, pw.z);
      sp.userData.v = (Math.random() - 0.5) * 0.4;
      scene.add(sp);
      puffs.push(sp);
    }

    function layout() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      var aspect = w / h;
      var halfW = Math.max(11.5 * aspect, 9.5), halfH = halfW / aspect;
      renderer.setSize(w, h, false);
      camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", layout);
    layout();

    /* input: click only */
    var target = null, pending = null, near = null;
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null;
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
      target = { x: pt.x, z: pt.z };
      marker.position.x = pt.x;
      marker.position.z = pt.z;
      marker.material.opacity = 0.7;
    }
    function visit(pc) {
      if (distTo(pc.stand) <= OPEN_RANGE) { pending = null; opts.onOpen(pc.project.slug); }
      else { pending = pc; walkTo(pc.stand); }
    }

    canvas.addEventListener("pointerdown", function (e) { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      setPtr(e);
      canvas.style.cursor = hitPiece() ? "pointer" : "default";
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!downAt || Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 10) return;
      setPtr(e);
      var pc = hitPiece();
      if (pc) { visit(pc); return; }
      var g = ray.intersectObject(floor);
      if (g.length) { pending = null; walkTo(g[0].point); }
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && near && active() && document.activeElement === document.body) {
        e.preventDefault();
        visit(near);
      }
    });

    function active() { return !host.hidden && host.offsetParent !== null && !opts.isBlocked(); }

    /* loop */
    var clock = new THREE.Clock(), walkT = 0;
    var CAM = new THREE.Vector3(30, 30, 30), focus = new THREE.Vector3();
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);
      if (!active()) return;

      var moving = 0;
      if (target) {
        var tx = target.x - pawn.position.x, tz = target.z - pawn.position.z;
        var dist = Math.sqrt(tx * tx + tz * tz);
        var step = 8 * dt;
        if (dist <= step) {
          pawn.position.x = target.x;
          pawn.position.z = target.z;
          target = null;
          if (pending) { var pc = pending; pending = null; opts.onOpen(pc.project.slug); }
        } else {
          pawn.position.x += (tx / dist) * step;
          pawn.position.z += (tz / dist) * step;
          moving = 1;
        }
      }
      if (moving && !reduce) walkT += dt * 12;
      body.position.y = 0.55 + Math.abs(Math.sin(walkT)) * 0.09;
      head.position.y = 1.32 + Math.abs(Math.sin(walkT)) * 0.13;
      marker.material.opacity = target ? Math.max(0.25, marker.material.opacity - dt * 0.6) : Math.max(0, marker.material.opacity - dt * 2);

      focus.lerp(pawn.position, reduce ? 1 : 1 - Math.pow(0.004, dt));
      camera.position.copy(focus).add(CAM);
      camera.lookAt(focus.x, 1.2, focus.z);

      if (!reduce) {
        puffs.forEach(function (s) {
          s.position.x += s.userData.v * dt;
          s.position.z -= s.userData.v * dt;
        });
      }

      // fog: pieces fade with distance from the figure
      var best = null, bestD = OPEN_RANGE;
      pieces.forEach(function (pc) {
        var d = distTo(pc.group.position);
        var o = Math.max(0.05, Math.min(1, 1 - (d - CLEAR) / FADE));
        pc.mats[0].opacity = o;
        pc.mats[1].opacity = o;
        pc.mats[2].opacity = o;
        var ds = distTo(pc.stand);
        if (ds < bestD) { bestD = ds; best = pc; }
      });
      if (best !== near) { near = best; opts.onNear(near ? near.project : null); }
      opts.onMove(Math.hypot(pawn.position.x, pawn.position.z), false);

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
