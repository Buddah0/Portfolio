import { test, expect } from '@playwright/test';

const slot = (id) => `#panel-collection [aria-controls="about-${id}"]`;

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
  await page.locator('#tab-collection').click();
});

test('opens on the intro heart with the bio in the pane', async ({ page }) => {
  await expect(page.locator(slot('intro'))).toHaveClass(/is-cursor/);
  await expect(page.locator('#about-intro')).toBeVisible();
  await expect(page.locator('#about-intro .detail__title')).toHaveText("Hi! I'm Matthew");
  await expect(page.locator('#panel-collection button.slot')).toHaveCount(8);
});

test('years-coding count is computed from 2019', async ({ page }) => {
  const expected = String(new Date().getFullYear() - 2019);
  await expect(page.locator(`${slot('since')} .slot__count`)).toHaveText(expected);
  await page.locator(slot('since')).focus();
  await expect(page.locator('#about-since .detail__meta')).toHaveText(`${expected} years and counting`);
});

test('arrow keys follow the collection layout', async ({ page }) => {
  await page.locator(slot('intro')).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(slot('since'))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(slot('associates'))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(slot('bs'))).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(slot('quest'))).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(slot('levelup'))).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(slot('first'))).toBeFocused();
  await expect(page.locator('#about-first .detail__meta')).toHaveText('HTML · CSS · JavaScript');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(slot('shipping'))).toBeFocused();
});

test('art rotates here too, and the hint says so', async ({ page }) => {
  await page.locator(slot('bs')).click();
  await expect(page.locator('.prompts')).toContainText('Rotate');
});
