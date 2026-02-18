# Portfolio — Matthew Bess

> Software Engineer · AI & Machine Learning
> Live: [buddah0.github.io/Portfolio](https://buddah0.github.io/Portfolio/)

A performance-first developer portfolio built with modern vanilla web technologies. Designed to demonstrate engineering discipline through deliberate architecture decisions, render-pipeline optimizations, and automated CI/CD deployment.

---

## Technology Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Build tooling | [Vite 6](https://vitejs.dev/) | Sub-second HMR, ES module-native, optimized production bundling |
| Animation engine | [Anime.js v4](https://animejs.com/) ESM | Tree-shakeable, typed, manual engine control via `engine.update()` |
| Rendering | HTML5 Canvas API | GPU-accelerated rasterization; zero DOM overhead for background FX |
| Styling | CSS3 Custom Properties + Grid/Flexbox | Single source of truth for theming; no runtime CSS-in-JS cost |
| Language | Vanilla ES2022+ (modules) | Zero framework overhead; demonstrates core JS proficiency |
| Deployment | GitHub Actions → GitHub Pages | Reproducible, automated CI/CD; artifact-based Pages deployment |

---

## Architecture Highlights

### Single Animation Loop

The canvas background and Anime.js tween engine share **one** `requestAnimationFrame` loop — no competing RAF sources. `engine.useDefaultMainLoop = false` is set before any `animate()` call to prevent Anime.js from waking its internal loop, and `engine.update()` is called manually each tick.

```text
rAF tick
  ├─ FPS gate (30 fps cap for background)
  ├─ state.scrollZ += SCROLL_SPEED * delta   (manual, frame-rate-independent)
  ├─ engine.update()                          (advances scanline / glow tweens)
  └─ render()                                 (canvas draw — uses cached gradients)
```

### Render-Pipeline Optimizations

- **Gradient caching** — `CanvasGradient` objects (sky, floor, sun glow, vignette) are built once in `handleResize()` and reused every frame, eliminating ~240 GPU allocations/sec at 60 fps
- **DPR cap** — `devicePixelRatio` clamped to `2` to prevent 4K/Retina devices from rasterizing a ×16 canvas backing store
- **FPS cap at 30** — background renders at half the display refresh rate, freeing the compositor thread during scroll
- **Debounced resize** — `handleResize()` deferred 100 ms to coalesce resize bursts into a single canvas + star rebuild
- **Tab-hidden pause** — `visibilitychange` listener cancels the rAF loop when the tab is backgrounded; resumes cleanly with `lastTime = 0` to prevent delta spikes

### Scroll Performance

Scroll reveals use `IntersectionObserver` — no `scroll` event listeners on the main thread. All event listeners that could affect scrolling use `{ passive: true }` where applicable.

### Accessibility

- `prefers-reduced-motion` respected: Anime.js tweens are skipped and the grid scrolls in place
- Semantic HTML5 landmarks (`<header>`, `<nav>`, `<section>`, `<footer>`) with ARIA labels
- Full keyboard navigation; visible focus states
- High-contrast text meeting WCAG AA contrast ratios

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build → dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

The site deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

**Pipeline:** `push to main` → `npm ci` → `npm run build` → upload `dist/` as Pages artifact → deploy

Live URL: `https://buddah0.github.io/Portfolio/`

### Custom Domain (future)

1. Add a `CNAME` file to `public/` containing the bare domain (e.g. `matthew.dev`)
2. Update `vite.config.js`: change `base` from `'/Portfolio/'` to `'/'`
3. Configure DNS: `A` records to GitHub Pages IPs, or `CNAME` to `buddah0.github.io`
4. Enable "Enforce HTTPS" in repository Settings → Pages

---

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build + GitHub Pages deployment
├── public/
│   └── Me2.png                 # Static assets (served at root, copied to dist/)
├── src/
│   ├── background/
│   │   └── synthwaveGrid.js    # Canvas animation: synthwave perspective grid
│   ├── components/
│   │   └── BackgroundPixelDust.js  # Particle system (reserved)
│   ├── styles/
│   │   └── main.css            # Global styles, CSS custom properties, layout
│   └── main.js                 # App entry: orchestrates init, scroll reveals, nav
├── index.html                  # Document entry point
├── vite.config.js              # Vite config: base path for GitHub Pages
└── package.json
```

---

## License

MIT © 2025 Matthew Bess
