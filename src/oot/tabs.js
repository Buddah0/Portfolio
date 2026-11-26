// Menu screens as an ARIA tabs widget (automatic activation), plus L/R shoulder controls.
// Keys: ←/→ and Home/End inside the tab list; Q/E or PageUp/PageDown anywhere act as L/R.
import { animate } from 'animejs';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initTabs(root = document) {
  const tablist = root.querySelector('[role="tablist"]');
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => root.getElementById(t.getAttribute('aria-controls')));
  let current = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

  function select(index, { focus = 'none', direction = 0 } = {}) {
    const next = (index + tabs.length) % tabs.length;
    const changed = next !== current;
    tabs.forEach((tab, i) => {
      const on = i === next;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    current = next;

    if (focus === 'tab') tabs[next].focus();
    if (focus === 'panel') {
      const target = panels[next].querySelector('[data-cursor-home]') || panels[next];
      target.focus({ preventScroll: true });
    }

    if (changed && !REDUCED_MOTION.matches) {
      animate(panels[next], {
        opacity: [0, 1],
        translateX: [`${direction * 2}%`, '0%'],
        duration: 260,
        ease: 'outCubic',
        // A leftover transform would become the containing block for fixed children (the phone sheet).
        onComplete: () => panels[next].style.removeProperty('transform'),
      });
    }
    if (changed) {
      tablist.dispatchEvent(new CustomEvent('screenchange', {
        bubbles: true,
        detail: { index: next, id: panels[next].id, tab: tabs[next] },
      }));
    }
  }

  // Where should focus go after an L/R step? Keep it where the user was working.
  function step(dir) {
    const active = document.activeElement;
    const inTabs = tablist.contains(active);
    const inPanel = panels.some((p) => p.contains(active));
    select(current + dir, { direction: dir, focus: inTabs ? 'tab' : inPanel ? 'panel' : 'none' });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { direction: Math.sign(i - current), focus: 'tab' }));
  });

  tablist.addEventListener('keydown', (e) => {
    const keys = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const target = keys[e.key];
    select(target, { direction: Math.sign(target - current) || (e.key === 'ArrowLeft' ? -1 : 1), focus: 'tab' });
  });

  root.querySelectorAll('.shoulder[data-step], .page-arrow[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => step(Number(btn.dataset.step)));
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (tablist.closest('[inert]')) return; // menu is behind the title screen
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const key = e.key.toLowerCase();
    if (key === 'q' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (key === 'e' || e.key === 'PageDown') { e.preventDefault(); step(1); }
  });

  select(current);
  return { select, step, get current() { return current; } };
}
