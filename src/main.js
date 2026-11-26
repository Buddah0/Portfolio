import './styles/oot/tokens.css';
import './styles/oot/base.css';
import './styles/oot/textures.css';
import './styles/oot/hud.css';
import './styles/oot/slots.css';
import './styles/oot/items.css';
import './styles/oot/detail.css';
import './styles/oot/equipment.css';
import './styles/oot/collection.css';
import './styles/oot/system.css';
import './styles/oot/title.css';
import './styles/oot/mobile.css';
import { initTabs } from './oot/tabs.js';
import { initSlotGrid } from './oot/slotGrid.js';
import { initDetailPane } from './oot/detailPane.js';
import { initPrompts } from './oot/prompts.js';
import { initTitleScreen } from './oot/titleScreen.js';

document.addEventListener('DOMContentLoaded', () => {
  // Keep year counts current (HTML holds a sensible fallback).
  document.querySelectorAll('[data-years-since]').forEach((el) => {
    el.textContent = String(new Date().getFullYear() - Number(el.dataset.yearsSince));
  });

  const tabs = initTabs();
  initPrompts(document.querySelector('.prompts'));
  let title = null;

  // Portrait layout: Items / Collection panes become a bottom sheet that opens on Select.
  const PORTRAIT = window.matchMedia('(max-aspect-ratio: 1/1)');
  const isSheet = (el) => !!el?.matches('.detail:not(.sys-card):not(.detail--oval)');

  // Each menu screen: a slot grid (cursor) driving a detail pane.
  document.querySelectorAll('.screen [data-slot-grid]').forEach((grid) => {
    const screen = grid.closest('[role="tabpanel"]');
    const tab = document.getElementById(screen.getAttribute('aria-labelledby'));
    const paneEl = screen.querySelector('.detail');
    const pane = paneEl ? initDetailPane(paneEl) : null;
    let slots = null;

    const closeSheet = ({ focus = true } = {}) => {
      if (!paneEl?.classList.contains('is-open')) return;
      paneEl.classList.remove('is-open');
      if (focus) slots?.cursor.focus({ preventScroll: true });
    };

    slots = initSlotGrid(grid, {
      onCursor: (slot) => pane?.show(slot.getAttribute('aria-controls')),
      // Select (click / tap / Enter / Space): run the slot's action, open the sheet on phones,
      // or step into the pane's link on wide screens.
      onSelect: (slot) => {
        if (slot.dataset.action === 'title') { title?.show(); return; }
        const item = pane?.show(slot.getAttribute('aria-controls'));
        if (PORTRAIT.matches && isSheet(paneEl)) {
          paneEl.classList.add('is-open');
          paneEl.querySelector('.sheet-close')?.focus({ preventScroll: true });
          return;
        }
        item?.querySelector('.detail__link')?.focus();
      },
      // Back (Esc) from the grid: up to the tab bar.
      onBack: () => tab?.focus(),
    });

    paneEl?.querySelector('.sheet-close')?.addEventListener('click', () => closeSheet());

    // Back (Esc) from the pane: close the sheet (if open) and return to the slot under the cursor.
    paneEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && slots) {
        e.preventDefault();
        paneEl.classList.remove('is-open');
        slots.cursor.focus({ preventScroll: true });
      }
    });

    document.addEventListener('screenchange', () => closeSheet({ focus: false }));
    PORTRAIT.addEventListener('change', () => closeSheet({ focus: false }));
  });

  title = initTitleScreen({
    title: document.getElementById('title-screen'),
    gated: [document.querySelector('.hud'), document.querySelector('.screens'), document.querySelector('.prompts')],
    tabs,
    screenIds: [...document.querySelectorAll('[role="tab"]')].map((t) => t.id.replace(/^tab-/, '')),
  });
});
