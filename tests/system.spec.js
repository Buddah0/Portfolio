import { test, expect } from '@playwright/test';

const btn = (id) => `#panel-system [aria-controls="sys-${id}"]`;

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https:\/\/(github\.com|www\.linkedin\.com|www\.instagram\.com)\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
  await page.goto('./#items');
  await page.locator('#tab-system').click();
});

test('opens on Basic Controls with the controls card showing', async ({ page }) => {
  await expect(page.locator(btn('controls'))).toHaveClass(/is-cursor/);
  await expect(page.locator('#sys-controls')).toBeVisible();
  await expect(page.locator('#sys-controls kbd')).not.toHaveCount(0);
  await expect(page.locator('#panel-system .sys-btn')).toHaveCount(5);
});

test('social entries are real links that open in a new tab', async ({ page }) => {
  const expected = {
    github: 'https://github.com/Buddah0',
    linkedin: 'https://www.linkedin.com/in/bryan-m-bess/',
    instagram: 'https://www.instagram.com/buddah__0/',
  };
  for (const [id, href] of Object.entries(expected)) {
    const link = page.locator(btn(id));
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});

test('up / down walk the menu and the card follows', async ({ page }) => {
  await page.locator(btn('controls')).focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(btn('instagram'))).toBeFocused();
  await expect(page.locator('#sys-instagram')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(btn('github'))).toBeFocused();
  await expect(page.locator('#sys-github .sys-card__text')).toHaveText('github.com/Buddah0');
  await page.keyboard.press('ArrowUp'); // top edge
  await expect(page.locator(btn('github'))).toBeFocused();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await expect(page.locator(btn('title'))).toBeFocused();
  await expect(page.locator('.sys-btn.is-cursor')).toHaveCount(1);
});

test('Enter on GitHub opens the profile', async ({ page, context }) => {
  await page.locator(btn('github')).focus();
  const [popup] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe('https://github.com/Buddah0');
});

test('hovering a menu entry previews it', async ({ page }) => {
  await page.locator(btn('linkedin')).hover();
  await expect(page.locator('#sys-linkedin')).toBeVisible();
  await expect(page.locator('#sys-controls')).toBeHidden();
});
