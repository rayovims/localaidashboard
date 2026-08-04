/* ============================================================================
   Fleet stage renderer — draws window.SCENE (set by configs/<scene>.js)
   onto the fixed 1920x1080 stage. Pure file:// friendly: no modules, no fetch.
   ============================================================================ */
(() => {
  "use strict";

  const S = window.SCENE;
  if (!S) {
    document.body.innerHTML =
      "<p style='color:#f66;font:16px monospace;padding:40px'>No scene config loaded — expected configs/&lt;scene&gt;.js to set window.SCENE</p>";
    return;
  }

  const SVGNS = "http://www.w3.org/2000/svg";
  const stage = document.getElementById("stage");
  const svg = document.getElementById("wires");
  const hero = S.machines.find(m => m.hero) || S.machines[0];
  const colorOf = id => (S.machines.find(m => m.id === id) || {}).color;

  /* ---------- theme vars from config ---------- */
  const root = document.documentElement.style;
  root.setProperty("--c-hero", hero.color);
  (S.backdropGlows || [hero.color]).forEach((c, i) => root.setProperty("--glow-" + "abc"[i], c));
  if (S.meta.pageTitle) document.title = S.meta.pageTitle;

  /* ---------- header ---------- */
  const header = document.createElement("header");
  header.innerHTML = `
    <div>
      <div class="kicker">${S.meta.kicker || ""}</div>
      <h1>${S.meta.title || ""}</h1>
    </div>
    <div class="head-right">
      ${S.meta.badge ? `<div class="series-badge">${S.meta.badge}</div>` : ""}
      ${S.meta.tagline ? `<div class="tagline">${S.meta.tagline}</div>` : ""}
    </div>`;
  stage.appendChild(header);

  /* ---------- machine cards ---------- */
  const cardEls = {};
  let cascade = 0; // non-hero cards enter one after the other
  for (const m of S.machines) {
    const el = document.createElement("div");
    el.className = "card" + (m.hero ? " hero" : "");
    el.id = "card-" + m.id;
    el.dataset.m = m.id;
    el.style.left = m.x + "px";
    el.style.top = m.y + "px";
    el.style.setProperty("--accent", m.color);
    el.style.setProperty("--intro-delay", m.hero ? ".45s" : (0.8 + 0.15 * cascade++).toFixed(2) + "s");

    const chips = (m.chips || []).map(c => `<span class="chip">${c}</span>`).join("");
    const foot = m.foot ? `<div class="card-foot"><span>${m.foot[0]}</span><span>${m.foot[1] || ""}</span></div>` : "";
    const stats = (m.stats || [])
      .map(s => `<div class="stat-chip"><b>${s.value}</b><span>${s.label}</span></div>`).join("");

    el.innerHTML = `
      ${m.key ? `<span class="key-badge">${m.key}</span>` : ""}
      ${m.hero && m.focusTag ? `<span class="focus-tag">${m.focusTag}</span>` : ""}
      <div class="card-top">
        <span class="dot"></span><span class="card-name">${m.name}</span>
        ${!m.hero && m.role ? `<span class="role-tag">${m.role}</span>` : ""}
      </div>
      ${m.hero && m.sub ? `<div class="hero-sub">${m.sub}</div>` : ""}
      ${m.hero && stats ? `<div class="stat-chips">${stats}</div>` : ""}
      ${!m.hero && m.spec ? `<div class="card-spec">${m.spec}</div>` : ""}
      ${chips ? `<div class="chips">${chips}</div>` : ""}
      ${foot}`;
    stage.appendChild(el);
    cardEls[m.id] = el;
  }

  /* ---------- wires ----------
     Auto-routed curves run from a card's inner edge to the hero's near edge,
     mirroring left/right and bowing toward the hero's vertical center. */
  const edges = el => ({
    left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth,
    cx: el.offsetLeft + el.offsetWidth / 2, cy: el.offsetTop + el.offsetHeight / 2,
  });

  function autoPath(fromEl, toEl) {
    const a = edges(fromEl), b = edges(toEl);
    const x1 = a.cx < b.cx ? a.right : a.left, y1 = a.cy;
    const x2 = a.cx < b.cx ? b.left : b.right;
    const y2 = b.cy + (y1 < b.cy ? -42 : 42);
    const dx = x2 - x1;
    const r = Math.round;
    return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx * 0.55)} ${r(y1)} ` +
           `${r(x1 + dx * 0.66)} ${r(y2 + (y1 > y2 ? 10 : -10))} ${r(x2)} ${r(y2)}`;
  }

  const links = [];
  for (const ln of S.links) {
    const to = "to" in ln ? ln.to : hero.id;
    const color = ln.color || colorOf(ln.from);
    const d = ln.path || autoPath(cardEls[ln.from], cardEls[to]);
    const pid = "wirepath-" + (ln.id || ln.from);

    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "link");

    const base = document.createElementNS(SVGNS, "path");
    base.setAttribute("class", "wire-base");
    base.setAttribute("d", d);

    const wire = document.createElementNS(SVGNS, "path");
    wire.setAttribute("class", "wire wire-glow");
    wire.setAttribute("id", pid);
    wire.setAttribute("pathLength", "1");
    wire.setAttribute("d", d);
    wire.setAttribute("stroke", color);
    wire.setAttribute("stroke-opacity", ln.opacity ?? 0.55);
    g.append(base, wire);

    for (const p of ln.packets || []) {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("class", "packet");
      c.setAttribute("r", p.r ?? 4);
      c.setAttribute("fill", color);
      c.setAttribute("filter", "url(#soft)");
      const am = document.createElementNS(SVGNS, "animateMotion");
      am.setAttribute("dur", p.dur + "s");
      am.setAttribute("begin", (p.begin ?? 0) + "s");
      am.setAttribute("repeatCount", "indefinite");
      const mp = document.createElementNS(SVGNS, "mpath");
      mp.setAttribute("href", "#" + pid);
      mp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + pid);
      am.appendChild(mp);
      c.appendChild(am);
      g.appendChild(c);
    }
    svg.appendChild(g);
    links.push({ el: g, to, lightsFor: ln.lightsFor || [ln.from] });
  }

  /* ---------- floating labels ---------- */
  const labels = (S.labels || []).map(lb => {
    const el = document.createElement("div");
    el.className = "wire-label";
    el.style.left = lb.x + "px";
    el.style.top = lb.y + "px";
    el.innerHTML = lb.html;
    stage.appendChild(el);
    return { el, litWhen: lb.litWhen || [] };
  });

  /* ---------- pulse ring tracks the hero card's real box ---------- */
  const ring = document.createElement("div");
  ring.id = "pulse-ring";
  const heroEl = cardEls[hero.id], PAD = 14;
  ring.style.left = (heroEl.offsetLeft - PAD) + "px";
  ring.style.top = (heroEl.offsetTop - PAD) + "px";
  ring.style.width = (heroEl.offsetWidth + PAD * 2) + "px";
  ring.style.height = (heroEl.offsetHeight + PAD * 2) + "px";
  stage.appendChild(ring);

  /* ---------- memory comparison panel ---------- */
  let memEl = null;
  if (S.memory) {
    memEl = document.createElement("div");
    memEl.id = "memory";
    memEl.innerHTML = `<h3>${S.memory.title}</h3>` + S.memory.bars.map((b, i) => `
      <div class="bar-row" data-m="${b.m}">
        <div class="bar-name">${b.name}<span>${b.sub || ""}</span></div>
        <div class="bar-track"><div class="bar-fill" style="--w:${(b.value / S.memory.max * 100).toFixed(2)}%; --d:${(1.5 + i * 0.15).toFixed(2)}s; background:${b.color || colorOf(b.m)}"></div></div>
        <div class="bar-val">${b.value}<span> ${b.unit || S.memory.unit || "GB"}</span></div>
      </div>`).join("");
    stage.appendChild(memEl);
  }

  /* ---------- key hints bar ---------- */
  const KEYMAP = {};
  for (const m of S.machines) if (m.key) KEYMAP[m.key] = m.id;
  const keys = Object.keys(KEYMAP).sort();
  const hints = document.createElement("div");
  hints.id = "hints";
  hints.innerHTML = S.hintsHtml ||
    `<kbd>${keys[0]}</kbd>–<kbd>${keys[keys.length - 1]}</kbd> spotlight a machine · <kbd>0</kbd>/<kbd>Esc</kbd> all · ` +
    `<kbd>R</kbd> replay intro · <kbd>F</kbd> fullscreen · <kbd>H</kbd> show/hide this bar`;
  stage.appendChild(hints);

  /* ---------- fit the 1920x1080 stage to the window ---------- */
  function fit() {
    if (!innerWidth || !innerHeight) return; // hidden/zero viewport — keep last scale
    stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1920, innerHeight / 1080)})`;
  }
  addEventListener("resize", fit); fit();

  /* ---------- spotlight ---------- */
  function setFocus(id) {
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("focused", c.dataset.m === id));
    if (!id) {
      delete document.body.dataset.focus;
      document.body.classList.remove("hero-focused");
      memEl && memEl.classList.remove("dim");
      return;
    }
    document.body.dataset.focus = id;
    document.body.classList.toggle("hero-focused", id === hero.id);
    // everything routes through the hero, so focusing it lights every hero-bound wire
    for (const l of links)
      l.el.classList.toggle("lit", id === hero.id ? l.to === hero.id : l.lightsFor.includes(id));
    for (const lb of labels) lb.el.classList.toggle("lit", lb.litWhen.includes(id));
    if (memEl) {
      const rows = [...memEl.querySelectorAll(".bar-row")];
      rows.forEach(r => r.classList.toggle("focused", r.dataset.m === id));
      memEl.classList.toggle("dim", rows.some(r => r.dataset.m === id));
    }
  }

  document.querySelectorAll(".card").forEach(c =>
    c.addEventListener("click", e => { e.stopPropagation(); setFocus(c.dataset.m); }));
  stage.addEventListener("click", () => setFocus(null));

  /* ---------- recording chrome: fades itself out for a clean frame ---------- */
  let chromeTimer = setTimeout(() => document.body.classList.add("hide-chrome"), 9000);

  addEventListener("keydown", e => {
    if (e.key in KEYMAP) setFocus(KEYMAP[e.key]);
    else if (e.key === "0" || e.key === "Escape") setFocus(null);
    else if (e.key === "h" || e.key === "H") {
      clearTimeout(chromeTimer);
      document.body.classList.toggle("hide-chrome");
    }
    else if (e.key === "f" || e.key === "F") {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    }
    else if (e.key === "r" || e.key === "R") {
      document.body.classList.remove("play");
      void document.body.offsetWidth;
      document.body.classList.add("play");
    }
  });

  /* ---------- URL params: ?still, ?focus=<id> (?scene= handled in index.html) ---------- */
  const params = new URLSearchParams(location.search);
  if (params.has("still")) { document.body.classList.add("still", "hide-chrome"); clearTimeout(chromeTimer); }
  if (Object.values(KEYMAP).includes(params.get("focus"))) setFocus(params.get("focus"));

  requestAnimationFrame(() => document.body.classList.add("play"));
  setTimeout(() => document.body.classList.add("play"), 400); // rAF doesn't fire while hidden
})();
