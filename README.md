# Portfolio — Matthew Bess

> Software Engineer · AI & Machine Learning
> Live: [buddah0.github.io/Portfolio](https://buddah0.github.io/Portfolio/)

A developer portfolio styled as a game pause menu, inspired by the menus of the 2026 Nintendo Switch 2 remake of *The Legend of Zelda: Ocarina of Time*. Projects, skills, background and contact details live in item slots you browse with a cursor, just like an inventory screen. Every piece of artwork is original (generated SVG and CSS), and all content stays in plain, accessible HTML.

> Fan homage only. Not affiliated with or endorsed by Nintendo. No Nintendo artwork, logos, characters or fonts are used.

---

## Screens

| Screen | Portfolio content | Deep links |
| --- | --- | --- |
| **Title screen** | Landing page: *Continue* (projects), *New Game* (about me), *Contact* | `/Portfolio/` |
| **Collection** | About me: intro, years coding, degrees, learning journey | `#collection`, `#about` |
| **Equipment** | Skills around a portrait: languages, web, tools, plus current focus areas | `#equipment`, `#skills` |
| **Items** | Projects with full write-ups and repo links; empty slots for what comes next | `#items`, `#projects` |
| **System** | GitHub, LinkedIn, Instagram, a "Basic Controls" card, back to the title | `#system`, `#contact` |

A link with a screen hash skips the title screen. The address bar follows the active screen, so any view can be shared or bookmarked. Gold slots mark what's equipped or in progress.

## Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Switch screens (L / R) | `Q` / `E` or `PageUp` / `PageDown`; `←` `→` `Home` `End` on the tab bar | Click a tab, the **L** / **R** buttons, or the page arrows |
| Move the cursor | Arrow keys (moves to the nearest slot in that direction) | Hover |
| Select | `Enter` / `Space` | Click / tap |
| Back | `Esc` (detail → slot → tab bar) | **Back** button on phone sheets |
| Rotate item art | — | Drag the large icon in the detail pane |

The hint bar at the bottom right shows keyboard or mouse glyphs depending on what you used last.

---

## Technology

| Layer | Technology | Why |
| --- | --- | --- |
| Build | [Vite 6](https://vite.dev/) | Instant HMR, hashed asset output, `base` path for GitHub Pages |
| Language | Vanilla ES modules | No framework; small, readable components |
| Animation | [Anime.js v4](https://animejs.com/) | Screen transitions and title fade; skipped under reduced motion |
| Styling | CSS custom properties, `clip-path`, `mask`, blend modes | Slot shapes, cloth textures and ornaments without images |
| Artwork | Generated SVG + `feTurbulence` noise | Original ornaments, woven-cloth texture, title landscape |
| Font | [Ysabeau Office](https://fonts.google.com/specimen/Ysabeau+Office) (SIL OFL) | Closest free match to the menu typeface, chosen by side-by-side comparison |
| Icons | [Font Awesome Free](https://fontawesome.com/) | Item and skill glyphs, rendered with a metallic gradient |
| Tests | [Playwright](https://playwright.dev/) + [axe-core](https://github.com/dequelabs/axe-core) | Behaviour, accessibility, reduced motion, phone layout, visual baseline |
| Deploy | GitHub Actions → GitHub Pages | Build on every push to `main` |

## How it works

### A scaled 16:9 stage

The menu is laid out on a 1920×1080 design canvas. One custom property drives every size:

```css
--px: calc(min(100vw, 100dvh * 16 / 9) / 1920);  /* 1 design px */
```

Every length is written as `calc(N * var(--px))`, so the whole menu scales with the window and stays letterboxed at 16:9, like a game.

### Slot boards

Slots carry their position from the reference layout as inline custom properties (`--x`, `--y`, `--w`, `--h`). A board offsets them by its own origin (`--ox`, `--oy`). Each slot is a button with two clipped layers (rim and well) cut to its shape with `clip-path`. The cursor glow is a `drop-shadow` on the unclipped button, so it follows the shape instead of being clipped away.

### Portrait / phone layout

Below a 1:1 aspect ratio, `mobile.css` switches `--px` to an 860 px design column. Boards keep their exact game layout by **redefining `--px` on the board itself**, which scales the whole subtree. Detail panes become a bottom sheet with a Back button, Equipment pins the portrait oval above a three-column grid, and System stacks its menu over the card.

### Components (`src/oot/`)

| Module | Responsibility |
| --- | --- |
| `tabs.js` | ARIA tabs (automatic activation) plus L / R stepping; fires `screenchange` |
| `slotGrid.js` | Cursor with roving `tabindex`; arrow keys pick the nearest slot inside a direction cone |
| `detailPane.js` | Shows the article for the slot under the cursor; drag-to-rotate art |
| `prompts.js` | Context-sensitive hint bar; tracks keyboard vs. pointer input |
| `titleScreen.js` | Title screen, hash routing, `inert` menu while the title is open |

### Content and accessibility

- All content is ordinary HTML in `index.html`; JavaScript only adds the cursor, tabs and panes.
- Each grid is a single Tab stop; locked slots are decorative (`aria-hidden`) and skipped.
- `prefers-reduced-motion` removes every pulse, drift, slide and fade.
- axe reports no serious or critical issues on any screen, on desktop or phone.

## Editing content

- **Add a project:** in the Items section of `index.html`, swap a locked `<span class="slot is-locked">` for a `<button class="slot">` with an icon and `aria-controls="proj-your-id"`. Then add a matching `<article class="detail__item" id="proj-your-id" hidden>` to the Items detail pane. Use `is-equipped` for in-progress work, and update the counter in the header. For more than one link (e.g. Live Site + View Repo), wrap the `.detail__link`s in a `<div class="detail__links">`; Select jumps to the first one.
- **Skills, about-me entries and contact links** follow the same slot + article pairing in their own screens.
- The years-coding count is computed from `data-years-since="2019"`.

---

## Local development

```bash
npm install                     # dependencies
npx playwright install chromium # first time only, for the tests

npm run dev       # dev server → http://localhost:5173/Portfolio/
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm test          # all Playwright tests (desktop + phone)
```

The Items screen has an approved screenshot baseline. After a deliberate visual change, refresh it with:

```bash
npx playwright test tests/visual.spec.js --update-snapshots
```

## Deployment

The site deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

**Pipeline:** `push to main` → `npm ci` → `npm run build` → upload `dist/` as a Pages artifact → deploy

Live URL: `https://buddah0.github.io/Portfolio/` (Vite `base` is `/Portfolio/`).

### Custom domain (future)

1. Add a `CNAME` file to `public/` containing the bare domain (e.g. `matthew.dev`).
2. In `vite.config.js`, change `base` from `'/Portfolio/'` to `'/'`.
3. Configure DNS: `A` records to the GitHub Pages IPs, or a `CNAME` to `buddah0.github.io`.
4. Enable "Enforce HTTPS" in repository Settings → Pages.

---

## Project structure

```text
.
├── .github/workflows/deploy.yml    # CI/CD: build + GitHub Pages deployment
├── public/
│   └── Update_Portrait.jpg         # Portrait shown on the Equipment screen
├── src/
│   ├── main.js                     # Entry: wires tabs, slot grids, panes, prompts, title screen
│   ├── oot/                        # Menu behaviour (see "Components")
│   ├── styles/oot/
│   │   ├── tokens.css              # Palette, type, motion tokens, the --px scale
│   │   ├── base.css                # Stage + screen frame
│   │   ├── textures.css            # Cloth textures, ornament rule, header band
│   │   ├── hud.css                 # Hearts, magic bar, tabs, counter
│   │   ├── slots.css               # Slot shapes and states (cursor, equipped, locked)
│   │   ├── detail.css              # Detail pane + hint bar
│   │   ├── items.css / equipment.css / collection.css / system.css / title.css
│   │   └── mobile.css              # Portrait / phone layout
│   └── assets/oot/                 # Original SVG artwork (header ornaments, vines, heart, landscape)
├── tests/                          # Playwright + axe specs, visual baseline
├── index.html                      # All content and markup
├── playwright.config.js            # Desktop (1920×1080) and phone (Pixel 7) projects
├── vite.config.js                  # Base path for GitHub Pages
└── package.json
```

Legacy files from the previous synthwave design (`src/background/synthwaveGrid.js`, `src/components/BackgroundPixelDust.js`, `src/styles/main.css`) are no longer imported.

## Credits

- Menu design inspired by *The Legend of Zelda: Ocarina of Time* (Nintendo, 2026). All artwork in this repository is original.
- [Ysabeau Office](https://fonts.google.com/specimen/Ysabeau+Office) by Christian Thalmann, SIL Open Font License.
- [Font Awesome Free](https://fontawesome.com/license/free) icons, CC BY 4.0.
- Claude mark from [Simple Icons](https://simpleicons.org/?q=claude) (CC0 SVG data). Claude is a trademark of Anthropic.
- [Anime.js](https://animejs.com/), MIT License.

## License

MIT © 2025 Matthew Bess
