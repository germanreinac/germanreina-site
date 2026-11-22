/* The provisional site: home, work and about. Content comes from js/projects.js. */
(function () {
  var site = window.SITE, projects = window.PROJECTS;
  var bySlug = {};
  projects.forEach(function (p) { bySlug[p.slug] = p; });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function link(label, url, cls) {
    var a = el("a", cls, label);
    a.href = url;
    if (url.charAt(0) !== "#" && url.indexOf("mailto:") !== 0) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    return a;
  }
  function byId(id) { return document.getElementById(id); }

  /* ---------- home ---------- */
  byId("home-name").textContent = site.name;
  byId("home-intro").textContent = site.intro;
  byId("home-motto").textContent = site.motto;
  site.doors.forEach(function (d) {
    var out = d.url.charAt(0) !== "#";
    var a = link("", d.url, "door");
    a.appendChild(el("span", "door__title", d.title + (out ? " ↗" : " →")));
    a.appendChild(el("span", "door__sub", d.sub));
    byId("doors").appendChild(a);
  });

  // The figure leans a little towards the pointer.
  var stage = byId("stage"), video = byId("ra");
  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      stage.style.transform = "translate3d(" + (-x * 26).toFixed(1) + "px," + (-y * 18).toFixed(1) + "px,0) rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg)";
    });
  } else {
    video.removeAttribute("autoplay");
    video.pause();
  }

  /* ---------- work ---------- */
  var table = byId("table");
  function buildTable(filter) {
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
  table.addEventListener("click", function (e) {
    var r = e.target.closest(".row");
    if (r) openSheet(r.dataset.slug);
  });
  var chips = document.querySelectorAll(".chip");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
      buildTable(c.dataset.filter);
    });
  });
  var note = byId("work-note");
  note.appendChild(document.createTextNode("Images of the work are on "));
  note.appendChild(link(site.portfolio.label + " ↗", site.portfolio.url));
  note.appendChild(document.createTextNode(" for now."));

  /* ---------- project sheet ---------- */
  var sheet = byId("sheet"), sheetBody = byId("sheet-body");
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
    var links = el("p", "sheet__links");
    if (p.link) links.appendChild(link(p.link.label + " ↗", p.link.url));
    if (!p.images.length) links.appendChild(link("See the art on " + site.portfolio.label + " ↗", site.portfolio.url));
    sheetBody.appendChild(links);
    if (p.images.length) {
      var imgs = el("div", "sheet__images");
      p.images.forEach(function (src) {
        var img = el("img");
        img.src = src;
        img.alt = p.title;
        img.loading = "lazy";
        imgs.appendChild(img);
      });
      sheetBody.appendChild(imgs);
    }
    sheet.scrollTop = 0;
    if (!sheet.open) sheet.showModal();
  }
  byId("sheet-close").addEventListener("click", function () { sheet.close(); });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- about ---------- */
  var about = site.about;
  byId("about-lead").textContent = about.lead;
  byId("about-text").textContent = about.text;
  var mail = byId("about-mail");
  mail.textContent = site.email;
  mail.href = "mailto:" + site.email;
  site.links.forEach(function (l) { byId("about-links").appendChild(link(l.label + " ↗", l.url)); });
  var fig = byId("about-photo"), img = el("img");
  img.src = about.photo.src;
  img.alt = about.photo.alt;
  img.loading = "lazy";
  fig.appendChild(img);
  fig.appendChild(el("figcaption", null, about.photo.credit));
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
    var a = link("", t.url, "xrow xrow--link");
    var b = el("span", "xrow__body");
    b.appendChild(el("strong", null, t.title + " ↗"));
    b.appendChild(el("span", null, t.sub));
    a.appendChild(b);
    byId("talks").appendChild(a);
  });

  document.querySelectorAll("[data-foot]").forEach(function (f) {
    f.appendChild(el("span", null, "© " + new Date().getFullYear() + " " + site.name));
    f.appendChild(el("span", null, site.motto));
  });

  /* ---------- which view ---------- */
  var VIEWS = ["home", "work", "about"];
  function show() {
    var name = location.hash.slice(1);
    if (VIEWS.indexOf(name) < 0) name = "home";
    VIEWS.forEach(function (v) { byId("view-" + v).hidden = v !== name; });
    document.body.dataset.view = name;
    document.querySelectorAll(".bar__nav a[data-view]").forEach(function (a) {
      if (a.dataset.view === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (name === "home" && !reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    else video.pause();
    var page = byId("view-" + name);
    if (page.scrollTo) page.scrollTo(0, 0);
  }
  buildTable("all");
  show();
  window.addEventListener("hashchange", show);
})();
