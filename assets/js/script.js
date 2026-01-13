/* =====================================================
   CANVAS SETUP
===================================================== */
const canvas = document.getElementById("sakura");
const ctx = canvas.getContext("2d");
const title = document.querySelector(".content h1");

const DPR = window.devicePixelRatio || 1;

function resizeCanvas() {
  canvas.width = innerWidth * DPR;
  canvas.height = innerHeight * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

/* =====================================================
   CSS VARIABLE HELPER
===================================================== */
function getCSSVar(name) {
  return getComputedStyle(document.body)
    .getPropertyValue(name)
    .trim();
}

/* =====================================================
   CONSTANTS
===================================================== */
const FLOWER_COUNT = 45;
const PETAL_COUNT = 120;
const FIREFLY_COUNT = 40;

const FLOWER_FALL_SPEED = 0.5;
const PETAL_FALL_SPEED = 0.8;

const WIND_STRENGTH = 0.04;
const WIND_DECAY = 0.95;

const SHOOTING_STAR_CHANCE = 0.002;

/* =====================================================
   STATE
===================================================== */
let wind = 0;
const flowers = [];
const petals = [];
const fireflies = [];
const shootingStars = [];

/* =====================================================
   MOON (firefly avoidance)
===================================================== */
function getMoon() {
  return {
    x: innerWidth - 140,
    y: 90,
    r: 140
  };
}

/* =====================================================
   FLOWER
===================================================== */
class Flower {
  constructor() {
    this.reset(true);
  }

  reset(randomY = false) {
    this.x = Math.random() * innerWidth;
    this.y = randomY ? Math.random() * innerHeight : -60;
    this.size = Math.random() * 0.6 + 0.4;
    this.speedY = Math.random() * 0.3 + FLOWER_FALL_SPEED;
    this.speedX = Math.random() * 0.4 - 0.2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.01 - 0.005;
    this.opacity = Math.random() * 0.4 + 0.6;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + wind * 0.6;
    this.rotation += this.rotationSpeed + wind * 0.002;

    if (this.y > innerHeight + 80) this.reset();
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.size, this.size);
    drawFlower(this.opacity);
    ctx.restore();
  }
}

/* =====================================================
   PETAL
===================================================== */
class Petal {
  constructor() {
    this.reset(true);
  }

  reset(randomY = false) {
    this.x = Math.random() * innerWidth;
    this.y = randomY ? Math.random() * innerHeight : -30;
    this.size = Math.random() * 0.5 + 0.4;
    this.speedY = Math.random() * 0.5 + PETAL_FALL_SPEED;
    this.speedX = Math.random() * 0.6 - 0.3;
    this.rotation = Math.random() * Math.PI;
    this.rotationSpeed = Math.random() * 0.02 - 0.01;
    this.opacity = Math.random() * 0.4 + 0.5;
  }

  update() {
    this.y += this.speedY - Math.abs(wind) * 0.1;
    this.x += this.speedX + wind;
    this.rotation += this.rotationSpeed + wind * 0.01;

    if (this.y > innerHeight + 40) this.reset();
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.size, this.size);
    drawPetal(this.opacity);
    ctx.restore();
  }
}

