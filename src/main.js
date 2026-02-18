import './styles/main.css';
import { animate } from 'animejs';
import { initPixelDust } from './components/BackgroundPixelDust.js';
import { mountSynthwaveGrid } from './background/synthwaveGrid.js';

// --- Configuration ---
const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SELECTORS = {
  bg: '#bg',
  reveal: '.reveal',
  sections: '.section',
  navLinks: '.nav-link, .brand',
};

// --- Background Animation ---
const initBackground = () => {
  // initPixelDust(SELECTORS.bg); // Disabling old background
  mountSynthwaveGrid();
};

// --- Scroll Reveals ---
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
        const el = entry.target;
        const delay = parseInt(el.dataset.delay, 10) || 0;
        setTimeout(() => {
          el.classList.add('reveal-visible');
        }, delay);
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px',
  });

  targets.forEach(el => observer.observe(el));
};

// --- Hash Nav Shine ---
const initHashNav = () => {
  window.addEventListener('hashchange', () => {
    const id = window.location.hash;
    if (id) {
      const target = document.querySelector(id);
      if (target) {
        target.classList.add('is-targeted');
        setTimeout(() => target.classList.remove('is-targeted'), 1500);
      }
    }
  });
};

// --- Stagger Grid Items ---
const initGrids = () => {
  const cards = document.querySelectorAll('.skill-card, .project-card');
  cards.forEach((card, index) => {
    card.classList.add('reveal');
    card.dataset.delay = (index % 4) * 100;
  });
};

// --- Flip Project Cards ---
const initFlipCards = () => {
  document.querySelectorAll('.project-card').forEach(card => {
    if (!card.querySelector('.card-inner')) return;
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
  });
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initGrids();
  initScrollReveal();
  initFlipCards();
  initBackground();
  initHashNav();
});
