// Prompt bar: context-sensitive control hints, like the game's "Rotate / Select / Back" strip.
// Tracks the last input type on <body data-input="pointer|keyboard"> so hints show the right glyphs.

const MOUSE = '<i class="fa-solid fa-computer-mouse" aria-hidden="true"></i>';
const GRAB = '<i class="fa-solid fa-hand" aria-hidden="true"></i>';

const HINTS = {
  grid: {
    pointer: [['Rotate', GRAB], ['Select', MOUSE]],
    keyboard: [['Move', '↑↓←→'], ['Select', 'Enter'], ['Back', 'Esc'], ['Screens', 'Q', 'E']],
  },
  pane: {
    pointer: [['Open', MOUSE]],
    keyboard: [['Open', 'Enter'], ['Back', 'Esc']],
  },
  tabs: {
    pointer: [['Screens', 'L', 'R']],
    keyboard: [['Screens', '←', '→'], ['Enter screen', 'Tab']],
  },
};

export function initPrompts(bar) {
  let context = 'grid';
  const body = document.body;
  body.dataset.input = 'pointer';

  // "Rotate" only makes sense on screens whose detail pane has rotatable art.
  const canRotate = () => !!document.querySelector('[role="tabpanel"]:not([hidden]) .detail__art');

  function render() {
    const rows = (HINTS[context]?.[body.dataset.input] || []).filter(([label]) => label !== 'Rotate' || canRotate());
    bar.innerHTML = rows
      .map(([label, ...caps]) => `<span class="prompt">${label} ${caps.map((c) => `<span class="cap">${c}</span>`).join('')}</span>`)
      .join('');
  }

  function setInput(mode) {
    if (body.dataset.input === mode) return;
    body.dataset.input = mode;
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || ['Enter', 'Escape', 'q', 'e', 'Q', 'E', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      setInput('keyboard');
    }
  }, true);
  document.addEventListener('pointerdown', () => setInput('pointer'), true);
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (Math.abs(e.movementX) + Math.abs(e.movementY)) > 2) setInput('pointer'); }, true);

  // Context follows focus: tab bar, detail pane, or the slot grid (default).
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    const next = t.closest?.('[role="tablist"], .shoulder') ? 'tabs' : t.closest?.('.detail') ? 'pane' : 'grid';
    if (next !== context) { context = next; render(); }
  });
  document.addEventListener('screenchange', render);

  render();
  return { render, get context() { return context; } };
}
