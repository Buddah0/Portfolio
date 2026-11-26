import { test, expect } from '@playwright/test';

const FEATURED = '[aria-controls="proj-oxtail"]';
const POCKET = '[aria-controls="proj-pocket-mechanic"]';

test.beforeEach(async ({ page, context }) => {
  // Never hit the real GitHub / GitHub Pages from tests.
  await context.route(/^https:\/\/(github\.com|buddah0\.github\.io)\//, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
  await page.goto('./#items');
});

test('pane title follows the cursor', async ({ page }) => {
  await expect(page.locator('.detail__item:visible .detail__title')).toHaveText('An Oxtail’s Journey');
  await page.locator(POCKET).focus();
  await expect(page.locator('.detail__item:visible .detail__title')).toHaveText('Pocket Mechanic');
  await expect(page.locator('.detail__item:visible')).toHaveCount(1);
});

test('Select steps into the project link, Enter opens it, Esc comes back', async ({ page, context }) => {
  await page.locator(FEATURED).focus();
  await page.keyboard.press('Enter');
  const live = page.locator('#proj-oxtail .detail__link').first();
  await expect(live).toBeFocused();

  const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe('https://buddah0.github.io/oxtail-journey/');
  await popup.close();

  // Tab reaches the second link (the repo) too.
  await page.keyboard.press('Tab');
  await expect(page.locator('#proj-oxtail .detail__link').nth(1)).toBeFocused();
  const [repo] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
  await repo.waitForLoadState();
  expect(repo.url()).toBe('https://github.com/Buddah0/oxtail-journey');
  await repo.close();

  await page.keyboard.press('Escape');
  await expect(page.locator(FEATURED)).toBeFocused();
});

test('Select on a project without a link keeps focus on the slot', async ({ page }) => {
  await page.locator(POCKET).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(POCKET)).toBeFocused();
});

test('prompts and shoulder glyphs switch between pointer and keyboard', async ({ page }) => {
  const prompts = page.locator('.prompts');
  await page.mouse.click(5, 5);
  await expect(page.locator('body')).toHaveAttribute('data-input', 'pointer');
  await expect(prompts).toContainText('Rotate');
  await expect(page.locator('.shoulder[data-step="-1"] .glyph-pad')).toBeVisible();
  await expect(page.locator('.shoulder[data-step="-1"] .glyph-key')).toBeHidden();

  await page.locator(FEATURED).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('body')).toHaveAttribute('data-input', 'keyboard');
  await expect(prompts).toContainText('Enter');
  await expect(prompts).toContainText('Esc');
  await expect(page.locator('.shoulder[data-step="-1"] .glyph-key')).toHaveText('Q');
  await expect(page.locator('.shoulder[data-step="-1"] .glyph-key')).toBeVisible();

  // Context: inside the pane the hints change to Open / Back.
  await page.locator(FEATURED).focus();
  await page.keyboard.press('Enter');
  await expect(prompts).toContainText('Open');
  await expect(prompts).not.toContainText('Move');
});

test('dragging the art rotates it; a new cursor resets it', async ({ page }) => {
  const art = page.locator('#proj-oxtail .detail__art');
  const glyph = art.locator('i');
  const box = await art.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const ry = await glyph.evaluate((el) => el.style.getPropertyValue('--ry'));
  expect(parseFloat(ry)).toBeCloseTo(60, 0);

  await page.locator(POCKET).focus();
  await page.locator(FEATURED).focus();
  expect(await glyph.evaluate((el) => el.style.getPropertyValue('--ry'))).toBe('');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('art does not float or rotate', async ({ page }) => {
    const art = page.locator('#proj-oxtail .detail__art');
    const glyph = art.locator('i');
    expect(await glyph.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    const box = await art.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    expect(await glyph.evaluate((el) => el.style.getPropertyValue('--ry'))).toBe('');
  });

  test('cursor glow does not pulse', async ({ page }) => {
    expect(await page.locator(FEATURED).evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });
});
