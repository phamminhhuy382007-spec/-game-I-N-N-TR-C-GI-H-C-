/* ĐẠI NẠN TRƯỚC GIỜ HỌC: game engine.
   One Phaser scene draws the world; all text UI is DOM over it.
   ONE loop (the scene's update) owns every timer, so no two countdowns can ever run at once. */
(function () {
  "use strict";
  const D = window.GAME_DATA, GEO = window.GEOMETRY;
  const mb = window.mindblown;
  const $ = (id) => document.getElementById(id);
  const WORLD_W = 1536, WORLD_H = 1024;
  const IS_TOUCH = ("ontouchstart" in window) || matchMedia("(pointer: coarse)").matches;
  if (IS_TOUCH) document.body.classList.add("touch");

  // ------------------------------------------------------------------ tune
  const TUNE_DEFAULT = { speed: 190, time_map1: 90, time_map2: 85, time_map3: 80, time_map4: 75, time_map5: 70,
    time_final: 45, final_rate: 3.6, warn_seconds: 15, music_volume: 0.3 };
  let TUNE = Object.assign({}, TUNE_DEFAULT);
  const fromFile = () => fetch("tune.json").then((r) => r.json())
    .then((f) => Object.fromEntries(Object.entries(f).map(([k, e]) => [k, e.value]))).catch(() => ({}));
  const tuneReady = (mb && mb.tune ? mb.tune() : fromFile()).then((v) => { TUNE = Object.assign({}, TUNE_DEFAULT, v || {}); });
  try { mb && mb.tune && mb.tune.on && mb.tune.on((v) => { TUNE = Object.assign({}, TUNE_DEFAULT, v || {}); applyVolume(); }); } catch (e) {}

  try {
    mb?.measure?.([
      { name: "map_cleared", kind: "count", label: "Bản đồ đã qua" },
      { name: "stage_failed", kind: "count", label: "Lần hết giờ" },
      { name: "final_reached", kind: "step", label: "Tới thử thách cuối" },
      { name: "finished", kind: "step", label: "Xem hết phần kết" },
    ]);
  } catch (e) {}
  const ev = (n, p) => { try { mb?.event?.(n, p); } catch (e) {} };

  // ------------------------------------------------------------------ sound
  let soundOn = mb && mb.sound ? !!mb.sound.on : true;
  const SFX = {};
  ["stamp", "page", "knock", "buzz", "door", "bell", "slip", "bark", "tick", "pen", "fail", "ok", "puff", "click", "scribble", "alarm"]
    .forEach((n) => { const a = new Audio(`snd/sfx_${n}.mp3`); a.preload = "auto"; SFX[n] = a; });
  const bgm = new Audio("snd/bgm.mp3"); bgm.loop = true; bgm.preload = "auto";
  function applyVolume() { bgm.volume = Math.max(0, Math.min(1, TUNE.music_volume)); }
  function play(n, vol) {
    if (!soundOn) return; const a = SFX[n]; if (!a) return;
    try { const c = a.cloneNode(); c.volume = vol == null ? 0.7 : vol; c.play().catch(() => {}); } catch (e) {}
  }
  function music(on) {
    applyVolume();
    if (on && soundOn) bgm.play().catch(() => {}); else bgm.pause();
  }
  function setSound(on) {
    soundOn = on; $("btn-sound").classList.toggle("off", !on);
    if (!on) bgm.pause(); else if (G.screen === "play" || G.screen === "final") music(true);
  }
  try { mb?.sound?.onchange?.((on) => setSound(!!on)); } catch (e) {}

  // ------------------------------------------------------------------ state
  const G = {
    screen: "menu",      // menu | tutorial | play | final | ending | results | fail
    paused: false, modal: false, busy: false,
    stageIndex: 0,       // 0..4 maps, 5 final
    stage: null, run: null, scene: null, loaded: false,
  };
  window.__game = G;

  function newRun() {
    G.run = { failures: 0, used: 0, minRemaining: Infinity, completed: 0, finalDone: false, startedAt: Date.now() };
  }
  const limitFor = (i) => i < 5 ? +TUNE["time_map" + (i + 1)] : +TUNE.time_final;

  // ------------------------------------------------------------------ input
  const keys = {};
  let interactArmed = true, eDown = false;
  const moveKeys = { KeyW: "u", ArrowUp: "u", KeyS: "d", ArrowDown: "d", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };
  const stick = { x: 0, y: 0, id: null };
  let holdKey = false, holdTouch = false;

  window.addEventListener("keydown", (e) => {
    const c = e.code;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(c)) e.preventDefault();
    if (c === "KeyE" || c === "Space") eDown = true;
    if (c === "Escape") { if (!e.repeat) togglePause(); return; }
    if (G.paused) return;
    if (!dialog.open && moveKeys[c]) keys[moveKeys[c]] = true;
    if (dialog.open) { dialog.key(e); return; }
    if (c === "KeyE" || c === "Space") {
      if (G.screen === "final") { holdKey = true; return; }
      if (e.repeat || !interactArmed) return;
      interactArmed = false;
      if (G.screen === "play") tryInteract();
      return;
    }
    if (c === "Enter" && !e.repeat) {
      if (G.screen === "menu") $("btn-start").click();
      else if (G.screen === "tutorial") $("btn-tut-go").click();
    }
  });
  window.addEventListener("keyup", (e) => {
    const c = e.code;
    if (moveKeys[c]) keys[moveKeys[c]] = false;
    if (c === "KeyE" || c === "Space") { interactArmed = true; holdKey = false; eDown = false; }
  });
  window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; holdKey = false; holdTouch = false; });

  // joystick
  (function () {
    const el = $("stick"), knob = $("stick-knob");
    const R = 50;
    function upd(e) {
      const r = el.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const L = Math.hypot(dx, dy); if (L > R) { dx *= R / L; dy *= R / L; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      stick.x = Math.abs(dx) > 8 ? dx / R : 0; stick.y = Math.abs(dy) > 8 ? dy / R : 0;
    }
    el.addEventListener("pointerdown", (e) => { stick.id = e.pointerId; el.setPointerCapture(e.pointerId); upd(e); });
    el.addEventListener("pointermove", (e) => { if (e.pointerId === stick.id) upd(e); });
    const end = (e) => { if (e.pointerId !== stick.id) return; stick.id = null; stick.x = stick.y = 0; knob.style.transform = ""; };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    $("btn-act").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (dialog.open) { dialog.confirm(); return; }
      if (G.screen === "play" && !G.paused) tryInteract();
    });
  })();

  // ------------------------------------------------------------------ world-anchored DOM
  const WUI = $("world-ui");
  const anchors = new Set();
  function anchor(html, wx, wy, cls, life, clamp) {
    const el = document.createElement("div"); el.className = "wl";
    const inner = document.createElement("div"); inner.className = "in " + (cls || ""); inner.innerHTML = html;
    el.appendChild(inner); WUI.appendChild(el);
    const a = { el, inner, wx, wy, dead: false, clamp };
    anchors.add(a);
    if (life) setTimeout(() => killAnchor(a), life);
    return a;
  }
  function killAnchor(a) { if (!a || a.dead) return; a.dead = true; a.el.remove(); anchors.delete(a); }
  function clearAnchors() { anchors.forEach((a) => a.el.remove()); anchors.clear(); ring.style.display = "none"; }
  const ring = document.createElement("div"); ring.className = "ring"; ring.style.display = "none"; WUI.appendChild(ring);
  function project(wx, wy) {
    const cam = G.scene && G.scene.cameras.main; if (!cam) return [0, 0];
    const z = cam.zoom / DPR;
    return [(wx - cam.worldView.x) * z, (wy - cam.worldView.y) * z];
  }
  function layoutAnchors() {
    anchors.forEach((a) => {
      let [x, y] = project(a.wx, a.wy);
      if (a.clamp) {
        const w = a.inner.offsetWidth, h = a.inner.offsetHeight;
        x = Math.max(w / 2 + 8, Math.min(innerWidth - w / 2 - 8, x));
        y = Math.max(h + 70, Math.min(innerHeight - 8, y));
      }
      a.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ------------------------------------------------------------------ HUD
  function fmt(t) { t = Math.max(0, Math.ceil(t)); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }
  let lastWhole = -1;
  function updateClock() {
    const st = G.stage; if (!st) return;
    $("clock-digits").textContent = fmt(st.timeLeft);
    const c = $("clock");
    const warn = st.timeLeft <= TUNE.warn_seconds, panic = st.timeLeft <= 5;
    c.classList.toggle("warn", warn && !panic); c.classList.toggle("panic", panic);
    const w = Math.ceil(st.timeLeft);
    if (warn && w !== lastWhole && st.running) { lastWhole = w; play("tick", 0.35); }
  }
  function setPlate(text) { $("plate-text").textContent = text; }
  function setObjective(text) { $("note-text").textContent = text; $("pause-objective").textContent = "Mục tiêu: " + text; }
  function refreshObjective() {
    if (!G.stage) return;
    if (G.stageIndex < 5) setObjective(D.MAPS[G.stageIndex].objective(G.stage.flags));
    else setObjective("Giữ để tập trung tới 100% trước khi hết giờ. Xử lý khéo các tình huống bất ngờ!");
  }
  function stamp(sec) {
    const box = $("stamps");
    box.innerHTML = "";
    const s = document.createElement("div");
    if (sec > 0) { s.className = "stamp s" + sec; s.textContent = `Mất ${sec} giây!`; play("stamp", 0.8); }
    else { s.className = "stamp ok"; s.textContent = "✓ Ổn rồi!"; play("pen", 0.6); }
    box.appendChild(s);
    if (sec > 0) { const c = $("clock"); c.classList.remove("jolt"); void c.offsetWidth; c.classList.add("jolt"); setTimeout(() => c.classList.remove("jolt"), 400); }
    setTimeout(() => s.remove(), 2100);
  }

  // ------------------------------------------------------------------ dialogue
  const dialog = {
    open: false, def: null, focus: 0, phase: "choose", openedAt: 0, onDone: null, onChoose: null,
    show(def, speaker, onChoose, onDone) {
      this.open = true; G.modal = true; this.def = def; this.focus = 0; this.phase = "choose";
      this.onChoose = onChoose; this.onDone = onDone; this.openedAt = performance.now();
      for (const k in keys) keys[k] = false;
      $("speaker-name").textContent = speaker.name;
      const p = $("portrait-img");
      p.style.backgroundImage = speaker.img ? `url(img/${speaker.img}.webp)` : "none";
      const wide = speaker.wide;
      p.style.backgroundSize = wide ? "contain" : "150% auto";
      p.style.backgroundPosition = wide ? "50% 50%" : "50% 6%";
      $("dlg-text").textContent = def.text;
      const ol = $("dlg-choices"); ol.innerHTML = ""; ol.classList.remove("hidden");
      def.choices.forEach((ch, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="lt">${"ABCD"[i]}</span><span>${esc(ch.t)}</span>`;
        li.addEventListener("pointerenter", () => this.setFocus(i));
        li.addEventListener("click", () => { if (performance.now() - this.openedAt > 200) this.choose(i); });
        ol.appendChild(li);
      });
      $("dlg-reaction").classList.add("hidden");
      $("dim").classList.remove("hidden"); $("dialog").classList.remove("hidden");
      this.setFocus(0);
      play("page", 0.5);
    },
    setFocus(i) {
      this.focus = i;
      [...$("dlg-choices").children].forEach((li, j) => li.classList.toggle("focus", j === i));
    },
    key(e) {
      if (e.repeat) return;
      if (performance.now() - this.openedAt < 220) return;
      const c = e.code;
      if (this.phase === "choose") {
        const n = this.def.choices.length;
        if (c === "ArrowUp" || c === "KeyW") this.setFocus((this.focus + n - 1) % n);
        else if (c === "ArrowDown" || c === "KeyS") this.setFocus((this.focus + 1) % n);
        else if (c === "KeyE" || c === "Space" || c === "Enter") this.choose(this.focus);
        else {
          const m = /^(?:Digit|Numpad)([1-4])$/.exec(c);
          if (m && +m[1] <= n) this.choose(+m[1] - 1);
        }
      } else if (c === "KeyE" || c === "Space" || c === "Enter") this.close();
    },
    confirm() {
      if (performance.now() - this.openedAt < 220) return;
      if (this.phase === "choose") this.choose(this.focus); else this.close();
    },
    choose(i) {
      if (this.phase !== "choose") return;
      this.phase = "react"; this.openedAt = performance.now();
      const ch = this.def.choices[i];
      $("dlg-choices").classList.add("hidden");
      $("dlg-react-text").textContent = ch.r;
      const res = $("dlg-react-result");
      const outcome = this.onChoose ? this.onChoose(ch, i) : null;
      res.className = outcome && outcome.bad ? "bad" : "good";
      res.textContent = outcome ? outcome.text : "";
      $("dlg-reaction").classList.remove("hidden");
      if (outcome && outcome.failNow) { setTimeout(() => { this.close(true); }, 900); }
    },
    close(silent) {
      if (!this.open) return;
      this.open = false; G.modal = false;
      $("dim").classList.add("hidden"); $("dialog").classList.add("hidden");
      interactArmed = !eDown; // a key that closed it must be released first
      const cb = this.onDone; this.onDone = null;
      if (cb && !silent) cb();
    },
    forceClose() { if (this.open) { this.open = false; G.modal = false; $("dim").classList.add("hidden"); $("dialog").classList.add("hidden"); } },
  };

  // Time penalties are applied the moment a choice is made, while the clock is paused.
  function applyPenalty(sec) {
    const st = G.stage; if (!st) return false;
    if (sec > 0) { st.timeLeft -= sec; G.run.used += sec; }
    stamp(sec);
    updateClock();
    if (st.timeLeft <= 0) { st.timeLeft = 0; updateClock(); return true; }
    return false;
  }
  function outcomeText(sec, extra) {
    if (sec > 0) return { bad: true, text: `Mất ${sec} giây!` + (extra ? " " + extra : "") };
    return { bad: false, text: "✓ Không mất thời gian." + (extra ? " " + extra : "") };
  }

  // ------------------------------------------------------------------ Phaser
  let DPR = Math.min(2, window.devicePixelRatio || 1);
  const IMAGES = new Set(["bg1", "bg2", "bg3", "bg4", "bg5", "minh_front", "minh_back", "minh_side", "minh_walk2", "minh_clutch",
    "wc_ok", "wc_locked", "wc_maint", "wc_queue", "wc_need_key", "wc_need_paper", "prop_ball", "dog_sleep"]);
  D.MAPS.forEach((m) => {
    [...(m.props || []), ...(m.npcs || []), ...(m.things || []), ...(m.fixed || [])].forEach((o) => o.img && IMAGES.add(o.img));
    (m.gates || []).forEach((g) => g.sprites.forEach((s) => IMAGES.add(s.img)));
  });

  class World extends Phaser.Scene {
    constructor() { super("world"); }
    preload() {
      IMAGES.forEach((n) => this.load.image(n, `img/${n}.webp`));
      this.load.on("progress", (p) => { $("loading").textContent = `Đang chuẩn bị cặp sách... ${Math.round(p * 100)}%`; });
    }
    create() {
      G.scene = this;
      this.cameras.main.setBackgroundColor("#2A2320");
      G.loaded = true;
      $("loading").textContent = "";
      $("btn-start").disabled = false;
      resize();
      if (window.__onWorldReady) window.__onWorldReady();
    }
    update(time, delta) { step(Math.min(delta, 50) / 1000); }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: "game", width: innerWidth * DPR, height: innerHeight * DPR,
    backgroundColor: "#2A2320", scale: { mode: Phaser.Scale.NONE },
    physics: { default: "arcade", arcade: { debug: false } },
    render: { antialias: true, roundPixels: false }, scene: [World], banner: false,
    input: { keyboard: false, mouse: false, touch: false },
  });

  function zoomFor(w, h) {
    const z = w >= h ? Math.min(w / 900, h / 600) : Math.min(w / 560, h / 900);
    return Math.max(0.45, Math.min(1.6, z));
  }
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    const w = innerWidth, h = innerHeight;
    game.scale.resize(Math.round(w * DPR), Math.round(h * DPR));
    const cv = game.canvas; if (cv) { cv.style.width = w + "px"; cv.style.height = h + "px"; }
    if (G.scene) G.scene.cameras.main.setZoom(zoomFor(w, h) * DPR);
  }
  window.addEventListener("resize", () => setTimeout(resize, 30));

  // ------------------------------------------------------------------ building a map
  let W = null; // the live map: sprites, bodies, interactables
  function img(scene, spec, depthY) {
    const im = scene.add.image(spec.x, spec.y, spec.img).setOrigin(0.5, 1);
    const s = spec.w ? spec.w / im.width : spec.h / im.height;
    im.setScale(s);
    if (spec.flip) im.setFlipX(true);
    im.setDepth(depthY != null ? depthY : spec.y);
    return im;
  }
  function solid(scene, r, tag) {
    const z = scene.add.zone(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2], r[3]);
    scene.physics.add.existing(z, true);
    W.solids.add(z); z.tag = tag;
    return z;
  }
  function footRect(o, f) { return [o.x - f[0] / 2, o.y - f[1], f[0], f[1]]; }
  function shadow(scene, x, y, w) { return scene.add.ellipse(x, y - 3, w, Math.max(10, w * 0.28), 0x3B2F2A, 0.28).setDepth(y - 2); }

  function buildMap(idx) {
    const scene = G.scene, m = D.MAPS[idx];
    scene.tweens.killAll();
    if (W && W.collider) W.collider.destroy();
    if (W && W.solids) W.solids.destroy(true);
    scene.children.list.slice().forEach((o) => o.destroy());
    clearAnchors();
    scene.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    W = { m, solids: scene.physics.add.staticGroup(), inter: [], patrols: [], gates: {}, toilets: [], npcs: {}, wet: null, ball: null };
    const bg = scene.add.image(0, 0, m.bg).setOrigin(0).setDisplaySize(WORLD_W, WORLD_H).setDepth(-1000);
    if (m.cool) bg.setTint(0xEEF4FF);
    (GEO[m.id].solids || []).forEach((r) => solid(scene, r, "wall"));
    (m.shade || []).forEach(([x, y, w, h, a]) => scene.add.rectangle(x, y, w, h, 0x1A1410, a).setOrigin(0).setDepth(-900));
    (m.labels || []).forEach((l) => anchor(esc(l.text), l.x, l.y, l.cls));

    // props
    (m.props || []).forEach((p) => {
      const im = img(scene, p);
      if (p.foot) solid(scene, footRect(p, p.foot), "prop");
      if (p.talk || p.lines) W.inter.push({ kind: p.talk ? "talk" : "lines", talk: p.talk, lines: p.lines, li: 0, name: p.name || "", img: p.img,
        x: p.x, y: p.y, r: 80, top: p.y - p.h, w: p.foot ? p.foot[0] : 80, label: "Nói chuyện", wide: true });
    });
    // fixed objects with collision + reading
    (m.fixed || []).forEach((f) => {
      img(scene, f);
      if (f.rect) solid(scene, f.rect, "fixed");
      if (f.sign) anchor(esc(f.sign), f.x, f.y - f.h * 0.42, "signtxt" + (f.crooked ? " crooked" : ""));
      W.inter.push({ kind: "lines", lines: f.lines, li: 0, name: f.name, x: f.x, y: f.y + 10, r: 80, top: f.y - f.h, w: f.w || 80, label: "Xem" });
    });
    // things (signs, spots)
    (m.things || []).forEach((t) => {
      if (t.img) { img(scene, t); if (t.foot) solid(scene, footRect(t, t.foot), "thing"); }
      if (t.sign) anchor(esc(t.sign), t.x, t.y - t.h * 0.42, "signtxt");
      W.inter.push({ kind: "lines", lines: t.lines, li: 0, name: t.name, x: t.x, y: t.y, r: t.r || 75, top: t.y - (t.h || 30), w: 60, label: t.label || "Xem" });
    });
    // toilets
    m.toilets.forEach((t) => {
      const T = Object.assign({}, t);
      T.sprite = img(scene, { img: "wc_" + t.state, x: t.x, y: t.y, h: 142 });
      solid(scene, [t.x - 48, t.y - 40, 96, 40], "wc");
      T.tagA = anchor("", t.x - 30, t.y - 8, "tag " + t.state);
      T.shadow = shadow(scene, t.x, t.y + 2, 104);
      W.toilets.push(T);
      W.inter.push({ kind: "toilet", toilet: T, x: t.x, y: t.y, r: 88, top: t.y - 142, w: 104, label: "Vào WC" });
    });
    refreshToilets();
    // gates
    (m.gates || []).forEach((g) => {
      const GT = { def: g, body: solid(scene, g.rect, "gate"), sprites: g.sprites.map((s) => img(scene, s)), open: false };
      if (g.zzz) GT.zzz = anchor("z z z", g.sprites[0].x + 20, g.sprites[0].y - 30, "zzz");
      W.gates[g.id] = GT;
      if (g.talk) W.inter.push({ kind: "talk", talk: g.talk, name: D.TALKS[g.talk].name, img: D.TALKS[g.talk].img, x: g.sprites[0].x, y: g.sprites[0].y + 4,
        r: 85, top: g.sprites[0].y - 40, w: 60, label: "Xem", gate: g.id });
    });
    // wet floor
    if (m.wet) {
      W.wet = scene.add.graphics().setDepth(-800);
      drawWet(false);
    }
    // npcs
    (m.npcs || []).forEach((n) => {
      const N = { def: n, x: n.x, y: n.y };
      N.shadow = shadow(scene, n.x, n.y, n.foot ? n.foot[0] * 1.3 : 56);
      N.sprite = img(scene, n);
      N.baseScale = N.sprite.scaleX;
      const r = n.solidRect || footRect(n, n.foot || [36, 16]);
      N.body = solid(scene, r, "npc"); N.rect = r.slice();
      N.offset = [r[0] - n.x, r[1] - n.y];
      if (n.patrol) { N.path = n.patrol; N.pi = 1; N.speed = n.speed || 40; N.t = Math.random() * 6; W.patrols.push(N); }
      W.npcs[n.id] = N;
      W.inter.push({ kind: n.talk ? "talk" : "lines", talk: n.talk, lines: n.lines, li: 0, name: n.name, img: n.img, npc: N,
        x: n.x, y: n.y + 6, r: 82, top: n.y - n.h, w: n.foot ? n.foot[0] * 1.4 : 60, label: "Nói chuyện" });
    });
    // bouncing ball
    if (m.ball) {
      const b = m.ball;
      W.ball = { def: b, x: b.x0, dir: 1, shadow: scene.add.ellipse(b.x0, b.y, 20, 7, 0x3B2F2A, 0.3), sprite: img(scene, { img: "prop_ball", x: b.x0, y: b.y, h: 22 }) };
    }
    // Minh
    const [sx, sy] = m.start;
    W.body = scene.add.zone(sx, sy - 8, 26, 16);
    scene.physics.add.existing(W.body);
    W.body.body.setCollideWorldBounds(true);
    W.collider = scene.physics.add.collider(W.body, W.solids);
    W.minhShadow = scene.add.ellipse(sx, sy - 2, 40, 12, 0x3B2F2A, 0.3);
    W.minh = scene.add.image(sx, sy, "minh_front").setOrigin(0.5, 1);
    W.minhScale = 74 / W.minh.height; W.minh.setScale(W.minhScale);
    W.face = "d"; W.walkT = 0; W.sweatT = 2;
    const cam = scene.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(W.body, true, 0.18, 0.18);
    cam.setZoom(zoomFor(innerWidth, innerHeight) * DPR);
    cam.centerOn(sx, sy);
  }

  function drawWet(dry) {
    const g = W.wet, [x, y, w, h] = W.m.wet; g.clear();
    const hh = dry ? h - W.m.wetDry : h;
    g.fillStyle(0x9FD3F0, 0.28); g.fillRect(x, y, w, hh);
    g.lineStyle(3, 0xffffff, 0.75);
    for (let i = 0; i < 7; i++) { const sx = x + 14 + i * 24; g.lineBetween(sx, y + 12 + (i % 3) * 9, sx + 26, y + hh - 18 - (i % 2) * 14); }
    if (dry) { g.lineStyle(2, 0x2A2320, 0.35); g.strokeRect(x + 2, y + hh + 2, w - 4, W.m.wetDry - 4); }
  }

  function toiletState(T) {
    if ((T.state === "need_key" || T.state === "need_paper") && T.needFlag && G.stage.flags[T.needFlag]) return "ok";
    return T.state;
  }
  function refreshToilets() {
    if (!W) return;
    W.toilets.forEach((T) => {
      const s = toiletState(T);
      if (T.sprite.texture.key !== "wc_" + s) { T.sprite.setTexture("wc_" + s); T.sprite.setScale(142 / T.sprite.height); }
      T.tagA.inner.className = "in tag " + s;
      T.tagA.inner.textContent = s === "ok" ? D.WC_TAG.ok : (T.tag || D.WC_TAG[s]);
    });
  }

  function setFlags(list) {
    if (!list) return;
    list.forEach((f) => {
      G.stage.flags[f] = true;
      if (f === "boxesOpen") openGate("boxes", "vendor");
      if (f === "dogMoved") { openGate("dog"); play("bark", 0.5); }
      if (f === "spillOpen") { openGate("spill"); moveNpc("shopper"); }
      if (f === "guardOk") moveNpc("guard");
      if (f === "dryStrip") shrinkGate("wet");
    });
    refreshToilets(); refreshObjective();
  }
  function openGate(id) {
    const g = W.gates[id]; if (!g || g.open) return;
    g.open = true; g.body.destroy();
    g.sprites.forEach((s, i) => {
      const to = g.def.openTo[i] || g.def.openTo[0];
      G.scene.tweens.add({ targets: s, x: to[0], y: to[1], alpha: to[2] === 0 ? 0 : 1, scale: s.scale * (to[2] || 1), duration: 450, ease: "Quad.out",
        onUpdate: () => s.setDepth(s.y) });
    });
    if (g.zzz) killAnchor(g.zzz);
    W.inter = W.inter.filter((it) => it.gate !== id);
  }
  function shrinkGate(id) {
    const g = W.gates[id]; if (!g) return;
    g.body.destroy(); g.body = solid(G.scene, g.def.shrinkTo, "gate");
    drawWet(true);
  }
  function moveNpc(id) {
    const N = W.npcs[id]; if (!N || !N.def.openTo) return;
    N.body.destroy(); N.body = null;
    const [x, y] = N.def.openTo;
    G.scene.tweens.add({ targets: [N.sprite], x, y, duration: 500, ease: "Quad.out", onUpdate: () => { N.sprite.setDepth(N.sprite.y); N.shadow.setPosition(N.sprite.x, N.sprite.y - 3).setDepth(N.sprite.y - 2); } });
    W.inter.forEach((it) => { if (it.npc === N) { it.x = x; it.y = y + 6; it.top = y - N.def.h; } });
  }

  // ------------------------------------------------------------------ stages
  function startStage(idx) {
    G.stageIndex = idx;
    G.stage = { timeLeft: limitFor(idx), flags: {}, resolved: {}, running: false, progress: 0, eventsDone: {} };
    lastWhole = -1;
    G.paused = false; G.busy = false; G.modal = false; dialog.forceClose();
    for (const k in keys) keys[k] = false;
    $("stamps").innerHTML = "";
    if (idx < 5) {
      const m = D.MAPS[idx];
      buildMap(idx);
      setPlate(`BẢN ĐỒ ${m.id} · ${m.name}`);
      show("play");
      G.stage.running = true;
    } else {
      startFinal();
    }
    refreshObjective(); updateClock();
  }

  function show(screen) {
    G.screen = screen;
    ["menu", "tutorial", "pause", "fail", "final", "ending", "results"].forEach((s) => $(s).classList.add("hidden"));
    const inGame = screen === "play" || screen === "final";
    $("hud").classList.toggle("hidden", !inGame);
    $("touch").classList.toggle("hidden", !(screen === "play" && IS_TOUCH));
    $("game").style.visibility = screen === "play" || screen === "fail" ? "visible" : "hidden";
    $("world-ui").style.display = screen === "play" ? "" : "none";
    if (["menu", "tutorial", "final", "ending", "results"].includes(screen)) $(screen).classList.remove("hidden");
    if (screen === "fail") { $("fail").classList.remove("hidden"); if (G.stageIndex === 5) { $("final").classList.remove("hidden"); $("game").style.visibility = "hidden"; } }
    music(inGame);
  }

  // ------------------------------------------------------------------ the one loop
  function step(dt) {
    if (G.screen === "play" && W) {
      const live = !G.paused && !G.modal && !G.busy;
      if (live) {
        G.stage.timeLeft -= dt; G.run.used += dt;
        if (G.stage.timeLeft <= 0) { G.stage.timeLeft = 0; updateClock(); fail(); return; }
        updateClock();
      }
      moveMinh(live ? dt : 0, dt);
      if (live) movePatrols(dt);
      moveBall(G.paused ? 0 : dt);
      findTarget(live);
      layoutAnchors();
    } else if (G.screen === "final") {
      stepFinal(dt);
    }
  }

  function moveMinh(dt, rawDt) {
    const b = W.body.body;
    let vx = 0, vy = 0;
    if (dt > 0) {
      vx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + stick.x;
      vy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + stick.y;
      const L = Math.hypot(vx, vy);
      if (L > 1) { vx /= L; vy /= L; }
    }
    b.setVelocity(vx * TUNE.speed, vy * TUNE.speed);
    const moving = Math.hypot(vx, vy) > 0.1;
    const urgent = G.stage.timeLeft <= TUNE.warn_seconds;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy) + 0.05) W.face = vx > 0 ? "r" : "l"; else W.face = vy > 0 ? "d" : "u";
      W.walkT += rawDt * (urgent ? 17 : 13);
    }
    const key = !moving && urgent ? "minh_clutch" : W.face === "u" ? "minh_back" : W.face === "d" ? "minh_front" :
      (Math.sin(W.walkT) > 0 ? "minh_walk2" : "minh_side");
    if (W.minh.texture.key !== key) { W.minh.setTexture(key); }
    const sc = 74 / W.minh.height;
    W.minh.setFlipX(W.face === "l");
    const x = W.body.x, y = W.body.y + 8;
    const bob = moving ? Math.abs(Math.sin(W.walkT)) : 0;
    const jit = urgent && moving ? (Math.random() - 0.5) * 2.4 : 0;
    const squash = moving ? 1 - 0.07 * Math.abs(Math.cos(W.walkT)) : 1;
    const knock = urgent && moving ? 1 + 0.05 * Math.sin(W.walkT * 2) : 1;
    W.minh.setPosition(x + jit, y - bob * 5).setScale(sc * knock * (2 - squash) * 0.5 + sc * 0.5, sc * squash);
    W.minh.setRotation(moving ? Math.sin(W.walkT) * 0.06 : 0);
    W.minh.setDepth(y);
    W.minhShadow.setPosition(x, y - 2).setDepth(y - 1);
    if (urgent && dt > 0) {
      W.sweatT -= dt;
      if (W.sweatT <= 0) { W.sweatT = 1.2 + Math.random() * 1.4; anchor('<div class="sweat"></div>', x + 14, y - 66, "", 700); }
    }
  }

  function movePatrols(dt) {
    const m = W.body;
    const mr = [m.x - 13 - 6, m.y - 8 - 6, 26 + 12, 16 + 12];
    W.patrols.forEach((N) => {
      const [tx, ty] = N.path[N.pi];
      const dx = tx - N.x, dy = ty - N.y, L = Math.hypot(dx, dy);
      if (L < 2) { N.pi = (N.pi + 1) % N.path.length; return; }
      const s = Math.min(L, N.speed * dt);
      const nx = N.x + dx / L * s, ny = N.y + dy / L * s;
      const r = [nx + N.offset[0], ny + N.offset[1], N.rect[2], N.rect[3]];
      if (r[0] < mr[0] + mr[2] && r[0] + r[2] > mr[0] && r[1] < mr[1] + mr[3] && r[1] + r[3] > mr[1]) { N.blocked = true; return; }
      N.blocked = false;
      N.x = nx; N.y = ny; N.t += dt * 9;
      N.sprite.setPosition(nx, ny - Math.abs(Math.sin(N.t)) * 3).setDepth(ny);
      if (Math.abs(dx) > Math.abs(dy)) N.sprite.setFlipX(dx < 0);
      N.shadow.setPosition(nx, ny - 3).setDepth(ny - 2);
      if (N.body) { N.body.setPosition(r[0] + r[2] / 2, r[1] + r[3] / 2); N.body.body.updateFromGameObject(); }
      W.inter.forEach((it) => { if (it.npc === N) { it.x = nx; it.y = ny + 6; it.top = ny - N.def.h; } });
    });
  }

  function moveBall(dt) {
    const B = W.ball; if (!B) return;
    B.x += B.dir * 70 * dt;
    if (B.x > B.def.x1) { B.x = B.def.x1; B.dir = -1; } if (B.x < B.def.x0) { B.x = B.def.x0; B.dir = 1; }
    const h = Math.abs(Math.sin(B.x / 28)) * 30;
    B.sprite.setPosition(B.x, B.def.y - h).setDepth(B.def.y);
    B.shadow.setPosition(B.x, B.def.y - 2).setScale(1 - h / 60).setDepth(B.def.y - 1);
  }

  // ------------------------------------------------------------------ interaction
  let target = null, promptA = null;
  function findTarget(live) {
    const mx = W.body.x, my = W.body.y + 8;
    let best = null, bd = Infinity;
    if (live) W.inter.forEach((it) => {
      const d = Math.hypot(it.x - mx, (it.y - my) * 1.2);
      if (d < it.r && d < bd) { bd = d; best = it; }
    });
    if (best !== target) {
      target = best;
      killAnchor(promptA); promptA = null;
      if (best) {
        let label = best.label;
        if (best.kind === "talk" && G.stage.resolved[best.talk] != null) label = best.npc ? "Nói chuyện" : "Xem";
        promptA = anchor(`<div class="prompt"><i class="k">E</i><span class="lab">${esc(label)}</span></div>`, best.x, best.top - 6, "");
        $("btn-act-label").textContent = label; $("btn-act").classList.add("live");
      } else { $("btn-act-label").textContent = "Tương tác"; $("btn-act").classList.remove("live"); }
    }
    if (target) {
      promptA.wx = target.x; promptA.wy = target.top - 6;
      const [x, y] = project(target.x, target.y - 6);
      const z = G.scene.cameras.main.zoom / DPR;
      ring.style.display = ""; ring.style.width = target.w * 1.15 * z + "px"; ring.style.height = Math.max(16, target.w * 0.36 * z) + "px";
      ring.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    } else ring.style.display = "none";
  }

  let bubbleA = null;
  function bubble(text, wx, wy, warn, who) {
    killAnchor(bubbleA);
    bubbleA = anchor(`<div class="bubble${warn ? " warn" : ""}">${who ? `<span class="who">${esc(who)}</span>` : ""}${esc(text)}</div>`, wx, wy, "", 3800, true);
  }

  function tryInteract() {
    if (G.paused || G.modal || G.busy || !target) return;
    const it = target;
    if (it.kind === "toilet") return toiletInteract(it.toilet);
    if (it.kind === "lines") {
      const line = it.lines[it.li % it.lines.length]; it.li++;
      bubble(line, it.x, it.top - 4, false, it.name);
      return;
    }
    if (it.kind === "talk") {
      const def = D.TALKS[it.talk];
      if (G.stage.resolved[it.talk] != null) { bubble(def.after, it.x, it.top - 4, false, it.name); return; }
      dialog.show(def, { name: it.name || def.name, img: it.img || def.img, wide: it.wide }, (ch, i) => {
        G.stage.resolved[it.talk] = i;
        setFlags(ch.set);
        const dead = applyPenalty(ch.pen);
        if (ch.slip) { play("slip", 0.7); G.scene.cameras.main.shake(300, 0.006); }
        const out = outcomeText(ch.pen);
        if (dead) { out.failNow = true; out.text += " Hết giờ!"; setTimeout(() => fail(), 900); }
        return out;
      }, () => { refreshObjective(); });
    }
  }

  function toiletInteract(T) {
    const s = toiletState(T);
    if (s === "ok") return enterToilet(T);
    const sfx = { locked: "click", maint: "click", queue: "click" }[s] || "click";
    play(sfx, 0.5);
    T.sprite.setX(T.x); G.scene.tweens.add({ targets: T.sprite, x: T.x + 4, duration: 50, yoyo: true, repeat: 2 });
    bubble(T.msg, T.x, T.y - 146, true, "Cửa WC");
  }

  function enterToilet(T) {
    G.busy = true; G.stage.running = false;
    W.body.body.setVelocity(0, 0);
    killAnchor(promptA); promptA = null; target = null; ring.style.display = "none";
    const scene = G.scene;
    scene.tweens.add({ targets: [W.minh, W.minhShadow], alpha: 0, duration: 280 });
    W.minh.setTexture("minh_back");
    setTimeout(() => {
      play("door", 0.7);
      scene.tweens.add({ targets: T.sprite, scaleY: T.sprite.scaleY * 0.96, duration: 90, yoyo: true });
      anchor("PHÙ...", T.x, T.y - 120, "puff", 1000);
      play("puff", 0.6);
    }, 300);
    const remaining = G.stage.timeLeft;
    G.run.completed = Math.max(G.run.completed, G.stageIndex + 1);
    G.run.minRemaining = Math.min(G.run.minRemaining, remaining);
    ev("map_cleared", { map: G.stageIndex + 1, left: Math.round(remaining) });
    const next = G.stageIndex + 1;
    setTimeout(() => pageFlip(next), 900);
  }

  function pageFlip(next) {
    const f = $("flip");
    $("flip-plate").textContent = next < 5 ? `BẢN ĐỒ ${next + 1} · ${D.MAPS[next].name}` : "THỬ THÁCH CUỐI";
    $("flip-sub").textContent = next < 5 ? `Thời gian: ${limitFor(next)} giây. Nhanh lên Minh ơi!` : "Cánh cửa đã đóng. Còn 45 giây để... xong việc!";
    f.classList.remove("hidden", "out"); f.classList.add("in");
    play("page", 0.6);
    setTimeout(() => {
      startStage(next);
      G.busy = true; setTimeout(() => { G.busy = false; }, 450);
      f.classList.remove("in"); f.classList.add("out");
      setTimeout(() => { f.classList.add("hidden"); f.classList.remove("out"); }, 450);
    }, 1050);
  }

  // ------------------------------------------------------------------ pause / fail
  function togglePause() {
    if (G.screen !== "play" && G.screen !== "final") return;
    if (G.busy && !G.paused) return;
    G.paused = !G.paused;
    $("pause").classList.toggle("hidden", !G.paused);
    if (G.paused) { for (const k in keys) keys[k] = false; holdKey = holdTouch = false; try { mb?.run?.pause?.(); } catch (e) {} bgm.pause(); }
    else { try { mb?.run?.resume?.(); } catch (e) {} music(true); }
    refreshObjective();
  }
  function fail() {
    if (G.screen === "fail") return;
    dialog.forceClose();
    G.stage.running = false; G.busy = true;
    if (W && W.body) W.body.body.setVelocity(0, 0);
    G.run.failures++;
    ev("stage_failed", { stage: G.stageIndex + 1 });
    $("fail-line").textContent = D.FAIL_LINES[Math.min(G.stageIndex, D.FAIL_LINES.length - 1)];
    show("fail");
    $("hud").classList.remove("hidden");
    play("fail", 0.6);
    if (W && W.minh && G.stageIndex < 5) W.minh.setTexture("minh_clutch");
  }

  // ------------------------------------------------------------------ final challenge
  function startFinal() {
    show("final");
    setPlate("THỬ THÁCH CUỐI · NHÀ VỆ SINH");
    G.stage.running = true;
    G.stage.progress = 0;
    holdKey = holdTouch = false;
    $("final-dark").className = ""; $("final-fx").innerHTML = ""; $("final-bg").className = "";
    const marks = $("ruler-marks");
    marks.innerHTML = "";
    for (let v = 0; v <= 100; v += 20) marks.insertAdjacentHTML("beforeend", `<span style="left:${v}%">${v}</span>`);
    const icons = { knock: "✊", phone: "📱", ask: "💬", lights: "💡" };
    D.FINAL_EVENTS.forEach((e) => marks.insertAdjacentHTML("beforeend", `<i id="mk-${e.id}" style="left:${e.at}%">${icons[e.id]}</i>`));
    updateRuler();
    ev("final_reached");
  }
  function updateRuler() {
    const p = G.stage.progress;
    $("ruler-fill").style.width = (p * 0.92) + "%";
    $("ruler-pct").textContent = Math.floor(p) + "%";
  }
  function stepFinal(dt) {
    const st = G.stage;
    const holding = holdKey || holdTouch;
    $("btn-hold").classList.toggle("held", holding && !G.modal && !G.paused);
    if (G.paused || G.modal || G.busy) return;
    st.timeLeft -= dt; G.run.used += dt;
    if (st.timeLeft <= 0) { st.timeLeft = 0; updateClock(); fail(); return; }
    updateClock();
    if (!holding) return;
    let p = st.progress + TUNE.final_rate * dt;
    const nextEv = D.FINAL_EVENTS.find((e) => !st.eventsDone[e.id]);
    if (nextEv && p >= nextEv.at) { p = nextEv.at; st.progress = p; updateRuler(); triggerEvent(nextEv); return; }
    st.progress = Math.min(100, p);
    updateRuler();
    if (st.progress >= 100) finishFinal();
  }
  function fxText(text, x, y, cls) {
    const d = document.createElement("div"); d.className = cls || "fx-text"; d.textContent = text;
    d.style.left = x; d.style.top = y; $("final-fx").appendChild(d); setTimeout(() => d.remove(), 2000);
    return d;
  }
  function triggerEvent(e) {
    const st = G.stage;
    st.eventsDone[e.id] = true; // resolved once per attempt
    $("mk-" + e.id) && $("mk-" + e.id).classList.add("done");
    G.busy = true; holdKey = false; holdTouch = false;
    if (e.moment === "knock") { $("final-bg").className = "shake"; fxText("CỐC CỐC!", "38%", "34%"); play("knock", 0.9); setTimeout(() => play("knock", 0.9), 500); }
    if (e.moment === "phone") {
      const ph = document.createElement("img"); ph.src = "img/phone.webp"; ph.className = "fx-phone"; $("final-fx").appendChild(ph);
      setTimeout(() => ph.remove(), 2600); fxText("Ting! Ting!", "62%", "24%"); play("buzz", 0.8);
    }
    if (e.moment === "ask") { const b = fxText("\"Ê, ai trong đó đấy?\"", "4%", "40%", "bubble"); b.style.position = "absolute"; b.style.maxWidth = "300px"; }
    if (e.moment === "lights") { $("final-dark").className = "flicker"; play("bell", 0.6); fxText("RENGGG!", "56%", "36%"); }
    setTimeout(() => {
      G.busy = false;
      dialog.show(e, { name: e.name, img: e.moment === "phone" ? "phone" : null }, (ch) => {
        const before = st.progress;
        st.progress = Math.max(0, Math.min(100, st.progress + ch.dp));
        updateRuler();
        if (ch.dp > 0) fxText(`+${ch.dp}%`, (st.progress * 0.9) + "%", "26%", "fx-pct up");
        if (ch.dp < 0) {
          fxText(`${ch.dp}%`, (st.progress * 0.9) + "%", "26%", "fx-pct down");
          const sc = $("ruler-scribble"); sc.className = ""; void sc.offsetWidth;
          sc.style.left = (4 + st.progress * 0.92) + "%"; sc.style.width = ((before - st.progress) * 0.92) + "%"; sc.className = "go"; play("scribble", 0.6);
        }
        const dead = applyPenalty(ch.pen);
        let txt = [];
        if (ch.pen > 0) txt.push(`Mất ${ch.pen} giây!`);
        if (ch.dp < 0) txt.push(`Tiến độ giảm ${-ch.dp}%.`);
        if (ch.dp > 0) txt.push(`Tiến độ tăng ${ch.dp}%!`);
        const bad = ch.pen > 0 || ch.dp < 0;
        const out = { bad, text: txt.length ? txt.join(" ") : "✓ Giữ vững tập trung." };
        if (dead) { out.failNow = true; out.text += " Hết giờ!"; setTimeout(() => fail(), 900); }
        return out;
      }, () => { $("final-dark").className = st.eventsDone.lights ? "" : ""; $("final-bg").className = ""; });
    }, 800);
  }
  function finishFinal() {
    G.busy = true; G.stage.running = false;
    G.run.finalDone = true;
    G.run.minRemaining = Math.min(G.run.minRemaining, G.stage.timeLeft);
    play("ok", 0.8);
    fxText("XONG!", "40%", "40%");
    setTimeout(startEnding, 1300);
  }
  // hold button
  (function () {
    const b = $("btn-hold");
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); holdTouch = true; });
    const up = () => { holdTouch = false; };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
  })();

  // ------------------------------------------------------------------ ending
  let endIdx = 0, endTimer = null;
  function startEnding() {
    show("ending");
    $("panels").innerHTML = ""; endIdx = 0;
    $("btn-end-next").classList.remove("hidden"); $("btn-end-results").classList.add("hidden");
    nextPanel();
  }
  function nextPanel() {
    clearTimeout(endTimer);
    if (endIdx >= D.ENDING.length) return;
    const p = D.ENDING[endIdx++];
    const el = document.createElement("div");
    if (p.stamp) {
      el.className = "panel stamp-panel";
      el.innerHTML = `<div class="bigstamp">${esc(p.stamp)}</div><p>${esc(p.note)}</p>`;
      play("stamp", 0.9);
    } else {
      el.className = "panel" + (p.wide ? " wide" : "") + (p.speed ? " speed" : "");
      el.innerHTML = `<img src="img/${p.img}.webp" alt=""><div class="say${p.shout ? " shout" : ""}">${esc(p.say)}</div>` +
        (p.say2 ? `<div class="say b2">${esc(p.say2)}</div>` : "");
      play("page", 0.4);
    }
    $("panels").appendChild(el);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (endIdx >= D.ENDING.length) {
      $("btn-end-next").classList.add("hidden"); $("btn-end-results").classList.remove("hidden");
      ev("finished");
    } else endTimer = setTimeout(nextPanel, 2600);
  }

  // ------------------------------------------------------------------ results + local board
  let history = [];
  let saveScope = "local";
  async function loadHistory() {
    try {
      if (mb && mb.load) { const r = await mb.load("results"); history = (r && r.value && r.value.runs) || []; saveScope = r && r.scope || "account"; return; }
    } catch (e) { /* fall back below */ }
    try { history = JSON.parse(localStorage.getItem("dntgh_results") || "[]"); } catch (e) { history = []; }
  }
  async function saveHistory() {
    const value = { schemaVersion: 1, runs: history.slice(0, 30) };
    try { if (mb && mb.save) { await mb.save("results", value); return; } } catch (e) {
      if (e && e.reason === "REVISION_CONFLICT" && e.current) {
        try { const merged = [...(e.current.value && e.current.value.runs || []), ...history.filter((r) => r.mine)];
          history = dedupe(merged); await mb.save("results", { schemaVersion: 1, runs: history.slice(0, 30) }); return; } catch (e2) {}
      }
    }
    try { localStorage.setItem("dntgh_results", JSON.stringify(value.runs)); } catch (e) {}
  }
  const dedupe = (l) => { const s = new Set(); return l.filter((r) => { const k = r.id; if (s.has(k)) return false; s.add(k); return true; }); };
  const sortRuns = (l) => l.slice().sort((a, b) => a.time - b.time || a.fails - b.fails);
  const historyReady = loadHistory();

  function remark(run) {
    if (run.failures >= 2) return { label: "MỘT BUỔI SÁNG ĐẦY BIẾN CỐ", text: "Ngã ở đâu, đứng dậy ở đó. Nhiều lần." };
    if (run.minRemaining < 10) return { label: "THOÁT HIỂM TRONG GANG TẤC", text: "Có lúc chỉ còn vài giây. Tim đập thình thịch!" };
    return { label: "NHÀ VÔ ĐỊCH CHẠY ĐUA VỚI THỜI GIAN", text: "Nhanh, gọn, khéo. Đôi chân thần tốc!" };
  }
  function fmtTime(s) { const m = Math.floor(s / 60), r = Math.round(s - m * 60); return `${m} phút ${String(r).padStart(2, "0")} giây`; }
  async function showResults(boardOnly) {
    show("results");
    await historyReady;
    let current = null;
    if (!boardOnly && G.run) {
      const run = G.run, rm = remark(run);
      current = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 7), time: Math.round(run.used * 10) / 10, fails: run.failures,
        date: new Date().toLocaleDateString("vi-VN"), mine: true };
      history.push(current); history = sortRuns(history).slice(0, 30); saveHistory();
      $("r-maps").textContent = `${run.completed} / 5`;
      $("r-final").textContent = run.finalDone ? "Hoàn thành 100%" : "Chưa xong";
      $("r-time").textContent = fmtTime(run.used);
      $("r-fails").textContent = run.failures === 0 ? "0 (không lần nào!)" : `${run.failures} lần`;
      $("r-remark").textContent = rm.text;
      const s = $("r-stamp"); s.textContent = rm.label; s.style.display = "";
      try { mb?.run?.end?.({ seconds: Math.round(run.used), failures: run.failures, maps: run.completed, completed: true }); } catch (e) {}
      runOpen = false;
      document.querySelector(".slip").style.display = "";
    } else {
      document.querySelector(".slip").style.display = "none";
    }
    const rows = sortRuns(history).slice(0, 8);
    $("board-rows").innerHTML = rows.length ? rows.map((r, i) =>
      `<tr class="${i === 0 ? "top" : ""} ${current && r.id === current.id ? "mine" : ""}"><td>${i + 1}</td><td>${fmtTime(r.time)}</td><td>${r.fails}</td><td>${esc(r.date || "")}</td></tr>`).join("")
      : `<tr><td colspan="4">Chưa có lượt nào hoàn thành. Hãy là người đầu tiên!</td></tr>`;
    $("board-note").textContent = "Xếp theo thời gian nhanh nhất; bằng nhau thì ít lần thất bại hơn xếp trên." +
      (saveScope === "browser" || saveScope === "local" ? " Lưu trên trình duyệt này." : " Lưu theo tài khoản của bạn.");
  }

  // ------------------------------------------------------------------ run lifecycle + buttons
  let runOpen = false;
  function beginRun() {
    if (runOpen) { try { mb?.run?.end?.({ completed: false, seconds: Math.round(G.run.used) }); } catch (e) {} }
    newRun(); runOpen = true;
    try { mb?.run?.start?.(); } catch (e) {}
    startStage(0);
  }
  function toMenu() {
    if (runOpen) { try { mb?.run?.end?.({ completed: false, seconds: Math.round(G.run.used), maps: G.run.completed }); } catch (e) {} runOpen = false; }
    if (G.paused) { G.paused = false; }
    dialog.forceClose(); G.stage = null;
    $("pause").classList.add("hidden");
    show("menu");
  }
  function retryStage() {
    $("pause").classList.add("hidden");
    if (G.paused) { G.paused = false; try { mb?.run?.resume?.(); } catch (e) {} }
    startStage(G.stageIndex);
  }
  const click = (id, fn) => $(id).addEventListener("click", () => { play("click", 0.4); fn(); });
  click("btn-start", () => { if (!G.loaded) return; show("tutorial"); $("btn-tut-go").textContent = "Vào học thôi!"; });
  click("btn-howto", () => show("tutorial"));
  click("btn-board", () => showResults(true));
  click("btn-tut-back", () => show("menu"));
  click("btn-tut-go", () => { if (G.loaded) beginRun(); });
  click("btn-resume", () => togglePause());
  click("btn-retry-p", () => retryStage());
  click("btn-restart-p", () => { $("pause").classList.add("hidden"); G.paused = false; beginRun(); });
  click("btn-menu-p", () => toMenu());
  click("btn-retry", () => retryStage());
  click("btn-restart", () => beginRun());
  click("btn-menu-f", () => toMenu());
  click("btn-end-next", () => nextPanel());
  click("btn-end-results", () => { clearTimeout(endTimer); showResults(false); });
  click("btn-again", () => beginRun());
  click("btn-menu-r", () => toMenu());
  $("btn-pause").addEventListener("click", () => togglePause());
  $("btn-sound").addEventListener("click", () => {
    const next = !soundOn;
    try { if (mb?.sound?.set) mb.sound.set(next); } catch (e) {}
    setSound(next);
  });
  $("dlg-continue").addEventListener("click", () => dialog.close());
  $("note").addEventListener("click", () => $("note").classList.toggle("mini"));
  $("btn-start").disabled = true;
  setSound(soundOn);
  tuneReady.then(() => applyVolume());

  // test hooks (used by the automated checks; harmless for players)
  window.__api = {
    G, startStage, beginRun, fail, toMenu, retryStage, togglePause, tryInteract, showResults,
    teleport(x, y) { W.body.setPosition(x, y - 8); W.body.body.reset(x, y - 8); },
    minh() { return W && { x: W.body.x, y: W.body.y + 8 }; },
    target() { return target && { kind: target.kind, label: target.label, name: target.name, talk: target.talk, id: target.toilet && target.toilet.id }; },
    toilets() { return W.toilets.map((t) => ({ id: t.id, state: toiletState(t) })); },
    choose(i) { dialog.choose(i); }, closeDialog() { dialog.close(); }, dialogOpen() { return dialog.open; },
    world() { return W; }, setTime(t) { G.stage.timeLeft = t; },
    // Flood fill over the real collision bodies (moving walkers excluded: they always move on).
    reach() {
      const moving = new Set(W.patrols.map((N) => N.body));
      const rects = W.solids.getChildren().filter((z) => z.active && !moving.has(z)).map((z) => [z.body.x, z.body.y, z.body.width, z.body.height]);
      const S = 6, cw = Math.ceil(WORLD_W / S), ch = Math.ceil(WORLD_H / S);
      const free = (cx, cy) => {
        const x = cx * S, y = cy * S, l = x - 13, t = y - 8, r = x + 13, b = y + 8;
        if (l < 0 || t < 0 || r > WORLD_W || b > WORLD_H) return false;
        for (const q of rects) if (l < q[0] + q[2] && r > q[0] && t < q[1] + q[3] && b > q[1]) return false;
        return true;
      };
      const seen = new Uint8Array(cw * ch); const qx = [], qy = [];
      const s0 = [Math.round(W.body.x / S), Math.round(W.body.y / S)];
      seen[s0[1] * cw + s0[0]] = 1; qx.push(s0[0]); qy.push(s0[1]);
      for (let i = 0; i < qx.length; i++) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = qx[i] + dx, ny = qy[i] + dy;
          if (nx < 0 || ny < 0 || nx >= cw || ny >= ch || seen[ny * cw + nx]) continue;
          if (!free(nx, ny)) continue;
          seen[ny * cw + nx] = 1; qx.push(nx); qy.push(ny);
        }
      }
      const out = {};
      W.inter.forEach((it) => {
        const key = it.toilet ? it.toilet.id : (it.talk || it.name || it.kind);
        let ok = false;
        for (let i = 0; i < qx.length && !ok; i++) {
          const fx = qx[i] * S, fy = qy[i] * S + 8;
          if (Math.hypot(it.x - fx, (it.y - fy) * 1.2) < it.r) ok = true;
        }
        out[key] = ok;
      });
      return out;
    },
    // a reachable spot right in front of an interactable, for the checks
    near(key) {
      const it = W.inter.find((i) => (i.toilet ? i.toilet.id : (i.talk || i.name)) === key); if (!it) return null;
      const moving = new Set(W.patrols.map((N) => N.body));
      const rects = W.solids.getChildren().filter((z) => z.active && !moving.has(z)).map((z) => [z.body.x, z.body.y, z.body.width, z.body.height]);
      for (let d = 0; d < it.r; d += 4) for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -0.3], [-1, -0.3]]) {
        const fx = it.x + ax * d, fy = it.y + ay * d;
        if (Math.hypot(it.x - fx, (it.y - fy) * 1.2) >= it.r * 0.9) continue;
        const l = fx - 13, t = fy - 16, r = fx + 13, b = fy;
        if (rects.some((q) => l < q[0] + q[2] && r > q[0] && t < q[1] + q[3] && b > q[1])) continue;
        return [fx, fy];
      }
      return null;
    },
    go(key) { const p = this.near(key); if (p) this.teleport(p[0], p[1]); return p; },
  };
})();
