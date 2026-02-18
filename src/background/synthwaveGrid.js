import { animate, engine } from 'animejs';

// --- Dev Instrumentation (set PERF_LOGGING = true locally to measure render cost) ---
const PERF_LOGGING = false;
let _pf = 0, _pt = 0, _pw = 0; // frameCount, totalMs, worstMs

const CONFIG = {
    colors: {
        skyTop: '#0f1115',
        skyBottom: '#2a1b3d',
        grid: '#00BCD4',
        gridGlow: '#18FFFF',
        sun: '#ff0055',
        horizonHaze: 'rgba(255, 0, 85, 0.4)'
    },
    gridSize: 40,
    fov: 600,
    horizonY: 0.5
};

let canvas, ctx;
let width, height;
let animationId;
let stars = [];
let lastTime = 0;
const SCROLL_SPEED = 40; // pixels per second
const TARGET_FPS = 30;
const FRAME_MIN_TIME = 1000 / TARGET_FPS; // ~33.33 ms

// Resize debounce
let resizeTimeout = null;
const debouncedResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 100);
};

// Tab-visibility pause/resume
const handleVisibilityChange = () => {
    if (document.hidden) {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    } else {
        lastTime = 0; // prevent delta spike after long pause
        if (!animationId) animationId = requestAnimationFrame(animateLoop);
    }
};

// The state object we will animate
const state = {
    scrollZ: 0,    // Moves grid towards camera
    driftX: 0,     // Subtle horizontal drift
    glow: 0,       // Pulsing glow opacity
    scanlineY: 0,  // Scanline position
    twinkle: 0     // Global twinkle phase
};

// --- Cached Gradients (rebuilt only on resize, not per-frame) ---
let cachedSkyGrad = null;
let cachedSunGlow = null;
let cachedFloorGrad = null;
let cachedVignetteGrad = null;

// --- Helpers ---
function initStars() {
    stars = [];
    const count = Math.floor((window.innerWidth * window.innerHeight) / 3000);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random() * CONFIG.horizonY, // Only in sky
            size: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.7 + 0.3,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

function buildCachedGradients() {
    if (!ctx) return;
    const horizonLine = height * CONFIG.horizonY;
    const cx = width * 0.35;

    cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, horizonLine);
    cachedSkyGrad.addColorStop(0, CONFIG.colors.skyTop);
    cachedSkyGrad.addColorStop(1, CONFIG.colors.skyBottom);

    const glowRadius = width * 0.5;
    cachedSunGlow = ctx.createRadialGradient(cx, horizonLine, 0, cx, horizonLine, glowRadius);
    cachedSunGlow.addColorStop(0, CONFIG.colors.horizonHaze);
    cachedSunGlow.addColorStop(0.4, 'rgba(0, 188, 212, 0.1)');
    cachedSunGlow.addColorStop(1, 'rgba(0,0,0,0)');

    cachedFloorGrad = ctx.createLinearGradient(0, horizonLine, 0, height);
    cachedFloorGrad.addColorStop(0, '#1a0b2e');
    cachedFloorGrad.addColorStop(1, '#000000');

    cachedVignetteGrad = ctx.createRadialGradient(cx, height / 2, width * 0.3, cx, height / 2, width * 0.8);
    cachedVignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    cachedVignetteGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
}

function handleResize() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 — avoids 4K meltdown
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    initStars();
    buildCachedGradients();
}

