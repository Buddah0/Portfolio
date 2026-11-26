import { test, expect } from '@playwright/test';

const slot = (id) => `#panel-equipment [aria-controls="skill-${id}"]`;

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
  await page.locator('#tab-equipment').click();
});

test('opens with the cursor on Python and all skills present', async ({ page }) => {
  await expect(page.locator(slot('python'))).toHaveClass(/is-cursor/);
  await expect(page.locator('#skill-python')).toBeVisible();
  await expect(page.locator('#panel-equipment button.slot')).toHaveCount(13);
  await expect(page.locator('#panel-equipment .slot.is-equipped')).toHaveCount(5);
  for (const id of ['html', 'css', 'javascript', 'bootstrap', 'python', 'java', 'sql', 'github', 'git']) {
    await expect(page.locator(`#skill-${id}`)).toHaveCount(1);
  }
});

test('the portrait loads inside the oval', async ({ page }) => {
  const img = page.locator('.oval__portrait');
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
});

test('arrow keys walk the grid rows and across to the accessories', async ({ page }) => {
  await page.locator(slot('python')).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(slot('html'))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(slot('sql'))).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(slot('github'))).toBeFocused();
  await expect(page.locator('#skill-github')).toBeVisible();

  await page.locator(slot('python')).focus();
  await page.keyboard.press('ArrowLeft'); // jumps the oval to the nearest accessory
  await expect(page.locator(slot('automation'))).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(slot('ai'))).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(slot('fastapi'))).toBeFocused();
  await expect(page.locator('#skill-fastapi .detail__title')).toHaveText('FastAPI');
});

test('page arrows switch screens like L / R', async ({ page }) => {
  await page.locator('#panel-equipment .page-arrow--next').click();
  await expect(page.locator('#tab-items')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#tab-equipment').click();
  await page.locator('#panel-equipment .page-arrow:not(.page-arrow--next)').click();
  await expect(page.locator('#tab-collection')).toHaveAttribute('aria-selected', 'true');
});

test('no Rotate hint here (nothing to rotate), but it returns on Items', async ({ page }) => {
  await page.locator(slot('css')).click(); // focus in the grid, pointer input
  await expect(page.locator('.prompts')).toContainText('Select');
  await expect(page.locator('.prompts')).not.toContainText('Rotate');
  await page.locator('#tab-items').click();
  await page.locator('[aria-controls="proj-pocket-mechanic"]').click();
  await expect(page.locator('.prompts')).toContainText('Rotate');
});