/* =====================================================
   FIREFLY
===================================================== */
class Firefly {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * innerWidth;
    this.y = Math.random() * innerHeight;
    this.radius = Math.random() * 2 + 1;
    this.speedX = Math.random() * 0.3 - 0.15;
    this.speedY = Math.random() * 0.3 - 0.15;
    this.alpha = Math.random();
    this.alphaSpeed = Math.random() * 0.02 + 0.005;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    const moon = getMoon();
    const dx = this.x - moon.x;
    const dy = this.y - moon.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < moon.r) {
      const a = Math.atan2(dy, dx);
      this.x += Math.cos(a) * 1.5;
      this.y += Math.sin(a) * 1.5;
    }

    this.alpha += this.alphaSpeed;
    if (this.alpha > 1 || this.alpha < 0) this.alphaSpeed *= -1;

    if (this.x < 0) this.x = innerWidth;
    if (this.x > innerWidth) this.x = 0;
    if (this.y < 0) this.y = innerHeight;
    if (this.y > innerHeight) this.y = 0;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,180,${this.alpha})`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255,255,200,0.8)";
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/* =====================================================
   SHOOTING STAR
===================================================== */
class ShootingStar {
  constructor() {
    this.x = Math.random() * innerWidth * 0.6;
    this.y = Math.random() * innerHeight * 0.4;
    this.len = Math.random() * 200 + 150;
    this.speed = Math.random() * 6 + 4;
    this.angle = Math.PI / 4;
    this.alpha = 1;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.alpha -= 0.015;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x - Math.cos(this.angle) * this.len,
      this.y - Math.sin(this.angle) * this.len
    );
    ctx.stroke();
    ctx.restore();
  }
}

/* =====================================================
   DRAW SHAPES (THEME AWARE)
===================================================== */
function drawFlower(opacity) {
  const PETALS = 5;
  const RADIUS = 15;

  for (let i = 0; i < PETALS; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 / PETALS) * i);
    ctx.translate(0, -RADIUS);
    drawPetal(opacity);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,200,120,${opacity})`;
  ctx.fill();
}

function drawPetal(opacity) {
  const petalRGB = getCSSVar("--petal-color") || "255,183,197";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-6, -8, -10, -2, 0, 12);
  ctx.bezierCurveTo(10, -2, 6, -8, 0, 0);
  ctx.closePath();
  ctx.fillStyle = `rgba(${petalRGB},${opacity})`;
  ctx.fill();
}

/* =====================================================
   CREATE OBJECTS
===================================================== */
for (let i = 0; i < FLOWER_COUNT; i++) flowers.push(new Flower());
for (let i = 0; i < PETAL_COUNT; i++) petals.push(new Petal());
for (let i = 0; i < FIREFLY_COUNT; i++) fireflies.push(new Firefly());

/* =====================================================
   WIND
===================================================== */
addEventListener("mousemove", e => {
  wind += (e.clientX - innerWidth / 2) * WIND_STRENGTH * 0.001;
});

addEventListener("touchmove", e => {
  wind += (e.touches[0].clientX - innerWidth / 2) * WIND_STRENGTH * 0.001;
});

/* =====================================================
   MUSIC (WITH localStorage)
===================================================== */
const music = document.getElementById("bg-music");
const toggle = document.getElementById("music-toggle");

const MUSIC_KEY = "wedding-music-muted";
let musicStarted = false;

// Restore saved mute state
const isMuted = localStorage.getItem(MUSIC_KEY) === "true";

if (music) {
  music.volume = 0.4;
  music.muted = isMuted;
}

if (toggle) {
  toggle.textContent = isMuted ? "🔇" : "🔊";
}

// Start music on first user interaction (browser policy)
function startMusic() {
  if (!music || musicStarted) return;

  music.play().catch(() => { });
  musicStarted = true;
}

toggle?.addEventListener("click", () => {
  if (!music) return;

  music.muted = !music.muted;
  toggle.textContent = music.muted ? "🔇" : "🔊";

  // Save state
  localStorage.setItem(MUSIC_KEY, music.muted);
});

window.addEventListener("click", startMusic, { once: true });
window.addEventListener("touchstart", startMusic, { once: true });


/* =====================================================
   THEME SWITCHER + localStorage
===================================================== */
const THEME_KEY = "wedding-theme";
const savedTheme = localStorage.getItem(THEME_KEY) || "moon";
document.body.dataset.theme = savedTheme;

document.querySelectorAll(".theme-switcher button").forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  });
});

/* ===============================
   SCROLL REVEAL (FIXED)
================================ */
const revealElements = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.4 }
);

revealElements.forEach(el => observer.observe(el));


