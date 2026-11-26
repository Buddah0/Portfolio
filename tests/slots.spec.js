import { test, expect } from '@playwright/test';

const PREREQ = '[aria-controls="proj-prereq"]';
const POCKET = '[aria-controls="proj-pocket-mechanic"]';
const CONTENT = '[aria-controls="proj-content-ai"]';

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
});

test('cursor starts on the featured project and the grid has one tab stop', async ({ page }) => {
  const grid = page.locator('#panel-items [data-slot-grid]');
  await expect(grid.locator(PREREQ)).toHaveClass(/is-cursor/);
  await expect(grid.locator(PREREQ)).toHaveAttribute('tabindex', '0');
  await expect(grid.locator(POCKET)).toHaveAttribute('tabindex', '-1');
  await expect(grid.locator(CONTENT)).toHaveAttribute('tabindex', '-1');
  await expect(grid.locator('.slot.is-cursor')).toHaveCount(1);

  // Locked wells are decorative: not buttons, hidden from assistive tech.
  const locked = grid.locator('.slot.is-locked');
  expect(await locked.count()).toBeGreaterThan(10);
  for (const el of await locked.all()) {
    await expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(await el.evaluate((n) => n.tagName)).toBe('SPAN');
  }

  // Tab order: R shoulder -> cursor slot -> first link in the detail pane.
  await page.locator('.shoulder[data-step="1"]').focus();
  await page.keyboard.press('Tab');
  await expect(grid.locator(PREREQ)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#proj-prereq .detail__link')).toBeFocused();
});

test('arrow keys move the cursor to the nearest slot and stop at edges', async ({ page }) => {
  const grid = page.locator('#panel-items [data-slot-grid]');
  await grid.locator(PREREQ).focus();

  await page.keyboard.press('ArrowRight');
  await expect(grid.locator(CONTENT)).toBeFocused();
  await expect(grid.locator(CONTENT)).toHaveClass(/is-cursor/);
  await expect(grid.locator(PREREQ)).not.toHaveClass(/is-cursor/);

  await page.keyboard.press('ArrowRight'); // right edge: stays put
  await expect(grid.locator(CONTENT)).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(grid.locator(POCKET)).toBeFocused();
  await expect(grid.locator(POCKET)).toHaveAttribute('tabindex', '0');
  await expect(grid.locator(CONTENT)).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('ArrowLeft'); // left edge
  await page.keyboard.press('ArrowDown'); // nothing interactive below
  await expect(grid.locator(POCKET)).toBeFocused();
  await expect(grid.locator('.slot.is-cursor')).toHaveCount(1);
});

test('the cursor decides which project the detail pane shows', async ({ page }) => {
  await expect(page.locator('#proj-prereq')).toBeVisible();
  await expect(page.locator('#proj-pocket-mechanic')).toBeHidden();

  await page.locator(POCKET).focus();
  await expect(page.locator('#proj-pocket-mechanic')).toBeVisible();
  await expect(page.locator('#proj-prereq')).toBeHidden();
  await expect(page.locator('#proj-content-ai')).toBeHidden();
});

test('mouse hover moves the cursor without stealing focus', async ({ page }) => {
  await page.locator('#tab-items').focus();
  await page.locator(CONTENT).hover();
  await expect(page.locator(CONTENT)).toHaveClass(/is-cursor/);
  await expect(page.locator('#proj-content-ai')).toBeVisible();
  await expect(page.locator('#tab-items')).toBeFocused();
});

test('clicking a slot selects it; Escape goes back to the tab bar', async ({ page }) => {
  await page.locator(POCKET).click();
  await expect(page.locator(POCKET)).toHaveClass(/is-cursor/);
  await expect(page.locator(POCKET)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tab-items')).toBeFocused();
});

test('L / R from inside the grid and back returns to the remembered slot', async ({ page }) => {
  await page.locator(CONTENT).focus();
  await page.keyboard.press('e'); // -> System
  await expect(page.locator('#tab-system')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('q'); // -> Items again
  await expect(page.locator('#tab-items')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(CONTENT)).toBeFocused();
});
