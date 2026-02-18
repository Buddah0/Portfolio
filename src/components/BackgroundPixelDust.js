import { animate, utils } from 'animejs';

/**
 * BackgroundPixelDust
 * A subtle, organic persistent background effect using HTML5 Canvas & Anime.js.
 * Features:
 * - Tiny drifting square particles
 * - randomized "breathing" (opacity/scale)
 * - Occasional "AI Signal" sweep (diagonal monochrome boost)
 * - Respects prefers-reduced-motion
 * - Pauses on tab inactivity to save battery/cycles
 */
export const initPixelDust = (containerSelector) => {
    const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Container
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`PixelDust: Container ${containerSelector} not found.`);
        return;
    }

    // --- Configuration ---
    const PARTICLE_COUNT = 70;
    const CANVAS_Z_INDEX = 0; // Behind content (which should be > 0)

    // Colors (Monochrome/Base)
    const BASE_COLOR = { r: 255, g: 255, b: 255 };

    // Create Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Style Canvas
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = CANVAS_Z_INDEX;

    // Clear any existing children (e.g. blobs)
    container.innerHTML = '';
    container.appendChild(canvas);

    // State
    let width, height;
    let particles = [];
    let signalTimer = null;
    let rafId = null;
    let isHidden = false;

    // Animation Instances
    let driftAnim = null;
    let breatheAnim = null;
    let signalAnim = null;

    // --- Particle Factory ---
    const createParticles = () => {
        const p = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            p.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 1 + Math.random() * 1.5, // 1px to 2.5px

                // Opacity components
                baseAlpha: 0.05 + Math.random() * 0.07, // 0.05 - 0.12
                breatheAlpha: 0, // Delta from breathing
                signalAlpha: 0,  // Delta from signal sweep

                // Scale components
                baseScale: 1,
                breatheScale: 0, // Delta
                signalScale: 0,  // Delta
            });
        }
        return p;
    };

    // --- Resize Handler ---
    const handleResize = () => {
        width = container.clientWidth;
        height = container.clientHeight;

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        if (particles.length === 0) {
            particles = createParticles();
            if (!PREFERS_REDUCED_MOTION) startAnimations();
            else drawStatic();
        }
    };

    // --- Rendering ---
    const draw = () => {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            // Composition
            const totalAlpha = Math.max(0, Math.min(1, p.baseAlpha + p.breatheAlpha + p.signalAlpha));
            const totalScale = p.baseScale + p.breatheScale + p.signalScale;

            if (totalAlpha < 0.01) return; // Skip invisible

            ctx.fillStyle = `rgba(${BASE_COLOR.r}, ${BASE_COLOR.g}, ${BASE_COLOR.b}, ${totalAlpha})`;

            // Draw centered rect
            const currentSize = p.size * totalScale;
            ctx.fillRect(p.x - currentSize / 2, p.y - currentSize / 2, currentSize, currentSize);
        });
    };

    const loop = () => {
        if (isHidden) return;
        draw();
        rafId = requestAnimationFrame(loop);
    };

    const drawStatic = () => {
        draw();
    };

    // --- Animation Logic ---

    const startAnimations = () => {
        // 1. DRIFT: Continuous slow movement
        driftAnim = animate(particles, {
            x: () => `+=${utils.random(-25, 25)}`,
            y: () => `+=${utils.random(-25, 25)}`,
            duration: () => utils.random(4000, 10000),
            ease: 'linear',
            loop: true,
            alternate: true,
        });

        // 2. BREATHING: Subtle opacity/scale flux
        breatheAnim = animate(particles, {
            breatheAlpha: () => utils.random(-0.02, 0.03),
            breatheScale: () => utils.random(0, 0.4),
            duration: () => utils.random(12000, 28000),
            delay: () => utils.random(0, 10000),
            ease: 'inOutSine',
            loop: true,
            alternate: true,
        });

        // 3. START LOOP
        if (!rafId) loop();

        // 4. SCHEDULE SIGNALS
        scheduleSignal();
    };

    // --- A.I. Signal Sweep ---
    const triggerSignal = () => {
        if (isHidden || PREFERS_REDUCED_MOTION) {
            scheduleSignal();
            return;
        }

        const diagonalMax = width + height;

        signalAnim = animate(particles, {
            signalAlpha: [0, 0.06, 0],
            signalScale: [0, 0.08, 0],
            ease: 'outQuad',
            delay: (p) => {
                const diagonalPos = (p.x + p.y);
                const normalized = diagonalPos / Math.max(diagonalMax, 1);
                return normalized * 1500;
            },
            duration: 1200,
            onComplete: () => {
                scheduleSignal();
            }
        });
    };

    const scheduleSignal = () => {
        const delay = 25000 + Math.random() * 20000;
        if (signalTimer) clearTimeout(signalTimer);
        signalTimer = setTimeout(triggerSignal, delay);
    };

    // --- Lifecycle Hooks ---

    const pause = () => {
        isHidden = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;

        if (driftAnim) driftAnim.pause();
        if (breatheAnim) breatheAnim.pause();
        if (signalAnim) signalAnim.pause();
        if (signalTimer) clearTimeout(signalTimer);
    };

    const resume = () => {
        if (!isHidden) return;
        isHidden = false;

        if (PREFERS_REDUCED_MOTION) {
            drawStatic();
            return;
        }

        if (!rafId) loop();
        if (driftAnim) driftAnim.play();
        if (breatheAnim) breatheAnim.play();

        scheduleSignal();
    };

    const onVisibilityChange = () => {
        if (document.hidden) {
            pause();
        } else {
            resume();
        }
    };

    // --- Init ---

    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
        pause();
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        container.innerHTML = '';
    };
};
