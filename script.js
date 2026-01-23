/* =========================
   BACKGROUND SHAPES (JS)
========================= */
const bgWrap = document.getElementById("bgWrap");

const COLORS = [
  "rgba(255, 193, 5, 0.69)",
  "rgba(255, 77, 0, 0.65)",
  "rgba(238, 91, 71, 0.59)",
  "rgba(153, 50, 107, 0.61)",
  "rgba(253, 121, 231, 0.56)"
];

const SHAPE_COUNT = 36;

function rand(min, max){ return Math.random() * (max - min) + min; }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

// Respect reduced motion
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let vw = window.innerWidth;
let vh = window.innerHeight;

window.addEventListener("resize", () => {
  vw = window.innerWidth;
  vh = window.innerHeight;
});

/* ---------- Cursor tracking ---------- */
let mouseX = vw / 2;
let mouseY = vh / 2;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

/* ---------- Cursor attraction tuning ---------- */
const CURSOR_FORCE = 180;
const CURSOR_RADIUS = 260;
const DAMPING = 0.98;

const shapes = [];

function createShape(){
  const el = document.createElement("div");
  el.className = "shape";

  const sparkle = Math.random() < 0.28;
  if (sparkle) el.classList.add("is-sparkle");

  const size = sparkle ? rand(14, 28) : rand(60, 160);

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.background = `radial-gradient(circle at 30% 30%, ${pick(COLORS)}, rgba(255,255,255,.15))`;

  if (!sparkle) {
    el.style.filter = "blur(1px) saturate(1.1)";
  } else {
    el.style.opacity = "0.75";
  }

  const x = rand(0, Math.max(1, vw - size));
  const y = rand(0, Math.max(1, vh - size));

  const base = sparkle ? rand(50, 110) : rand(25, 70);
  const angle = rand(0, Math.PI * 2);
  let vx = Math.cos(angle) * base;
  let vy = Math.sin(angle) * base;

  const rot = rand(-20, 20);
  const vr = rand(-14, 14);

  // ✅ Guard: if bgWrap doesn't exist on project pages, skip append
  if (bgWrap) {
    bgWrap.appendChild(el);
    el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
  }

  return { el, size, x, y, vx, vy, rot, vr };
}

// ✅ Only build shapes if bgWrap exists
if (bgWrap) {
  for (let i = 0; i < SHAPE_COUNT; i++) shapes.push(createShape());
}

const MODE = "bounce";

/* ---------- Animation loop ---------- */
let last = performance.now();

