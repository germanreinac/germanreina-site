/*
  Two more home screens to try next to the walkable gallery. Same projects, same look.

    Homes.warehouse(opts)  a warehouse with long arms reaching out of it, one project on each
    Homes.island(opts)     a floating island with the artist drawing, the projects circling as loose pages

  opts: { host, projects, onOpen(slug), onHover(project or null, x, y), isBlocked() }
  Each returns null when WebGL is not available.
*/
window.Homes = (function () {
  var SPACE = 0x17151d, PENCIL = 0xffc52e;
  var SIZES = { wide: [6.4, 4], tall: [4.2, 5.6], square: [4.6, 4.6] };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function placeholder(THREE, p, w, h) {
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

  /* What both screens share: renderer, isometric camera, stars, picking, the frame loop. */
  function base(opts, cfg) {
    var THREE = window.THREE;
    if (!THREE) return null;
    var host = opts.host, renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(SPACE, 0);
    host.appendChild(renderer.domElement);
    var canvas = renderer.domElement;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 600);
    var CAM = new THREE.Vector3(80, 80, 80);
    camera.position.copy(CAM);
    camera.lookAt(0, 0, 0);
    scene.add(camera);
    var upV = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    var rightV = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    function starLayer(n, size, opacity) {
      var pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 150;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 170;
        pos[i * 3 + 2] = -450;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var pts = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xf5f5f1, size: size * renderer.getPixelRatio(), sizeAttenuation: false, transparent: true, opacity: opacity
      }));
      camera.add(pts);
      return pts;
    }
    starLayer(1100, 1.1, 0.6);
    var twinkle = starLayer(150, 1.6, 0.85);

    var api = {
      THREE: THREE, scene: scene, camera: camera, canvas: canvas, upV: upV, rightV: rightV,
      targets: [], aspect: 1, halfW: 10, halfH: 10,
      flat: function (c) { return new THREE.MeshBasicMaterial({ color: c }); },
      texture: function (p) {
        var s = SIZES[p.shape] || SIZES.wide;
        return p.images[0] ? new THREE.TextureLoader().load(p.images[0]) : placeholder(THREE, p, s[0], s[1]);
      },
      size: function (p) { return SIZES[p.shape] || SIZES.wide; }
    };

    var lastW = 0, lastH = 0, focus = new THREE.Vector3();
    function layout() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      lastW = w;
      lastH = h;
      api.aspect = w / h;
      renderer.setSize(w, h, false);
      api.halfW = cfg.fit(api.aspect);
      api.halfH = api.halfW / api.aspect;
      camera.left = -api.halfW; camera.right = api.halfW; camera.top = api.halfH; camera.bottom = -api.halfH;
      camera.updateProjectionMatrix();
      focus.copy(cfg.center);
      if (api.aspect > 1.2) focus.addScaledVector(rightV, -api.halfW * cfg.side); // room for the name on the left
      else if (api.aspect < 0.8) focus.addScaledVector(upV, api.halfH * cfg.drop); // room for the name on top
      camera.position.copy(focus).add(CAM);
    }

    /* picking */
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), downAt = null, last = null, dragged = false, hovered = null;
    function pick(e) {
      var r = canvas.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      var hits = ray.intersectObjects(api.targets);
      return hits.length ? hits[0].object : null;
    }
    function setHover(obj, e) {
      if (obj !== hovered) {
        hovered = obj;
        api.hovered = obj;
        canvas.style.cursor = obj ? "pointer" : (cfg.onDrag ? "grab" : "default");
      }
      opts.onHover(obj && obj.userData.project ? obj.userData.project : null, e.clientX, e.clientY);
    }
    canvas.addEventListener("pointerdown", function (e) {
      downAt = [e.clientX, e.clientY];
      last = [e.clientX, e.clientY];
      dragged = false;
    });
    canvas.addEventListener("pointermove", function (e) {
      if (downAt) {
        if (Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 8) dragged = true;
        if (dragged && cfg.onDrag) cfg.onDrag(e.clientX - last[0], e.clientY - last[1]);
        last = [e.clientX, e.clientY];
      }
      if (e.pointerType === "mouse" && !dragged) setHover(pick(e), e);
    });
    canvas.addEventListener("pointerleave", function (e) { setHover(null, e); });
    window.addEventListener("pointerup", function () { downAt = null; });
    canvas.addEventListener("pointerup", function (e) {
      if (!downAt || dragged) return;
      var obj = pick(e);
      if (!obj) return;
      if (obj.userData.project) opts.onOpen(obj.userData.project.slug);
      else if (obj.userData.action) obj.userData.action();
    });

    var clock = new THREE.Clock(), time = 0;
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);
      if (host.hidden || host.offsetParent === null || opts.isBlocked()) return;
      if (host.clientWidth !== lastW || host.clientHeight !== lastH) layout();
      time += dt;
      twinkle.material.opacity = 0.7 + Math.sin(time * 1.3) * 0.2;
      cfg.update(dt, time);
      renderer.render(scene, camera);
    }
    api.start = function () {
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
        cfg.build();
        layout();
        frame();
      });
    };
    return api;
  }

  /* ------------------------------------------------------------------ warehouse */
  function warehouse(opts) {
    var arms = [];
    // Where each arm leaves the building: which face, where along it, how high, how long.
    // "x" arms run down-right on screen, "z" arms down-left, "roof" cranes go up and back.
    var SPECS = [
      { face: "x", along: -3.6, h: 7.4, len: 22 }, { face: "z", along: -3.4, h: 7.0, len: 24 },
      { face: "x", along: -1.0, h: 2.8, len: 8 }, { face: "z", along: -0.8, h: 3.0, len: 9.5 },
      { face: "roof", px: -3.2, pz: -3, mast: 6.5, dir: "x", len: 13 },
      { face: "x", along: 1.6, h: 5.4, len: 16 }, { face: "z", along: 1.8, h: 5.2, len: 17.5 },
      { face: "roof", px: 2.6, pz: -3.6, mast: 10, dir: "z", len: 15 },
      { face: "x", along: 4.2, h: 2.4, len: 12.5 }, { face: "z", along: 4.2, h: 2.2, len: 13.5 }
    ];
    var W = 6, H = 9; // half width and height of the building
    if (!window.THREE) return null;
    var k = base(opts, {
      center: new window.THREE.Vector3(8, 5.5, 8), side: 0.2, drop: 0.16,
      fit: function (aspect) { return Math.max(28, 25 * aspect); },
      build: build, update: update
    });
    if (!k) return null;
    var THREE = k.THREE;

    function stripes(light, dark) {
      var c = document.createElement("canvas");
      c.width = 64;
      c.height = 8;
      var g = c.getContext("2d");
      g.fillStyle = light;
      g.fillRect(0, 0, 64, 8);
      g.fillStyle = dark;
      g.fillRect(0, 0, 6, 8);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(14, 1);
      return t;
    }
    function box(x0, x1, y0, y1, z0, z1, mats) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mats);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      k.scene.add(m);
      return m;
    }

    function build() {
      var faceX = new THREE.MeshBasicMaterial({ map: stripes("#e9ebe6", "#dadcd6") });
      var faceZ = new THREE.MeshBasicMaterial({ map: stripes("#d3d8d4", "#c3c9c5") });
      var roof = k.flat(0xf5f5f1), dark = k.flat(0x2b2631), slabX = k.flat(0x9aa4a3), slabZ = k.flat(0x818c8c), floor = k.flat(0xd6dbd9);
      box(-11, 11, -1.3, 0, -11, 11, [slabX, slabX, floor, slabZ, slabZ, slabZ]);       // the yard it stands on
      box(-W, W, 0, H, -W, W, [faceX, faceX, roof, roof, faceZ, faceZ]);                // the building
      box(-W - 0.3, W + 0.3, H, H + 0.35, -W - 0.3, W + 0.3, [roof, roof, roof, roof, k.flat(0xe3e5e0), roof]); // roof lip
      box(-1.5, 1.5, H + 0.35, H + 1.5, 1.5, 4, [k.flat(0xe9ebe6), roof, roof, roof, k.flat(0xd3d8d4), roof]);  // roof hut
      box(W - 4.4, W - 1.2, 0, 3.6, W, W + 0.06, [dark, dark, dark, dark, dark, dark]); // loading door
      box(W - 4.6, W - 1.0, 3.6, 3.9, W, W + 0.1, [k.flat(PENCIL), k.flat(PENCIL), k.flat(PENCIL), k.flat(PENCIL), k.flat(PENCIL), k.flat(PENCIL)]);

      var armX = k.flat(0xf5f5f1), armZ = k.flat(0xdfe2dd), armTop = k.flat(0xffffff), tipMat = k.flat(PENCIL), cable = k.flat(0x8d8a96);
      var armMats = [armX, armX, armTop, armZ, armZ, armZ];
      opts.projects.forEach(function (p, i) {
        var s = SPECS[i % SPECS.length], extra = Math.floor(i / SPECS.length) * 5;
        var a = { spec: s, len: s.len + extra, ext: 0, phase: i * 1.7, project: p };
        var dirX = s.face === "x" || (s.face === "roof" && s.dir === "x");
        a.dir = dirX ? new THREE.Vector3(s.face === "roof" ? -1 : 1, 0, 0) : new THREE.Vector3(0, 0, s.face === "roof" ? -1 : 1);
        if (s.face === "roof") {
          a.root = new THREE.Vector3(s.px, H + s.mast, s.pz);
          box(s.px - 0.35, s.px + 0.35, H, H + s.mast + 0.3, s.pz - 0.35, s.pz + 0.35, armMats); // mast
        } else {
          a.root = s.face === "x" ? new THREE.Vector3(W, s.h, s.along) : new THREE.Vector3(s.along, s.h, W);
          // the opening it comes out of
          if (s.face === "x") box(W, W + 0.05, s.h - 0.7, s.h + 0.7, s.along - 0.8, s.along + 0.8, [dark, dark, dark, dark, dark, dark]);
          else box(s.along - 0.8, s.along + 0.8, s.h - 0.7, s.h + 0.7, W, W + 0.05, [dark, dark, dark, dark, dark, dark]);
        }
        a.boom = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.5), armMats);
        if (!dirX) a.boom.rotation.y = Math.PI / 2;
        a.tip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), tipMat);
        a.cable = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), cable);
        var size = k.size(p), w = size[0] * 0.8, h = size[1] * 0.8;
        a.h = h;
        a.panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: k.texture(p), side: THREE.DoubleSide }));
        a.panel.quaternion.copy(k.camera.quaternion);
        a.panel.userData.project = p;
        a.panel.userData.arm = a;
        k.scene.add(a.boom, a.tip, a.cable, a.panel);
        k.targets.push(a.panel);
        arms.push(a);
      });
    }

    var tipPos = null;
    function update(dt, time) {
      if (!tipPos) tipPos = new THREE.Vector3();
      var over = k.hovered && k.hovered.userData.arm;
      arms.forEach(function (a) {
        var want = a === over ? 1 : 0;
        a.ext += (want - a.ext) * (reduce ? 1 : 1 - Math.pow(0.002, dt));
        var breathe = reduce ? 0 : Math.sin(time * 0.55 + a.phase) * 0.7;
        var len = a.len + breathe * (1 - a.ext); // holds still while you point at it
        a.boom.scale.x = len;
        a.boom.position.copy(a.root).addScaledVector(a.dir, len / 2);
        tipPos.copy(a.root).addScaledVector(a.dir, len);
        a.tip.position.copy(tipPos);
        var drop = 1.1 + (reduce ? 0 : Math.sin(time * 0.9 + a.phase) * 0.12);
        a.cable.scale.y = drop;
        a.cable.position.set(tipPos.x, tipPos.y - 0.45 - drop / 2, tipPos.z);
        var s = 1 + a.ext * 0.22;
        a.panel.scale.set(s, s, 1);
        a.panel.position.set(tipPos.x, tipPos.y - 0.45 - drop - (a.h * s) / 2, tipPos.z);
      });
    }

    k.start();
    return k;
  }

  /* ------------------------------------------------------------------ island */
  function island(opts) {
    var pages = [], spin = 0, vel = 0.12, burst = 0, pencil, paperCtx, paperTex, artist, lastScribble = null, sheetAge = 0;
    if (!window.THREE) return null;
    var k = base(opts, {
      center: new window.THREE.Vector3(0, 3.2, 0), side: 0.22, drop: 0.2,
      fit: function (aspect) { return Math.max(18.5, 16.5 * aspect); },
      build: build, update: update,
      onDrag: function (dx) { vel += dx * 0.004; }
    });
    if (!k) return null;
    var THREE = k.THREE;

    function build() {
      k.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
      var sun = new THREE.DirectionalLight(0xffffff, 0.42);
      sun.position.set(30, 60, 10);
      k.scene.add(sun);
      function rock(c) { return new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 0 }); }

      var top = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 6.6, 1, 9), rock(0xd6dbd9));
      top.position.y = -0.5;
      var under = new THREE.Mesh(new THREE.ConeGeometry(6.6, 10, 9), rock(0xa9b1af));
      under.rotation.x = Math.PI;
      under.position.y = -6;
      k.scene.add(top, under);
      [[9.5, -3, 3, 1.1], [-8.5, -6, -5, 0.8], [5, -9, -8, 0.6]].forEach(function (r) {
        var m = new THREE.Mesh(new THREE.DodecahedronGeometry(r[3], 0), rock(0xbfc6c3));
        m.position.set(r[0], r[1], r[2]);
        k.scene.add(m);
      });

      // the desk, facing the viewer
      var wood = rock(0xf5f5f1), leg = rock(0xcfd4d0);
      var desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 2.2), wood);
      desk.position.set(0.6, 1.25, 0.6);
      k.scene.add(desk);
      [[-0.9, -0.3], [2.1, -0.3], [-0.9, 1.5], [2.1, 1.5]].forEach(function (p) {
        var l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), leg);
        l.position.set(p[0], 0.6, p[1]);
        k.scene.add(l);
      });
      // the sheet being drawn on: a canvas the pencil really scribbles on
      var c = document.createElement("canvas");
      c.width = c.height = 256;
      paperCtx = c.getContext("2d");
      paperTex = new THREE.CanvasTexture(c);
      clearSheet();
      var sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ map: paperTex }));
      sheet.rotation.x = -Math.PI / 2;
      sheet.position.set(0.6, 1.35, 0.6);
      k.scene.add(sheet);

      // the artist: a plain stand-in for Ra until the real character is in
      artist = new THREE.Group();
      var bodyM = rock(0xc2577f);
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.85, 2.1, 20), bodyM);
      body.position.y = 1.05;
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.66, 24, 18), bodyM);
      head.position.y = 2.55;
      artist.add(body, head);
      artist.position.set(0.3, 0, -1.3);
      k.scene.add(artist);
      [body, head].forEach(function (m) {
        m.userData.action = function () { burst = 1; vel += 1.4; };
        k.targets.push(m);
      });

      pencil = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.4, 6), new THREE.MeshBasicMaterial({ color: PENCIL }));
      shaft.position.y = 1.45;
      var point = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 6), new THREE.MeshBasicMaterial({ color: 0x2b2631 }));
      point.rotation.x = Math.PI;
      point.position.y = 0.15;
      pencil.add(shaft, point);
      pencil.rotation.set(-0.5, 0, 0.35);
      k.scene.add(pencil);

      // every project is a loose page circling the island
      opts.projects.forEach(function (p, i) {
        var size = k.size(p), w = size[0] * 0.74, h = size[1] * 0.74;
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: k.texture(p), side: THREE.DoubleSide }));
        m.userData.project = p;
        k.scene.add(m);
        k.targets.push(m);
        pages.push({ mesh: m, angle: (i / opts.projects.length) * Math.PI * 2, radius: 11.5 + (i % 3) * 2.3, height: 0.5 + ((i * 37) % 7) * 1.35, phase: i * 2.1, grow: 0 });
      });
    }

    function clearSheet() {
      paperCtx.fillStyle = "#ffffff";
      paperCtx.fillRect(0, 0, 256, 256);
      paperTex.needsUpdate = true;
      lastScribble = null;
      sheetAge = 0;
    }

    var tilt = null;
    function update(dt, time) {
      if (!tilt) tilt = new THREE.Quaternion();
      var over = k.hovered && k.hovered.userData.project ? k.hovered : null;
      var cruise = over ? 0 : 0.12;
      vel += (cruise - vel) * (1 - Math.pow(0.25, dt));
      if (!reduce || Math.abs(vel) > 0.2) spin += vel * dt;
      burst *= Math.pow(0.12, dt);

      pages.forEach(function (pg) {
        var a = pg.angle + spin;
        var r = pg.radius * (1 + burst * 0.45);
        var bob = reduce ? 0 : Math.sin(time * 0.8 + pg.phase) * 0.35;
        pg.mesh.position.set(Math.cos(a) * r, pg.height + bob, Math.sin(a) * r);
        pg.grow += ((pg.mesh === over ? 1 : 0) - pg.grow) * (1 - Math.pow(0.002, dt));
        var s = 1 + pg.grow * 0.28;
        pg.mesh.scale.set(s, s, 1);
        // faces you, with a slight flutter
        pg.mesh.quaternion.copy(k.camera.quaternion);
        if (!reduce) {
          tilt.setFromAxisAngle(k.upV, Math.sin(time * 0.9 + pg.phase) * 0.22 * (1 - pg.grow));
          pg.mesh.quaternion.premultiply(tilt);
        }
      });

      // the pencil scribbles on the sheet; a full sheet is swapped for a clean one
      var u = 0.5 + Math.sin(time * 2.3) * 0.3 + Math.sin(time * 5.1) * 0.08;
      var v = 0.5 + Math.sin(time * 1.7 + 1) * 0.28 + Math.cos(time * 4.3) * 0.08;
      if (reduce) { u = 0.5; v = 0.5; }
      pencil.position.set(0.6 + (u - 0.5) * 1.9, 1.36, 0.6 + (v - 0.5) * 1.5);
      if (!reduce) {
        if (lastScribble) {
          paperCtx.strokeStyle = "#1f1a24";
          paperCtx.lineWidth = 3;
          paperCtx.lineCap = "round";
          paperCtx.beginPath();
          paperCtx.moveTo(lastScribble[0], lastScribble[1]);
          paperCtx.lineTo(u * 256, v * 256);
          paperCtx.stroke();
          paperTex.needsUpdate = true;
        }
        lastScribble = [u * 256, v * 256];
        sheetAge += dt;
        if (sheetAge > 9) clearSheet();
        artist.rotation.z = Math.sin(time * 2.3) * 0.04;
      }
    }

    k.start();
    return k;
  }

  return { warehouse: warehouse, island: island };
})();