/* =====================================================
   ANIMATION LOOP
===================================================== */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  wind *= WIND_DECAY;

  const glow = Math.min(Math.abs(wind) * 220, 35);
  const glowRGB = getCSSVar("--glow-color") || "255,200,220";

  if (title) {
    title.style.textShadow = `
      0 0 ${glow}px rgba(${glowRGB},0.9),
      0 0 ${glow * 2}px rgba(${glowRGB},0.6),
      0 0 ${glow * 3}px rgba(${glowRGB},0.4)
    `;
  }

  if (Math.random() < SHOOTING_STAR_CHANCE) {
    shootingStars.push(new ShootingStar());
  }

  shootingStars.forEach((s, i) => {
    s.update();
    s.draw();
    if (s.alpha <= 0) shootingStars.splice(i, 1);
  });

  fireflies.forEach(f => {
    f.update();
    f.draw();
  });

  flowers.forEach(f => {
    f.update();
    f.draw();
  });

  petals.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}

animate();

/* ===============================
   LIGHTBOX
================================ */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const lightboxClose = document.querySelector(".lightbox-close");

document.querySelectorAll(".photos-grid img").forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src;
    lightbox.classList.add("show");
  });
});

// Close on click outside image
lightbox.addEventListener("click", e => {
  if (e.target === lightbox || e.target === lightboxClose) {
    lightbox.classList.remove("show");
  }
});

// Close on ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    lightbox.classList.remove("show");
  }
});


/* ===============================
   COMPASS → MAP TOGGLE
================================ */
const mapToggle = document.querySelector(".map-toggle");
const compassView = document.querySelector(".compass-view");
const closeMap = document.querySelector(".map-close");
const butterflyBox = document.querySelector(".butterflies");

function createButterflies() {
  const container = document.querySelector(".butterflies");
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  for (let i = 0; i < 12; i++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.innerHTML = `<use href="#butterfly-svg"></use>`;

    // Start at center
    svg.style.left = "50%";
    svg.style.top = "50%";

    // Random edge destination
    const edge = Math.floor(Math.random() * 4);
    let x, y;

    switch (edge) {
      case 0: // top
        x = Math.random() * vw - vw / 2;
        y = -vh / 2 - 150;
        break;
      case 1: // right
        x = vw / 2 + 150;
        y = Math.random() * vh - vh / 2;
        break;
      case 2: // bottom
        x = Math.random() * vw - vw / 2;
        y = vh / 2 + 150;
        break;
      case 3: // left
        x = -vw / 2 - 150;
        y = Math.random() * vh - vh / 2;
        break;
    }

    svg.style.setProperty("--x", `${x}px`);
    svg.style.setProperty("--y", `${y}px`);

    // Stagger butterflies slightly
    setTimeout(() => {
      container.appendChild(svg);
      setTimeout(() => svg.remove(), 5200);
    }, i * 120);
  }
}

compassView.addEventListener("click", () => {
  createButterflies(); // 🦋 magic moment
  mapToggle.classList.add("show-map");
});


closeMap.addEventListener("click", () => {
  mapToggle.classList.remove("show-map");
});


/* ===============================
   WEDDING COUNTDOWN
================================ */

const weddingDate = new Date("2026-12-12T18:00:00+05:30"); // 6:00 PM IST

