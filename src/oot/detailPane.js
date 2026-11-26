// Detail pane: shows the article for the slot under the cursor, and lets the art be rotated by dragging.
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initDetailPane(pane) {
  const items = [...pane.querySelectorAll('.detail__item')];

  function show(id) {
    items.forEach((item) => {
      const on = item.id === id;
      item.hidden = !on;
      if (on) resetArt(item.querySelector('.detail__art'));
    });
    return items.find((item) => item.id === id) || null;
  }

  function resetArt(art) {
    if (!art) return;
    art.classList.remove('was-dragged', 'is-dragging');
    const glyph = art.firstElementChild;
    glyph?.style.removeProperty('--rx');
    glyph?.style.removeProperty('--ry');
  }

  // Drag to rotate (pointer + touch). Purely decorative, so it's skipped for reduced motion.
  items.forEach((item) => {
    const art = item.querySelector('.detail__art');
    const glyph = art?.firstElementChild;
    if (!art || !glyph) return;
    let start = null;
    let rx = 0;
    let ry = 0;

    art.addEventListener('pointerdown', (e) => {
      if (REDUCED_MOTION.matches) return;
      start = { x: e.clientX, y: e.clientY, rx, ry };
      art.setPointerCapture(e.pointerId);
      art.classList.add('is-dragging', 'was-dragged');
    });
    art.addEventListener('pointermove', (e) => {
      if (!start) return;
      ry = start.ry + (e.clientX - start.x) * 0.6;
      rx = Math.max(-35, Math.min(35, start.rx - (e.clientY - start.y) * 0.4));
      glyph.style.setProperty('--rx', `${rx}deg`);
      glyph.style.setProperty('--ry', `${ry}deg`);
    });
    const end = () => { start = null; art.classList.remove('is-dragging'); };
    art.addEventListener('pointerup', end);
    art.addEventListener('pointercancel', end);
  });

  return { show, current: () => items.find((i) => !i.hidden) || null };
}
