import { test, expect } from '@playwright/test';

// Approved looks, guarded against regressions. Baselines are per-OS (see the -snapshots folder).
// Update deliberately with: npx playwright test tests/visual.spec.js --update-snapshots
const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 };

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
  await page.evaluate(() => document.fonts.ready);
});

test('Items screen (approved 2026-11-25)', async ({ page }) => {
  await expect(page).toHaveScreenshot('items.png', SHOT);
});
