// Title screen + hash routing. A link with a screen hash (#projects, #skills, #about, #contact, or the
// screen ids) skips the title; otherwise the title shows first. The menu behind it is inert meanwhile.
import { animate } from 'animejs';
import { initSlotGrid } from './slotGrid.js';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

export const ROUTES = {
  items: 'items', projects: 'items',
  equipment: 'equipment', skills: 'equipment',
  collection: 'collection', about: 'collection',
  system: 'system', contact: 'system',
};

const routeFromHash = () => ROUTES[decodeURIComponent(location.hash.slice(1)).toLowerCase()];

export function initTitleScreen({ title, gated, tabs, screenIds }) {
  const caption = title.querySelector('.title-caption');
  const menu = initSlotGrid(title.querySelector('.title-menu'), {
    selector: '.title-menu__item',
    onCursor: (item) => { caption.textContent = item.dataset.caption || ''; },
    onSelect: (item) => enter(item.dataset.target),
  });

  const setHash = (hash) => history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);

  // Fade only when returning from the menu (a cross-fade); on first load the title is already painted.
  function show({ fade = true } = {}) {
    title.hidden = false;
    gated.forEach((el) => { el.inert = true; });
    setHash('');
    menu.cursor.focus({ preventScroll: true });
    if (fade && !REDUCED_MOTION.matches) animate(title, { opacity: [0, 1], duration: 400, ease: 'outQuad' });
  }

  function enter(screen, { focus = true } = {}) {
    const index = screenIds.indexOf(screen);
    if (index < 0) return;
    title.hidden = true;
    gated.forEach((el) => { el.inert = false; });
    tabs.select(index, { focus: focus ? 'panel' : 'none' });
    setHash(screen);
  }

  // Keep the address bar in step with the screen, so it can be shared or bookmarked.
  document.addEventListener('screenchange', (e) => {
    if (title.hidden) setHash(e.detail.id.replace(/^panel-/, ''));
  });
  window.addEventListener('hashchange', () => {
    const route = routeFromHash();
    if (route) enter(route);
  });

  const route = routeFromHash();
  if (route) enter(route, { focus: false });
  else show({ fade: false });
  document.documentElement.classList.remove('show-title');

  return { show, enter, get open() { return !title.hidden; } };
}
