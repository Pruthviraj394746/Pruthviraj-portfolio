const TOTAL_FRAMES = 251;
const FRAME_PATH = (index) => `/frames/frame_${String(index).padStart(6, '0')}.png`;

const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const scrollHint = document.getElementById('scroll-hint');

const images = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;

// Native video dimensions (1280x720)
const nativeWidth = 1280;
const nativeHeight = 720;

// High DPI Canvas Scaling & Responsive Layout
function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);

  // Force re-render current frame on resize
  drawFrame(Math.round(currentFrame), true);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Find nearest loaded frame index if requested index is not loaded yet
function getNearestLoadedIndex(targetIdx) {
  if (images[targetIdx] && images[targetIdx].complete) {
    return targetIdx;
  }
  let offset = 1;
  while (targetIdx - offset >= 0 || targetIdx + offset < TOTAL_FRAMES) {
    if (targetIdx - offset >= 0 && images[targetIdx - offset] && images[targetIdx - offset].complete) {
      return targetIdx - offset;
    }
    if (targetIdx + offset < TOTAL_FRAMES && images[targetIdx + offset] && images[targetIdx + offset].complete) {
      return targetIdx + offset;
    }
    offset++;
  }
  return -1;
}

// Draw frame centered while preserving aspect ratio
function drawFrame(index, force = false) {
  const requestedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, index));
  const frameIndex = getNearestLoadedIndex(requestedIndex);

  if (frameIndex === -1) return;
  if (!force && frameIndex === lastRenderedFrame) return;

  const img = images[frameIndex];
  if (!img || !img.complete) return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const scale = Math.min(viewportWidth / nativeWidth, viewportHeight / nativeHeight);
  const drawWidth = nativeWidth * scale;
  const drawHeight = nativeHeight * scale;
  const dx = (viewportWidth - drawWidth) / 2;
  const dy = (viewportHeight - drawHeight) / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  lastRenderedFrame = frameIndex;
}

// Calculate scroll position to target frame accurately across document height
function updateScrollTarget() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const scrolled = Math.max(0, window.scrollY);
  const fraction = Math.max(0, Math.min(1, scrolled / maxScroll));

  targetFrame = fraction * (TOTAL_FRAMES - 1);

  if (scrollHint) {
    if (scrolled > 30) {
      scrollHint.classList.add('fade-out');
    } else {
      scrollHint.classList.remove('fade-out');
    }
  }
}

window.addEventListener('scroll', updateScrollTarget, { passive: true });
window.addEventListener('wheel', updateScrollTarget, { passive: true });
window.addEventListener('resize', updateScrollTarget, { passive: true });

// Physics LERP Loop for Liquid Smooth Animation
function animate() {
  const diff = targetFrame - currentFrame;

  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * 0.14;
  } else {
    currentFrame = targetFrame;
  }

  drawFrame(Math.round(currentFrame));

  requestAnimationFrame(animate);
}

// Preload priority: Frame 1 first, then frames 2-251 silently in background
function preloadFrames() {
  const frame1 = new Image();
  images[0] = frame1;

  frame1.onload = () => {
    loadedCount++;
    drawFrame(0, true);
    loadRemainingFrames();
  };

  frame1.onerror = () => {
    console.warn('Failed to load initial frame frame_000001.png');
    loadedCount++;
    loadRemainingFrames();
  };

  frame1.src = FRAME_PATH(1);
}

function loadRemainingFrames() {
  for (let i = 2; i <= TOTAL_FRAMES; i++) {
    const idx = i - 1;
    const img = new Image();
    images[idx] = img;

    img.onload = () => {
      loadedCount++;
      const activeIdx = Math.round(currentFrame);
      if (activeIdx === idx || getNearestLoadedIndex(activeIdx) === idx) {
        drawFrame(activeIdx, true);
      }
    };

    img.onerror = () => {
      console.warn(`Failed to load frame ${i}`);
      loadedCount++;
    };

    img.src = FRAME_PATH(i);
  }
}

// Start initial loading & animation loop
preloadFrames();
updateScrollTarget();
requestAnimationFrame(animate);
/* =========================================================
   SUBTLE CUSTOM CURSOR
   ========================================================= */

(() => {

  // Don't run on touch devices
  if (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return;
  }

  // Create cursor elements
  const cursor = document.createElement("div");
  const cursorRing = document.createElement("div");

  cursor.className = "custom-cursor";
  cursorRing.className = "custom-cursor-ring";

  document.body.appendChild(cursorRing);
  document.body.appendChild(cursor);


  // Current mouse position
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Ring position
  let ringX = mouseX;
  let ringY = mouseY;


  // Mouse movement
  document.addEventListener("mousemove", (event) => {

    mouseX = event.clientX;
    mouseY = event.clientY;

    // Small dot follows immediately
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;

  });


  // Smooth trailing ring
  function animateCursor() {

    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    requestAnimationFrame(animateCursor);
  }

  animateCursor();


  // Elements that should trigger the larger cursor
  const interactiveElements = document.querySelectorAll(
    "a, button, .project-card, .service-card, .skill-card, input, textarea, select"
  );


  interactiveElements.forEach((element) => {

    element.addEventListener("mouseenter", () => {

      cursor.classList.add("cursor-hover");
      cursorRing.classList.add("cursor-hover");

    });


    element.addEventListener("mouseleave", () => {

      cursor.classList.remove("cursor-hover");
      cursorRing.classList.remove("cursor-hover");

    });

  });


  // Click animation
  document.addEventListener("mousedown", () => {

    cursor.classList.add("cursor-click");
    cursorRing.classList.add("cursor-click");

  });


  document.addEventListener("mouseup", () => {

    cursor.classList.remove("cursor-click");
    cursorRing.classList.remove("cursor-click");

  });


  // Hide when cursor leaves the website
  document.addEventListener("mouseleave", () => {

    cursor.style.opacity = "0";
    cursorRing.style.opacity = "0";

  });


  document.addEventListener("mouseenter", () => {

    cursor.style.opacity = "1";
    cursorRing.style.opacity = "1";

  });

})();
/* =========================================================
   SCROLL REVEAL ANIMATIONS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const revealElements = document.querySelectorAll(
    ".reveal, .reveal-slow, .reveal-stagger"
  );

  // Respect users who prefer reduced motion
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    revealElements.forEach((element) => {
      element.classList.add("revealed");
    });

    return;
  }


  const revealObserver = new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("revealed");

          // Stop observing after the animation happens
          observer.unobserve(entry.target);
        }

      });

    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px"
    }
  );


  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

});