function tick(now){
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // ✅ Only animate if shapes exist and no reduced motion
  if (!reduceMotion && shapes.length) {
    for (const s of shapes) {
      const cx = mouseX - (s.x + s.size / 2);
      const cy = mouseY - (s.y + s.size / 2);
      const dist = Math.hypot(cx, cy) || 1;

      if (dist < CURSOR_RADIUS) {
        const strength = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE;
        s.vx += (cx / dist) * strength * dt;
        s.vy += (cy / dist) * strength * dt;
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      s.vx *= DAMPING;
      s.vy *= DAMPING;

      s.rot += s.vr * dt;

      if (MODE === "bounce") {
        if (s.x <= 0) { s.x = 0; s.vx *= -1; }
        if (s.y <= 0) { s.y = 0; s.vy *= -1; }
        if (s.x >= vw - s.size) { s.x = vw - s.size; s.vx *= -1; }
        if (s.y >= vh - s.size) { s.y = vh - s.size; s.vy *= -1; }
      } else {
        if (s.x < -s.size) s.x = vw;
        if (s.x > vw) s.x = -s.size;
        if (s.y < -s.size) s.y = vh;
        if (s.y > vh) s.y = -s.size;
      }

      if (s.el) {
        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
      }
    }
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

/* =========================
   GREETING ROTATION (SPIN)
========================= */
const greetings = ["Salam", "Hello", "Namaste", "Bonjour"];
const greetingEl = document.getElementById("greeting");

let greetIndex = 0;

const CHANGE_EVERY_MS = 1500;
const STAGGER_MS = 30;
const SPIN_MS = 520;

function padToLongest(list){
  const maxLen = Math.max(...list.map(s => s.length));
  return list.map(s => s.padEnd(maxLen, " "));
}

const paddedGreetings = padToLongest(greetings);

function renderGreeting(text){
  if (!greetingEl) return;
  greetingEl.innerHTML = "";

  for (let i = 0; i < text.length; i++) {
    const tile = document.createElement("span");
    tile.className = "g-char";

    const face = document.createElement("span");
    face.className = "g-face";
    face.textContent = text[i] === " " ? "\u00A0" : text[i];

    tile.appendChild(face);
    greetingEl.appendChild(tile);
  }
}

function spinToNext(){
  if (!greetingEl) return;

  greetIndex = (greetIndex + 1) % paddedGreetings.length;
  const nextText = paddedGreetings[greetIndex];

  const faces = greetingEl.querySelectorAll(".g-face");
  if (faces.length !== nextText.length) {
    renderGreeting(nextText);
    return;
  }

  faces.forEach((face, i) => {
    setTimeout(() => {
      face.classList.remove("spin");
      void face.offsetWidth;
      face.classList.add("spin");

      setTimeout(() => {
        face.textContent = nextText[i] === " " ? "\u00A0" : nextText[i];
      }, Math.floor(SPIN_MS * 0.5));
    }, i * STAGGER_MS);
  });
}

if (greetingEl) {
  renderGreeting(paddedGreetings[greetIndex]);
  setInterval(spinToNext, CHANGE_EVERY_MS);
}

/* =========================
   BLAST ON BREAKPOINT CHANGE
========================= */
const BREAKPOINT_PX = 600;
const mq = window.matchMedia(`(max-width: ${BREAKPOINT_PX}px)`);

let lastIsMobile = mq.matches;

const BURST_COUNT = 40;
const BURST_LIFE_MS = 650;
const BURST_FORCE = 520;
const KICK_FORCE = 260;

function triggerBlast(){
  if (!bgWrap || reduceMotion || !shapes.length) return;

  const ox = vw / 2;
  const oy = vh / 2;

  for (const s of shapes) {
    const dx = (s.x + s.size / 2) - ox;
    const dy = (s.y + s.size / 2) - oy;
    const d = Math.hypot(dx, dy) || 1;

    s.vx += (dx / d) * KICK_FORCE;
    s.vy += (dy / d) * KICK_FORCE;
  }

  const created = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    const p = document.createElement("div");
    p.className = "burst-particle";
    if (Math.random() < 0.35) p.classList.add("spark");

    const size = rand(8, 18);
    p.style.setProperty("--ps", `${size}px`);
    p.style.setProperty(
      "--pc",
      `radial-gradient(circle at 30% 30%, ${pick(COLORS)}, rgba(255,255,255,.2))`
    );

    let x = ox;
    let y = oy;

    const a = rand(0, Math.PI * 2);
    const sp = rand(BURST_FORCE * 0.45, BURST_FORCE);
    let vx = Math.cos(a) * sp;
    let vy = Math.sin(a) * sp;

    const rot = rand(-30, 30);

    bgWrap.appendChild(p);
    created.push({ el: p, x, y, vx, vy, rot });
  }

  const start = performance.now();

  function animateBurst(now){
    const t = now - start;
    const k = Math.min(1, t / BURST_LIFE_MS);
    const ease = 1 - Math.pow(1 - k, 3);

    for (const b of created) {
      b.x += b.vx * 0.016 * (1 - ease * 0.65);
      b.y += b.vy * 0.016 * (1 - ease * 0.65);

      b.el.style.opacity = String(Math.max(0, 1 - k));
      b.el.style.transform =
        `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.rot + ease * 120}deg) scale(${1 + ease * 0.25})`;
    }

    if (t < BURST_LIFE_MS) requestAnimationFrame(animateBurst);
    else created.forEach(b => b.el.remove());
  }

  requestAnimationFrame(animateBurst);
}

function spreadShapesEverywhere(){
  if (reduceMotion || !shapes.length) return;

  const ox = vw / 2;
  const oy = vh / 2;

  for (const s of shapes) {
    s.x = rand(0, Math.max(1, vw - s.size));
    s.y = rand(0, Math.max(1, vh - s.size));

    const dx = (s.x + s.size / 2) - ox;
    const dy = (s.y + s.size / 2) - oy;
    const d = Math.hypot(dx, dy) || 1;

    const burst = rand(180, 420);
    s.vx = (dx / d) * burst;
    s.vy = (dy / d) * burst;

    if (s.el) {
      s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
    }
  }
}

mq.addEventListener("change", (e) => {
  const isMobile = e.matches;
  if (isMobile !== lastIsMobile) {
    triggerBlast();
    if (!isMobile && lastIsMobile) spreadShapesEverywhere();
    lastIsMobile = isMobile;
  }
});

/* =========================
   FOOTER YEAR
========================= */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================
   MOBILE HAMBURGER MENU
========================= */
const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

function closeMenu(){
  if (!navToggle || !mobileMenu) return;
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  mobileMenu.hidden = true;
}

function toggleMenu(){
  if (!navToggle || !mobileMenu) return;
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navToggle.classList.toggle("is-open", !isOpen);
  mobileMenu.hidden = isOpen;
}

if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", toggleMenu);

  mobileMenu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) closeMenu();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

/* =========================
   GAMIFICATION: DO NOT PRESS
========================= */
const dontPressBtn = document.getElementById("dontPressBtn");
const wandLayer = document.getElementById("wandLayer");
const wandGlow = document.getElementById("wandGlow");
const flashbang = document.getElementById("flashbang");
const spellProgress = document.getElementById("spellProgress");

/* ✅ NEW: hidden input for mobile keyboard */
const spellInput = document.getElementById("spellInput");

const SPELL = "reparo";
let spellIndex = 0;
let chaosActive = false;
let lockInput = false;

function setGlowIntensity(i){
  const a = Math.min(1, i / SPELL.length);
  const glowA = a * 0.95;
  const glowB = 18 + a * 24;
  const glowC = 26 + a * 44;

  if (!wandGlow) return;
  wandGlow.style.setProperty("--glowA", glowA.toFixed(2));
  wandGlow.style.setProperty("--glowB", `${glowB.toFixed(0)}px`);
  wandGlow.style.setProperty("--glowC", `${glowC.toFixed(0)}px`);
}

/* ✅ NEW helpers */
function focusSpellInput(){
  if (!spellInput) return;
  spellInput.value = "";
  spellInput.focus({ preventScroll: true });
}

function blurSpellInput(){
  if (!spellInput) return;
  spellInput.blur();
}

function showWand(){
  if (!wandLayer) return;

  wandLayer.hidden = false;
  wandLayer.setAttribute("aria-hidden", "false");

  // reset spell UI
  spellIndex = 0;
  if (spellProgress) spellProgress.textContent = "_".repeat(SPELL.length);
  setGlowIntensity(0);

  // wand motion classes
  const wand = document.getElementById("wand");
  if (wand){
    wand.classList.remove("is-idle", "is-casting");
    void wand.offsetWidth; // restart animation
    wand.classList.add("is-casting");

    wand.addEventListener("animationend", () => {
      wand.classList.remove("is-casting");
      wand.classList.add("is-idle");
    }, { once: true });
  }


}

function hideWand(){
  if (!wandLayer) return;

  const wand = document.getElementById("wand");
  if (wand){
    wand.classList.remove("is-casting", "is-idle");
  }

  wandLayer.hidden = true;
  wandLayer.setAttribute("aria-hidden", "true");

  // ✅ Mobile: close keyboard
  blurSpellInput();
}

function flashAndRestore(){
  if (!flashbang){
    restoreEverything();
    return;
  }

  flashbang.hidden = false;
  flashbang.classList.remove("is-fade");
  flashbang.classList.add("is-flash");

  setTimeout(() => {
    flashbang.classList.remove("is-flash");
    flashbang.classList.add("is-fade");
  }, 220);

  setTimeout(() => {
    flashbang.hidden = true;
    flashbang.classList.remove("is-fade");
    restoreEverything();
  }, 1100);
}

function getDropletTargets(){
  const targets = [
    document.querySelector("header"),

    // hero
    document.querySelector(".hero-card"),
    document.querySelector(".hero-name"),
    document.querySelector(".subline"),
    document.querySelector(".cta-row"),

    // projects
    ...document.querySelectorAll(".project"),

    // footer + button
    document.querySelector("footer"),
    dontPressBtn
  ].filter(Boolean);

  return Array.from(new Set(targets));
}

function applyDropletStagger(){
  const unique = getDropletTargets();

  const STEP_MS = 120;
  const START_MS = 120;

  unique.forEach((el, i) => {
    el.classList.add("drop");
    el.style.setProperty("--d", `${START_MS + i * STEP_MS}ms`);
  });

  // background shapes fall too
  if (shapes.length) {
    shapes.forEach((s, i) => {
      if (!s.el) return;
      s.el.classList.add("drop");
      s.el.style.setProperty("--d", `${START_MS + i * 18}ms`);
    });
  }
}

function clearDropletStagger(){
  document.querySelectorAll(".drop").forEach((el) => {
    el.classList.remove("drop");
    el.style.removeProperty("--d");
  });

  if (shapes.length) {
    shapes.forEach((s) => {
      if (!s.el) return;
      s.el.classList.remove("drop");
      s.el.style.removeProperty("--d");
    });
  }
}

function dropEverything(){
  if (chaosActive) return;
  chaosActive = true;

  applyDropletStagger();
  document.body.classList.add("chaos");

  // show wand after the fall starts
  setTimeout(() => {
    showWand();
  }, 1900);
}

function restoreEverything(){
  chaosActive = false;

  document.body.classList.remove("chaos");
  clearDropletStagger();

  hideWand();
  setGlowIntensity(0);
  spellIndex = 0;
  lockInput = false;

  // ✅ make sure keyboard is closed
  blurSpellInput();
}

function updateSpellProgress(){
  if (!spellProgress) return;
  const done = SPELL.slice(0, spellIndex);
  const left = "_".repeat(SPELL.length - spellIndex);
  spellProgress.textContent = `${done}${left}`;
}

/* Desktop hardware keyboard support */
function handleSpellKey(e){
  if (!chaosActive || lockInput) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const k = (e.key || "").toLowerCase();
  if (k.length !== 1) return;

  const expected = SPELL[spellIndex];

  if (k === expected) {
    spellIndex += 1;
    updateSpellProgress();
    setGlowIntensity(spellIndex);

    if (spellIndex >= SPELL.length) {
      lockInput = true;
      setTimeout(() => flashAndRestore(), 120);
    }
  } else {
    spellIndex = 0;
    updateSpellProgress();
    setGlowIntensity(0);
  }
}

/* ✅ Mobile keyboard input support */
if (spellInput) {
  spellInput.addEventListener("input", () => {
    if (!chaosActive || lockInput) return;

    const v = (spellInput.value || "").toLowerCase();
    const k = v.slice(-1);
    if (!k) return;

    const expected = SPELL[spellIndex];

    if (k === expected) {
      spellIndex += 1;
      updateSpellProgress();
      setGlowIntensity(spellIndex);

      if (spellIndex >= SPELL.length) {
        lockInput = true;
        blurSpellInput();
        setTimeout(() => flashAndRestore(), 120);
      }
    } else {
      spellIndex = 0;
      updateSpellProgress();
      setGlowIntensity(0);
    }

    // keep it tiny so suggestions/autofill don't mess it up
    spellInput.value = "";
  });
}

/* ✅ Tap wand layer to re-open keyboard if focus is lost */
if (wandLayer) {
  wandLayer.addEventListener("click", () => {
    if (chaosActive && !lockInput) focusSpellInput();
  });
}

function randomizeDontPressPosition(){
  if (!dontPressBtn) return;

  const spots = [
    { right: "18px", bottom: "18px", left: "auto", top: "auto" },
    { right: "18px", top: "90px", left: "auto", bottom: "auto" },
    { left: "18px", bottom: "18px", right: "auto", top: "auto" },
    { left: "18px", top: "90px", right: "auto", bottom: "auto" }
  ];

  const s = spots[Math.floor(Math.random() * spots.length)];
  dontPressBtn.style.left = s.left;
  dontPressBtn.style.right = s.right;
  dontPressBtn.style.top = s.top;
  dontPressBtn.style.bottom = s.bottom;
}

if (dontPressBtn) {
  randomizeDontPressPosition();

  dontPressBtn.addEventListener("click", () => {
    if (chaosActive) return;
    dropEverything();
    focusSpellInput(); // ✅ open mobile keyboard right after click
  });
}

window.addEventListener("keydown", handleSpellKey);


// ===== Journey Map Rectangle Magnifier =====
document.querySelectorAll(".cs-zoom").forEach((wrap) => {
  const img = wrap.querySelector(".cs-zoom-img");
  const lens = wrap.querySelector(".cs-zoom-lens");
  if (!img || !lens) return;

  const zoom = 10.0; // must match background-size ~220%

  // set background image for lens once image is ready
  const setBg = () => {
    lens.style.backgroundImage = `url("${img.src}")`;
    lens.style.backgroundSize = `${zoom * 100}%`;
  };
  if (img.complete) setBg();
  img.addEventListener("load", setBg);

  function move(e){
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lw = lens.offsetWidth;
    const lh = lens.offsetHeight;

    // keep lens inside container
    const lx = Math.max(0, Math.min(x - lw/2, rect.width - lw));
    const ly = Math.max(0, Math.min(y - lh/2, rect.height - lh));

    lens.style.transform = `translate(${lx}px, ${ly}px)`;

    // background position aligns with cursor
    const bx = (x / rect.width) * 100;
    const by = (y / rect.height) * 100;
    lens.style.backgroundPosition = `${bx}% ${by}%`;
  }

  wrap.addEventListener("mousemove", move);
  wrap.addEventListener("mouseenter", () => lens.style.opacity = "1");
  wrap.addEventListener("mouseleave", () => {
    lens.style.opacity = "0";
    lens.style.transform = "translate(-9999px, -9999px)";
  });
});




// about.js

/* =========================
   ABOUT PAGE: READ MORE STORY PREVIEW
========================= */
(function () {
  const toggle = document.getElementById("aboutStoryToggle");
  const preview = document.getElementById("aboutStoryPreview");

  if (!toggle || !preview) return;

  function setOpen(open){
    preview.classList.toggle("is-open", open);
    preview.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Show less" : "Read more";
  }

  // default collapsed
  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = preview.classList.contains("is-open");
    setOpen(!isOpen);

    // nice: if opening, scroll it into view a bit
    if (!isOpen){
      preview.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();





// Zen garden page (SAFE)
(() => {
  const cssOutput = document.getElementById("cssOutput");
  const copyBtn = document.getElementById("copyCss");

  // If not on Zen page, do nothing
  if (!cssOutput || !copyBtn) return;

  fetch("zen-garden-style.css")
    .then(res => res.text())
    .then(data => {
      cssOutput.textContent = data;
    })
    .catch(() => {
      cssOutput.textContent = "Could not load zen-garden-style.css";
    });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(cssOutput.textContent || "");
    alert("CSS copied to clipboard");
  });
})();


/* =========================
   TESTIMONIAL CAROUSEL (AUTOPLAY + SHUFFLE + SWIPE)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".tms-track");
    const viewport = root.querySelector(".tms-viewport");
    const prevBtn = root.querySelector(".tms-prev");
    const nextBtn = root.querySelector(".tms-next");
    const dotsWrap = root.querySelector(".tms-dots");

    if (!track || !viewport) return;

    // Grab slides
    let slides = Array.from(track.children).filter(el => el.classList.contains("tms-slide"));
    if (slides.length === 0) return;

    /* ---------- 1) SHUFFLE ORDER ON EVERY REFRESH ---------- */
    function shuffle(arr){
      for (let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    slides = shuffle(slides);
    slides.forEach(s => track.appendChild(s)); // re-append in shuffled order

    /* ---------- Build dots dynamically (so they match shuffled slides) ---------- */
    let dots = [];
    if (dotsWrap){
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.className = "tms-dot";
        b.type = "button";
        b.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
        dotsWrap.appendChild(b);
      });
      dots = Array.from(dotsWrap.querySelectorAll(".tms-dot"));
    }

    /* ---------- Core state ---------- */
    let index = 0;

    function clampIndex(i){
      const n = slides.length;
      return (i % n + n) % n;
    }

    function update(toIndex){
      index = clampIndex(toIndex);
      track.style.transition = "transform .45s cubic-bezier(.2,.8,.2,1)";
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }

    /* ---------- Buttons + dots ---------- */
    prevBtn?.addEventListener("click", () => { update(index - 1); bumpAutoplay(); });
    nextBtn?.addEventListener("click", () => { update(index + 1); bumpAutoplay(); });

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => { update(i); bumpAutoplay(); });
    });

    /* ---------- 2) AUTOPLAY ---------- */
    const AUTOPLAY_MS = 2500;   // change speed here
    const RESUME_AFTER_MS = 3800;

    let timer = null;
    let resumeTimer = null;
    let paused = false;

    function startAutoplay(){
      stopAutoplay();
      if (paused) return;
      timer = setInterval(() => update(index + 1), AUTOPLAY_MS);
    }

    function stopAutoplay(){
      if (timer){ clearInterval(timer); timer = null; }
      if (resumeTimer){ clearTimeout(resumeTimer); resumeTimer = null; }
    }

    function bumpAutoplay(){
      // Called after user interaction so autoplay doesn't fight them
      stopAutoplay();
      resumeTimer = setTimeout(() => startAutoplay(), RESUME_AFTER_MS);
    }

    // Pause on hover (desktop), focus (keyboard), and when tab not visible
    root.addEventListener("mouseenter", () => { paused = true; stopAutoplay(); });
    root.addEventListener("mouseleave", () => { paused = false; startAutoplay(); });

    root.addEventListener("focusin", () => { paused = true; stopAutoplay(); });
    root.addEventListener("focusout", () => { paused = false; startAutoplay(); });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden){ stopAutoplay(); }
      else { startAutoplay(); }
    });

    /* ---------- Swipe support (pointer) ---------- */
    let startX = 0;
    let currentX = 0;
    let isDown = false;

    viewport.addEventListener("pointerdown", (e) => {
      isDown = true;
      startX = e.clientX;
      currentX = startX;
      viewport.setPointerCapture?.(e.pointerId);
      track.style.transition = "none";
      stopAutoplay();
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      currentX = e.clientX;
      const dx = currentX - startX;
      const percent = (dx / viewport.clientWidth) * 100;
      track.style.transform = `translate3d(calc(-${index * 100}% + ${percent}%), 0, 0)`;
    });

    function endSwipe(){
      if (!isDown) return;
      isDown = false;

      const dx = currentX - startX;
      track.style.transition = "transform .45s cubic-bezier(.2,.8,.2,1)";

      const threshold = viewport.clientWidth * 0.18;
      if (dx > threshold) update(index - 1);
      else if (dx < -threshold) update(index + 1);
      else update(index);

      bumpAutoplay();
    }

    viewport.addEventListener("pointerup", endSwipe);
    viewport.addEventListener("pointercancel", endSwipe);
    viewport.addEventListener("pointerleave", endSwipe);

    /* ---------- Init ---------- */
    update(0);
    startAutoplay();
  });
});

const storyLink = document.getElementById("aboutStoryLink");
const storySection = document.getElementById("about-story");

if (storyLink && storySection) {
  storyLink.addEventListener("click", (e) => {
    e.preventDefault();

    const rect = storySection.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const sectionCenter =
      rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);

    window.scrollTo({
      top: sectionCenter,
      behavior: "smooth",
    });
  });
}