const daysEl = document.getElementById("cd-days");
const hoursEl = document.getElementById("cd-hours");
const minutesEl = document.getElementById("cd-minutes");
const secondsEl = document.getElementById("cd-seconds");

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  daysEl.textContent = String(days).padStart(2, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

// Initial call
updateCountdown();

// Update every second
setInterval(updateCountdown, 1000);


/* ===============================
   CURSOR GLOW TRACKING
================================ */
const cursorGlow = document.querySelector(".cursor-glow");
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursorGlow() {
  glowX += (mouseX - glowX) * 0.12;
  glowY += (mouseY - glowY) * 0.12;

  if (cursorGlow) {
    cursorGlow.style.left = glowX + "px";
    cursorGlow.style.top = glowY + "px";
  }

  requestAnimationFrame(animateCursorGlow);
}
animateCursorGlow();


/* =====================================================
   THREE.JS SKY LANTERNS (FOOTER)
 ===================================================== */
(function initLanterns() {
  const canvas = document.getElementById("lanterns-canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 30;

  const lanterns = [];
  const lanternCount = window.innerWidth < 768 ? 25 : 35;

  // Geometry: A simple lantern shape (tapered cylinder)
  const geometry = new THREE.CylinderGeometry(0.8, 0.6, 1.4, 8);

  // Custom Shader for Gradient Effect
  const lanternVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const lanternFragmentShader = `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      // Create high intensity at the bottom (vUv.y is 0 at the bottom, 1 at the top in CylinderGeo)
      float intensity = mix(1.0, 0.2, vUv.y);
      gl_FragColor = vec4(uColor * (0.6 + intensity * 0.4), 0.9);
    }
  `;

  function createLantern(isInitial = false) {
    const themeColor = getCSSVar("--accent-color") || "#ffd6e3";

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(themeColor) }
      },
      vertexShader: lanternVertexShader,
      fragmentShader: lanternFragmentShader,
      transparent: true
    });

    const lantern = new THREE.Mesh(geometry, material);

    // Dynamic X range based on screen width
    const rangeX = window.innerWidth < 768 ? 20 : 50;
    lantern.position.x = (Math.random() - 0.5) * rangeX;
    // Randomize initial vertical spread to avoid "spawn waves"
    lantern.position.y = isInitial ? (Math.random() - 0.5) * 60 : -35 - (Math.random() * 10);
    lantern.position.z = (Math.random() - 0.5) * 20;

    // Movement properties
    lantern.userData = {
      speedY: Math.random() * 0.015 + 0.008,
      swing: Math.random() * 0.01,
      swingOffset: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.003
    };

    // Smaller, intense core light at the bottom
    const coreGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -0.55; // Near the bottom
    lantern.add(core);

    // Soft outer glow at the bottom
    const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = -0.55;
    lantern.add(glow);

    scene.add(lantern);
    return lantern;
  }

  // Initial batch
  for (let i = 0; i < lanternCount; i++) {
    lanterns.push(createLantern(true));
  }

  function resize() {
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  function animate() {
    requestAnimationFrame(animate);

    const themeColor = getCSSVar("--accent-color") || "#ffd6e3";
    const colorObj = new THREE.Color(themeColor);
    const time = Date.now() * 0.001;

    lanterns.forEach((l, i) => {
      l.position.y += l.userData.speedY;
      l.position.x += Math.sin(time + l.userData.swingOffset) * l.userData.swing;
      l.rotation.y += l.userData.rotationSpeed;

      // Update theme color and add slight flicker
      const flicker = 0.95 + Math.sin(time * 10 + i) * 0.05;

      // Update Uniform for Shader
      l.material.uniforms.uColor.value.lerp(colorObj, 0.1);

      // Update core and glow
      const core = l.children[0];
      const glow = l.children[1];

      glow.material.color.lerp(colorObj, 0.1);
      glow.material.opacity = (0.3 + Math.sin(time * 8 + i) * 0.1) * flicker;
      core.material.opacity = (0.8 + Math.sin(time * 12 + i) * 0.1) * flicker;

      // Reset when out of view
      if (l.position.y > 35) {
        const rangeX = window.innerWidth < 768 ? 20 : 50;
        l.position.y = -35 - (Math.random() * 15); // Stagger the restart
        l.position.x = (Math.random() - 0.5) * rangeX;
      }
    });

    renderer.render(scene, camera);
  }

  animate();
})();


/* =====================================================
   THREE.JS MUSIC BOX & ROTATING COUPLE (INFO SECTION)
 ===================================================== */
