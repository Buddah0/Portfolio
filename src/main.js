// scripts/main.js
import './styles/main.css';
import anime from 'animejs/lib/anime.es.js';

// --- Configuration ---
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SELECTORS = {
  bg: '#bg',
  reveal: '.reveal', // Replaces .fade-in logic
  sections: '.section',
  navLinks: '.nav-link, .brand',
};

// --- Phase 5: Background Animation ---
const initBackground = () => {
  if (PREFERS_REDUCED_MOTION) return;

  const bgContainer = document.querySelector(SELECTORS.bg);
  if (!bgContainer) return;

  // Create blobs
  const colors = ['#00BCD4', '#18FFFF', '#0f1115']; // Cyan, Bright Cyan, Dark
  const numBlobs = 4;

  for (let i = 0; i < numBlobs; i++) {
    const blob = document.createElement('div');
    blob.classList.add('blob');
    // Random initial properties
    const size = anime.random(300, 600);
    Object.assign(blob.style, {
      width: `${size}px`,
      height: `${size}px`,
      background: `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 60%)`,
      left: `${anime.random(-20, 80)}vw`,
      top: `${anime.random(-20, 80)}vh`,
      opacity: anime.random(0.1, 0.3),
    });
    bgContainer.appendChild(blob);

    // Drifting animation
    anime({
      targets: blob,
      translateX: () => anime.random(-150, 150),
      translateY: () => anime.random(-150, 150),
      scale: () => anime.random(0.8, 1.4),
      opacity: () => anime.random(0.1, 0.35),
      easing: 'easeInOutQuad',
      duration: () => anime.random(12000, 24000),
      direction: 'alternate',
      loop: true,
    });
  }
};

// --- Phase 6: Scroll Reveals ---
const initScrollReveal = () => {
  const targets = document.querySelectorAll(SELECTORS.reveal);

  if (PREFERS_REDUCED_MOTION) {
    targets.forEach(el => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate in
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [24, 0],
          easing: 'easeOutCubic', // Crisp, premium feel
          duration: 800,
          delay: entry.target.dataset.delay || 0 // Stagger support
        });
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before full view
  });

  targets.forEach(el => observer.observe(el));
};

// --- Phase 7+: Interactions ---
// Handle "Shine" on hash navigation
const initHashNav = () => {
  window.addEventListener('hashchange', () => {
    const id = window.location.hash;
    if (id) {
      const target = document.querySelector(id);
      if (target) {
        // Add class for CSS animation
        target.classList.add('is-targeted');
        setTimeout(() => target.classList.remove('is-targeted'), 1500); // Remove after animation
      }
    }
  });
};

// --- Stagger Grid Items ---
const initGrids = () => {
  const cards = document.querySelectorAll('.skill-card, .project-card');
  cards.forEach((card, index) => {
    card.classList.add('reveal');
    // Stagger delay based on index within its grid container
    // Simple heuristic: index % 3 * 100ms
    card.dataset.delay = (index % 4) * 100;
  });
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Prepare DOM
  initGrids(); // Add .reveal class to cards

  // 2. Start Systems
  initBackground();
  initScrollReveal();
  initHashNav();
});

// Performance: Pause background when hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // anime.suspendWhenDocumentHidden is true by default, 
    // but explicit pausing of heavy stuff is good practice if needed.
    // Anime.js handles this well automatically usually.
  }
});
