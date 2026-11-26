import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SCREENS = ['collection', 'equipment', 'items', 'system'];

for (const screen of SCREENS) {
  test(`no serious or critical axe violations on ${screen}`, async ({ page }) => {
    await page.goto('./#items');
    await page.locator(`#tab-${screen}`).click();
    await page.waitForTimeout(350); // let the panel transition finish
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