(function initMusicBox() {
  const canvas = document.getElementById("music-box-canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(12, 10, 18);
  camera.lookAt(0, 2, 0);

  const group = new THREE.Group();
  scene.add(group);

  const themeColor = getCSSVar("--accent-color") || "#ffd6e3";
  const accentColor = new THREE.Color(themeColor);

  // --- Music Box Body ---
  const boxGeo = new THREE.BoxGeometry(7, 3, 5);
  const boxMat = new THREE.MeshPhongMaterial({
    color: 0x5d4037, // Rich wood color
    shininess: 30
  });
  const musicBox = new THREE.Mesh(boxGeo, boxMat);
  musicBox.position.y = 1.5;
  group.add(musicBox);

  // Decorative Lid (Open)
  const lidGeo = new THREE.BoxGeometry(7, 0.5, 5);
  const lid = new THREE.Mesh(lidGeo, boxMat);
  lid.position.set(0, 3.2, -2.5);
  lid.rotation.x = -Math.PI / 2.5;
  group.add(lid);

  // --- Rotating Disk ---
  const diskGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.2, 32);
  const diskMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.position.y = 3.1;
  group.add(disk);

  // --- The Couple (Using actual image) ---
  const coupleGroup = new THREE.Group();
  disk.add(coupleGroup);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('assets/images/Couple_removebg.png', (texture) => {
    const coupleMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const coupleSprite = new THREE.Sprite(coupleMat);
    coupleSprite.scale.set(4.5, 5.5, 1);
    coupleSprite.position.y = 2.8;
    coupleGroup.add(coupleSprite);
  });

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(accentColor, 1.5, 50);
  pointLight.position.set(5, 15, 10);
  scene.add(pointLight);

  // --- Streaming Music Notes ---
  const notes = [];
  const noteTypes = ["♪", "♫", "♬"];

  function createNote() {
    const noteCanvas = document.createElement("canvas");
    noteCanvas.width = 64;
    noteCanvas.height = 64;
    const ctx = noteCanvas.getContext("2d");
    const currentTheme = getCSSVar("--accent-color") || "#ffd6e3";
    ctx.fillStyle = currentTheme;
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(noteTypes[Math.floor(Math.random() * noteTypes.length)], 32, 32);

    const texture = new THREE.CanvasTexture(noteCanvas);
    const noteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const note = new THREE.Sprite(noteMat);

    // Spawn from the disk area
    note.position.set(0, 4, 0);
    note.scale.set(0, 0, 0);

    // SLOW ROMANTIC STREAM - Moving RIGHT (Positive X)
    note.userData = {
      velocity: new THREE.Vector3(
        (Math.random() * 0.05) + 0.08, // Significantly move Right
        (Math.random() * 0.02) + 0.01, // Slight move Up
        (Math.random() - 0.5) * 0.05  // Slight Z wiggle
      ),
      life: 1.0,
      scale: Math.random() * 1.5 + 1.2
    };

    scene.add(note);
    notes.push(note);
  }

  function resize() {
    const parent = canvas.parentElement;
    renderer.setSize(parent.clientWidth, parent.clientHeight, false);
    camera.aspect = parent.clientWidth / parent.clientHeight;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  let lastNoteTime = 0;
  function animateMusicBox() {
    requestAnimationFrame(animateMusicBox);

    const time = Date.now() * 0.001;

    // Slow Romantic Rotation
    disk.rotation.y += 0.012;

    // Gentle bobbing for the whole disk
    coupleGroup.position.y = Math.sin(time * 1.5) * 0.08;

    // Theme color sync
    const currentThemeColor = getCSSVar("--accent-color") || "#ffd6e3";
    accentColor.set(currentThemeColor);
    pointLight.color.lerp(accentColor, 0.1);

    // Stream notes
    if (Date.now() - lastNoteTime > 800) {
      createNote();
      lastNoteTime = Date.now();
    }

    // Update notes
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      n.position.add(n.userData.velocity);
      n.userData.life -= 0.003; // Slow fade for long stream

      // Grow from box
      if (n.userData.life > 0.85) {
        const s = (1 - (n.userData.life - 0.85) / 0.15) * n.userData.scale;
        n.scale.set(s, s, s);
      } else {
        n.material.opacity = n.userData.life / 0.85;
      }

      // Wiggle horizontally as they stream right
      n.position.y += Math.sin(time * 2 + i) * 0.01;
      n.position.z += Math.cos(time * 2 + i) * 0.01;

      if (n.userData.life <= 0) {
        scene.remove(n);
        notes.splice(i, 1);
      }
    }

    // Subtle box tilt
    group.rotation.x = Math.sin(time * 0.3) * 0.05;
    group.rotation.z = Math.cos(time * 0.3) * 0.05;

    renderer.render(scene, camera);
  }

  animateMusicBox();
})();
