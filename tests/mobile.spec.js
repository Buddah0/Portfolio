import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Runs in the "phone" project (Pixel 7: portrait, touch).

test('portrait layout fills the width with no sideways scrolling', async ({ page }) => {
  await page.goto('./#items');
  const { menuWidth, vw, scrollW } = await page.evaluate(() => ({
    menuWidth: document.querySelector('.menu').getBoundingClientRect().width,
    vw: window.innerWidth,
    scrollW: document.scrollingElement.scrollWidth,
  }));
  expect(Math.round(menuWidth)).toBe(vw);
  expect(scrollW).toBeLessThanOrEqual(vw);
  await expect(page.locator('.prompts')).toBeHidden();
});

test('title screen works by touch', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#title-screen')).toBeVisible();
  await page.locator('.title-menu__item', { hasText: 'Continue' }).tap();
  await expect(page.locator('#title-screen')).toBeHidden();
  await expect(page.locator('#tab-items')).toHaveAttribute('aria-selected', 'true');
});

test('tapping a project opens the sheet; Back closes it', async ({ page }) => {
  await page.goto('./#items');
  const sheet = page.locator('#panel-items .detail');
  await expect(sheet).toBeHidden(); // visibility: hidden until opened

  await page.locator('[aria-controls="proj-content-ai"]').tap();
  await expect(sheet).toHaveClass(/is-open/);
  await expect(sheet).toBeVisible();
  await expect(page.locator('#proj-content-ai .detail__title')).toBeInViewport();
  await expect(page.locator('#panel-items .sheet-close')).toBeVisible();
  await expect(page.locator('#panel-items .sheet-close')).toBeFocused();

  await page.locator('#panel-items .sheet-close').tap();
  await expect(sheet).not.toHaveClass(/is-open/);
  await expect(page.locator('[aria-controls="proj-content-ai"]')).toBeFocused();
});

test('switching screens closes an open sheet', async ({ page }) => {
  await page.goto('./#about');
  await page.locator('[aria-controls="about-bs"]').tap();
  await expect(page.locator('#panel-collection .detail')).toHaveClass(/is-open/);
  await page.locator('#tab-equipment').tap();
  await page.locator('#tab-collection').tap();
  await expect(page.locator('#panel-collection .detail')).not.toHaveClass(/is-open/);
});

test('equipment: tapping a skill updates the portrait oval (no sheet)', async ({ page }) => {
  await page.goto('./#skills');
  await page.locator('[aria-controls="skill-html"]').tap();
  await expect(page.locator('#skill-html')).toBeVisible();
  await expect(page.locator('.detail--oval')).toBeInViewport();
  await expect(page.locator('.detail--oval')).not.toHaveClass(/is-open/);
});

test('touch targets are big enough (WCAG 2.5.8: at least 24 px)', async ({ page }) => {
  for (const hash of ['items', 'skills', 'about', 'contact']) {
    await page.goto(`./#${hash}`);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('[role="tabpanel"]:not([hidden]) button.slot, [role="tabpanel"]:not([hidden]) .sys-btn, [role="tab"]')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width < 24 || r.height < 24).length);
    expect(small, `#${hash}`).toBe(0);
  }
});

test('no serious or critical axe violations in the portrait layout', async ({ page }) => {
  for (const hash of ['items', 'skills', 'about', 'contact']) {
    await page.goto(`./#${hash}`);
    await page.waitForTimeout(350);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(blocking.map((v) => `${hash} ${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  }
});
