import { test, expect } from '@playwright/test';

test('page loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('./');
  await expect(page).toHaveTitle(/Matthew/);
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
});
