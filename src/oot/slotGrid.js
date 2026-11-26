// Cursor for a screen's item slots: arrow keys move spatially to the nearest slot in that
// direction (slots sit in irregular groups, so DOM order isn't useful), hover moves it too.
// Roving tabindex keeps the whole grid to a single Tab stop.

const DIRS = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

function centre(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Nearest slot in direction [dx, dy]: must lie ahead, inside a ~63° cone around that direction
// (so a slot that is mostly sideways never counts as "down"), scored by distance along the
// direction plus a heavier penalty for drifting sideways.
export function nearest(from, candidates, [dx, dy]) {
  const a = centre(from);
  let best = null;
  let bestScore = Infinity;
  for (const el of candidates) {
    if (el === from) continue;
    const b = centre(el);
    const along = (b.x - a.x) * dx + (b.y - a.y) * dy;
    const across = Math.abs((b.x - a.x) * dy) + Math.abs((b.y - a.y) * dx);
    if (along <= 1 || along < across * 0.5) continue;
    const score = along + across * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  return best;
}

export function initSlotGrid(grid, { onCursor = () => {}, onSelect = () => {}, onBack = () => {}, selector = '.slot:not(.is-locked), .sys-btn' } = {}) {
  const slots = [...grid.querySelectorAll(selector)];
  if (!slots.length) return null;
  let cursor = slots.find((s) => s.hasAttribute('data-cursor-home')) || slots[0];

  function setCursor(slot, { focus = false } = {}) {
    if (!slot) return;
    cursor.classList.remove('is-cursor');
    cursor.tabIndex = -1;
    cursor = slot;
    cursor.classList.add('is-cursor');
    cursor.tabIndex = 0;
    slots.forEach((s) => s.toggleAttribute('data-cursor-home', s === cursor));
    if (focus) cursor.focus({ preventScroll: true });
    onCursor(cursor);
  }

  slots.forEach((slot) => {
    slot.tabIndex = -1;
    slot.addEventListener('focus', () => { if (slot !== cursor) setCursor(slot); });
    slot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setCursor(slot); });
    slot.addEventListener('click', () => { setCursor(slot); onSelect(slot); });
  });

  grid.addEventListener('keydown', (e) => {
    if (!slots.includes(e.target)) return;
    if (e.key in DIRS) {
      e.preventDefault();
      setCursor(nearest(cursor, slots, DIRS[e.key]), { focus: true });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBack(cursor);
    }
  });

  setCursor(cursor);
  return { setCursor, get cursor() { return cursor; }, slots };
}
