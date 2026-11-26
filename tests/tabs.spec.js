import { test, expect } from '@playwright/test';

const ORDER = ['collection', 'equipment', 'items', 'system'];

async function expectActive(page, name) {
  for (const id of ORDER) {
    const tab = page.locator(`#tab-${id}`);
    const panel = page.locator(`#panel-${id}`);
    if (id === name) {
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(tab).toHaveAttribute('tabindex', '0');
      await expect(panel).toBeVisible();
    } else {
      await expect(tab).toHaveAttribute('aria-selected', 'false');
      await expect(tab).toHaveAttribute('tabindex', '-1');
      await expect(panel).toBeHidden();
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
});

test('starts on Items with tabs and panels wired together', async ({ page }) => {
  await expectActive(page, 'items');
  for (const id of ORDER) {
    await expect(page.locator(`#tab-${id}`)).toHaveAttribute('aria-controls', `panel-${id}`);
    await expect(page.locator(`#panel-${id}`)).toHaveAttribute('aria-labelledby', `tab-${id}`);
  }
});

test('arrow keys move between tabs and wrap at both ends', async ({ page }) => {
  await page.locator('#tab-items').focus();
  await page.keyboard.press('ArrowRight');
  await expectActive(page, 'system');
  await expect(page.locator('#tab-system')).toBeFocused();

  await page.keyboard.press('ArrowRight'); // wraps
  await expectActive(page, 'collection');
  await expect(page.locator('#tab-collection')).toBeFocused();

  await page.keyboard.press('ArrowLeft'); // wraps back
  await expectActive(page, 'system');
});

test('Home and End jump to the first and last tab', async ({ page }) => {
  await page.locator('#tab-items').focus();
  await page.keyboard.press('Home');
  await expectActive(page, 'collection');
  await expect(page.locator('#tab-collection')).toBeFocused();
  await page.keyboard.press('End');
  await expectActive(page, 'system');
  await expect(page.locator('#tab-system')).toBeFocused();
});

test('Tab key lands on the active tab only (one tab stop)', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  // From the L shoulder, the next Tab stop must be the active tab, not the first tab.
  await page.locator('.shoulder[data-step="-1"]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#tab-items')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.shoulder[data-step="1"]')).toBeFocused();
});

test('Q / E and PageUp / PageDown act as L / R from anywhere', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('e');
  await expectActive(page, 'system');
  await page.keyboard.press('e');
  await expectActive(page, 'collection');
  await page.keyboard.press('q');
  await expectActive(page, 'system');
  await page.keyboard.press('PageUp');
  await expectActive(page, 'items');
  await page.keyboard.press('PageDown');
  await expectActive(page, 'system');
});

test('Q / E keep focus on the tab list when used there', async ({ page }) => {
  await page.locator('#tab-items').focus();
  await page.keyboard.press('q');
  await expectActive(page, 'equipment');
  await expect(page.locator('#tab-equipment')).toBeFocused();
});

test('modifier shortcuts are left alone', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+e');
  await expectActive(page, 'items');
});

test('clicking tabs and the L / R buttons switches screens', async ({ page }) => {
  await page.locator('#tab-collection').click();
  await expectActive(page, 'collection');
  await page.locator('.shoulder[data-step="1"]').click();
  await expectActive(page, 'equipment');
  await page.locator('.shoulder[data-step="-1"]').click();
  await page.locator('.shoulder[data-step="-1"]').click();
  await expectActive(page, 'system');
});

test('screenchange event fires with the new panel id', async ({ page }) => {
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('screenchange', (e) => window.__changes.push(e.detail.id));
  });
  await page.locator('#tab-equipment').click();
  await page.locator('#tab-equipment').click(); // same tab: no event
  await page.keyboard.press('e');
  expect(await page.evaluate(() => window.__changes)).toEqual(['panel-equipment', 'panel-items']);
});
