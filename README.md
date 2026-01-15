# Dev-Portfolio

A premium, interactive developer portfolio built with modern web technologies. Features a dark "Electric Cyan" aesthetic, smooth scroll reveals, and audio-reactive design elements.

## 🚀 Technlogy Stack
- **Core**: Semantic HTML5, CSS3 (Variables + Flexbox/Grid), Modern JavaScript (ES6+).
- **Tooling**: [Vite](https://vitejs.dev/) for fast development and asset bundling.
- **Animation**: [Anime.js](https://animejs.com/) for fluid background and scroll interactions.
- **Design**: "Electric Cyan" theme (Dark Mode default) with interactive underline bars and glow effects.

## 🛠️ Setup & Development
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` to view the site.

3. **Build for Production**
   ```bash
   npm run build
   ```
   The output will be in the `dist/` folder, ready for deployment (Vercel, Netlify, GitHub Pages).

## ✨ Features
- **Dynamic Background**: Drifting gradient blobs that respect `prefers-reduced-motion`.
- **Scroll Reveals**: IntersectionObserver-based entry animations for sections and cards.
- **Interactive UI**:
  - Section headings expand and glow on hover/focus.
  - Interactive anchor links with target highlighting.
- **Accessibility**:
  - Full keyboard navigation support.
  - Reduced motion compliance.
  - High contrast text and clear focus states.

## 📂 Project Structure
```
.
├── public/          # Static assets (images, icons)
├── src/
│   ├── styles/      # CSS stylesheets (main.css)
│   └── main.js      # Application logic (animations, interactions)
├── index.html       # Entry point
└── package.json     # Project configuration
```

## 📄 License
MIT License. © 2025 Matthew.
