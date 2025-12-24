/* =========================
   BACKGROUND SHAPES (JS)
========================= */
const bgWrap = document.getElementById("bgWrap");

const COLORS = [
  "rgba(255, 193, 5, 0.69)",
  "rgba(255, 77, 0, 0.65)",
  "rgba(17, 99, 250, 0.59)",
  "rgba(4, 34, 6, 0.61)",
  "rgba(196, 140, 255, 0.56)"
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

  // Some sparkles, mostly blobs
  const sparkle = Math.random() < 0.28;
  if (sparkle) el.classList.add("is-sparkle");

  const size = sparkle ? rand(14, 28) : rand(60, 160);

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.background = `radial-gradient(circle at 30% 30%, ${pick(COLORS)}, rgba(255,255,255,.15))`;

  // Optional softness differences
  if (!sparkle) {
    el.style.filter = "blur(1px) saturate(1.1)";
  } else {
    el.style.opacity = "0.75";
  }

  // Start anywhere on screen
  const x = rand(0, Math.max(1, vw - size));
  const y = rand(0, Math.max(1, vh - size));

  // Velocity (px/sec)
  const base = sparkle ? rand(50, 110) : rand(25, 70);
  const angle = rand(0, Math.PI * 2);
  let vx = Math.cos(angle) * base;
  let vy = Math.sin(angle) * base;

  // Rotation
  const rot = rand(-20, 20);
  const vr = rand(-14, 14);

  bgWrap.appendChild(el);

  // Set initial transform immediately (prevents top-left flash)
  el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;

  return { el, size, x, y, vx, vy, rot, vr };
}

// Create shapes
for (let i = 0; i < SHAPE_COUNT; i++) {
  shapes.push(createShape());
}

const MODE = "bounce"; // "bounce" or "wrap"

/* ---------- Animation loop ---------- */
let last = performance.now();

function tick(now){
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (!reduceMotion) {
    for (const s of shapes) {
      // Cursor attraction
      const cx = mouseX - (s.x + s.size / 2);
      const cy = mouseY - (s.y + s.size / 2);
      const dist = Math.hypot(cx, cy) || 1;

      if (dist < CURSOR_RADIUS) {
        const strength = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE;
        s.vx += (cx / dist) * strength * dt;
        s.vy += (cy / dist) * strength * dt;
      }

      // Natural roaming
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Damping keeps motion smooth
      s.vx *= DAMPING;
      s.vy *= DAMPING;

      // Rotation
      s.rot += s.vr * dt;

      // Screen bounds
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

      // Apply transform
      s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
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

// Controls
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

  // If something changed (font loads, etc.), re-render safely
  if (faces.length !== nextText.length) {
    renderGreeting(nextText);
    return;
  }

  faces.forEach((face, i) => {
    setTimeout(() => {
      face.classList.remove("spin");
      void face.offsetWidth; // force reflow
      face.classList.add("spin");

      // swap character around mid-spin
      setTimeout(() => {
        const ch = nextText[i] === " " ? "\u00A0" : nextText[i];
        face.textContent = ch;
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

// Blast particles config
const BURST_COUNT = 40;
const BURST_LIFE_MS = 650;
const BURST_FORCE = 520;
const KICK_FORCE = 260;

function blastColor(){
  return pick(COLORS);
}

function triggerBlast(){
  if (!bgWrap || reduceMotion) return;

  const ox = vw / 2;
  const oy = vh / 2;

  // Kick existing shapes outward
  for (const s of shapes) {
    const dx = (s.x + s.size / 2) - ox;
    const dy = (s.y + s.size / 2) - oy;
    const d = Math.hypot(dx, dy) || 1;

    s.vx += (dx / d) * KICK_FORCE;
    s.vy += (dy / d) * KICK_FORCE;
  }

  // Create burst particles
  const created = [];
  for (let i = 0; i < BURST_COUNT; i++) {
    const p = document.createElement("div");
    p.className = "burst-particle";

    if (Math.random() < 0.35) p.classList.add("spark");

    const size = rand(8, 18);
    p.style.setProperty("--ps", `${size}px`);
    p.style.setProperty(
      "--pc",
      `radial-gradient(circle at 30% 30%, ${blastColor()}, rgba(255,255,255,.2))`
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

      const fade = 1 - k;
      b.el.style.opacity = String(Math.max(0, fade));
      b.el.style.transform =
        `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.rot + ease * 120}deg) scale(${1 + ease * 0.25})`;
    }

    if (t < BURST_LIFE_MS) {
      requestAnimationFrame(animateBurst);
    } else {
      for (const b of created) b.el.remove();
    }
  }

  requestAnimationFrame(animateBurst);
}

function spreadShapesEverywhere(){
  if (reduceMotion) return;

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

    s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg)`;
  }
}

// Listen for breakpoint crossing (desktop <-> mobile)
mq.addEventListener("change", (e) => {
  const isMobile = e.matches;

  if (isMobile !== lastIsMobile) {
    triggerBlast();

    // Mobile -> desktop: spread everywhere
    if (!isMobile && lastIsMobile) {
      spreadShapesEverywhere();
    }

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

  // Close when clicking a menu link
  mobileMenu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) closeMenu();
  });

  // Close on Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Use the same breakpoint as CSS (recommended)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}
