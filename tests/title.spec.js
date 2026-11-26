import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const item = (label) => `.title-menu__item:text-is("${label}")`;

test('a plain visit opens on the title screen with the menu inert behind it', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#title-screen')).toBeVisible();
  await expect(page.locator(item('Continue'))).toHaveClass(/is-cursor/);
  await expect(page.locator(item('Continue'))).toBeFocused();
  await expect(page.locator('.title-caption')).toHaveText('Jump into my projects');
  await expect(page.locator('.hud')).toHaveJSProperty('inert', true);
  await expect(page.locator('.screens')).toHaveJSProperty('inert', true);
});

test('first load shows the title fully opaque (no fade revealing the menu)', async ({ page }) => {
  await page.goto('./');
  expect(await page.locator('#title-screen').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

test('Q / E do nothing while the title is open', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('e');
  await expect(page.locator('#title-screen')).toBeVisible();
  await expect(page.locator('#tab-items')).toHaveAttribute('aria-selected', 'true');
});

test('arrow down + Enter on New Game opens About, focused and linkable', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator(item('New Game'))).toBeFocused();
  await expect(page.locator('.title-caption')).toHaveText('Start with who I am');
  await page.keyboard.press('Enter');
  await expect(page.locator('#title-screen')).toBeHidden();
  await expect(page.locator('#tab-collection')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[aria-controls="about-intro"]')).toBeFocused();
  await expect(page).toHaveURL(/#collection$/);
  await expect(page.locator('.hud')).toHaveJSProperty('inert', false);
});

test('Continue and Contact go to Projects and System', async ({ page }) => {
  await page.goto('./');
  await page.locator(item('Continue')).click();
  await expect(page.locator('#tab-items')).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/#items$/);

  await page.goto('./');
  await page.locator(item('Contact')).click();
  await expect(page.locator('#tab-system')).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/#system$/);
});

for (const [hash, screen] of [['projects', 'items'], ['skills', 'equipment'], ['about', 'collection'], ['contact', 'system'], ['equipment', 'equipment']]) {
  test(`deep link #${hash} skips the title and opens ${screen}`, async ({ page }) => {
    await page.goto(`./#${hash}`);
    await expect(page.locator('#title-screen')).toBeHidden();
    await expect(page.locator(`#tab-${screen}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(`#${screen}$`));
  });
}

test('switching screens keeps the address bar in step', async ({ page }) => {
  await page.goto('./#items');
  await page.keyboard.press('e');
  await expect(page).toHaveURL(/#system$/);
  await page.locator('#tab-equipment').click();
  await expect(page).toHaveURL(/#equipment$/);
});

test('System → Title Screen brings the title back', async ({ page }) => {
  await page.goto('./#contact');
  await page.locator('[aria-controls="sys-title"]').click();
  await expect(page.locator('#title-screen')).toBeVisible();
  await expect(page.locator(item('Continue'))).toBeFocused();
  await expect(page).not.toHaveURL(/#/);
  await expect(page.locator('.screens')).toHaveJSProperty('inert', true);
});

test('title screen has no serious or critical axe violations', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(450);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
