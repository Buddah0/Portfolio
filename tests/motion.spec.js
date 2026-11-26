import { test, expect } from '@playwright/test';

// With "reduce motion" set in the OS, nothing should drift, pulse, slide or fade.
test.use({ reducedMotion: 'reduce' });

test('title screen: no drifting light, no fade-in', async ({ page }) => {
  await page.goto('./');
  const title = page.locator('#title-screen');
  expect(await title.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('none');
  expect(await title.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

test('screen switches are instant (no slide)', async ({ page }) => {
  await page.goto('./#items');
  await page.locator('#tab-equipment').click();
  const panel = page.locator('#panel-equipment');
  // Read immediately: an animation would still be mid-flight here.
  expect(await panel.evaluate((el) => [getComputedStyle(el).opacity, el.style.transform])).toEqual(['1', '']);
});

test('menu cursors do not pulse anywhere', async ({ page }) => {
  await page.goto('./#contact');
  expect(await page.locator('.sys-btn.is-cursor').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('#tab-equipment').click();
  expect(await page.locator('#panel-equipment .slot.is-cursor').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('tab banner and transitions are instant', async ({ page }) => {
  await page.goto('./#items');
  const dur = await page.locator('#tab-items').evaluate((el) => getComputedStyle(el, '::before').transitionDuration);
  expect(dur.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
});