// --- Render ---
function render() {
    if (!ctx) return;

    const horizonLine = height * CONFIG.horizonY;
    const cx = width * 0.35;

    // 1. Sky & Clear
    ctx.fillStyle = cachedSkyGrad;
    ctx.fillRect(0, 0, width, horizonLine);

    // 2. Stars
    ctx.fillStyle = '#FFF';
    stars.forEach(star => {
        // Twinkle calculation using animated state.twinkle + static offset
        const alpha = star.baseAlpha * (0.6 + 0.4 * Math.sin(state.twinkle + star.twinkleOffset));
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 3. Horizon Glow (Sun/Haze)
    ctx.fillStyle = cachedSunGlow;
    ctx.fillRect(0, 0, width, height);

    // 4. Floor (Grid)
    ctx.fillStyle = cachedFloorGrad;
    ctx.fillRect(0, horizonLine, width, height - horizonLine);

    // Grid Settings
    ctx.lineWidth = 1;
    const gridColor = `rgba(0, 188, 212, ${0.3 + state.glow * 0.2})`;
    ctx.strokeStyle = gridColor;
    ctx.shadowBlur = 5;
    ctx.shadowColor = CONFIG.colors.gridGlow;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizonLine, width, height - horizonLine);
    ctx.clip(); // Clip to bottom half

    const FOV = CONFIG.fov;
    const CAM_H = 150;

    // Vertical Lines (Static X, run into distance)
    const numLines = 40;
    for (let i = -numLines; i <= numLines; i++) {
        const wx = i * CONFIG.gridSize * 3;

        const zNear = 10;
        const zFar = 2000;

        const scaleNear = FOV / (FOV + zNear);
        const xNear = cx + wx * scaleNear + state.driftX;

        ctx.beginPath();
        ctx.moveTo(xNear, height);
        ctx.lineTo(cx, horizonLine);
        ctx.stroke();
    }

    // Horizontal Lines (Moving Z)
    const startZ = (state.scrollZ % (CONFIG.gridSize * 2));

    for (let z = 10; z < 2000; z += CONFIG.gridSize * 2) {
        const currentZ = z - startZ;
        if (currentZ < 10) continue;

        const scale = FOV / currentZ;
        const sy = horizonLine + (CAM_H * scale);

        if (sy > height) continue;

        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);

        // Distance fog alpha
        const alpha = Math.max(0, 1 - (currentZ / 1000));
        ctx.globalAlpha = alpha;
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 5. Scanline
    const scanY = state.scanlineY * height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(0, scanY, width, 2);

    // Vignette
    ctx.fillStyle = cachedVignetteGrad;
    ctx.fillRect(0, 0, width, height);
}

// --- Animation Loop ---
function animateLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    // FPS cap: skip draw on frames that arrive too soon
    if (elapsed < FRAME_MIN_TIME) {
        animationId = requestAnimationFrame(animateLoop);
        return;
    }
    const delta = elapsed / 1000; // seconds
    lastTime = timestamp;

    // Manual scroll for perfectly smooth continuous motion
    state.scrollZ = (state.scrollZ + SCROLL_SPEED * delta) % (CONFIG.gridSize * 2);

    engine.update(); // Update Anime.js tweens (glow, scanline, twinkle)

    if (PERF_LOGGING) {
        const t0 = performance.now();
        render();
        const ms = performance.now() - t0;
        _pt += ms; if (ms > _pw) _pw = ms;
        if (++_pf >= 120) {
            console.log(`[synthwave] avg:${(_pt / _pf).toFixed(2)}ms worst:${_pw.toFixed(2)}ms /120f`);
            _pf = _pt = _pw = 0;
        }
    } else {
        render();
    }

    animationId = requestAnimationFrame(animateLoop);
}

// --- Mount/Unmount ---
export const mountSynthwaveGrid = () => {
    if (document.querySelector('.synthwave-canvas')) return;

    canvas = document.createElement('canvas');
    canvas.className = 'synthwave-canvas';
    document.body.appendChild(canvas);

    handleResize();
    window.addEventListener('resize', debouncedResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Must be set BEFORE animate() calls so engine.wake() never starts a competing rAF.
    engine.useDefaultMainLoop = false;

    // Anime.js v4 uses: animate(targets, parameters)
    // NOT the v3 syntax: animate({ targets, ...params })
    if (!prefersReduced) {
        // scrollZ is handled manually in animateLoop for smooth continuous motion

        // 2. Scanline (Infinite)
        animate(state, {
            scanlineY: 1.2,
            duration: 8000,
            easing: 'linear',
            loop: true
        });

        // 3. Glow Pulse & Twinkle
        animate(state, {
            glow: 1,
            twinkle: Math.PI * 2,
            duration: 3000,
            easing: 'linear',
            direction: 'alternate',
            loop: true
        });
    }

    // Start Loop
    animationId = requestAnimationFrame(animateLoop);
};

export const unmountSynthwaveGrid = () => {
    if (animationId) cancelAnimationFrame(animationId);
    clearTimeout(resizeTimeout);
    window.removeEventListener('resize', debouncedResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    engine.remove(state); // Stop animating state
    if (canvas) canvas.remove();
    canvas = null;
    ctx = null;
};
