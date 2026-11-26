import { test, expect } from '@playwright/test';

// Content details Matthew asked for explicitly; guards against accidental edits.

test.beforeEach(async ({ page }) => {
  await page.goto('./#items');
});

test('featured project is An Oxtail’s Journey with its repo link', async ({ page }) => {
  const item = page.locator('#proj-oxtail');
  await expect(item).toBeVisible();
  await expect(item.locator('.detail__title')).toHaveText('An Oxtail’s Journey');
  const links = item.locator('.detail__link');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveText('Live Site');
  await expect(links.nth(0)).toHaveAttribute('href', 'https://buddah0.github.io/oxtail-journey/');
  await expect(links.nth(1)).toHaveAttribute('href', 'https://github.com/Buddah0/oxtail-journey');
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
  await expect(page.locator('[aria-controls="proj-oxtail"] .fa-bowl-food')).toHaveCount(1);
  await expect(page.locator('#proj-prereq')).toHaveCount(0);
});

test('Content AI shows its dated range and the Docker / MCP bullet', async ({ page }) => {
  await page.locator('[aria-controls="proj-content-ai"]').focus();
  const item = page.locator('#proj-content-ai');
  await expect(item.locator('.detail__meta')).toContainText('December 2025 to March 2026');
  await expect(item.locator('li').last()).toContainText('Docker and an MCP server');
  // The longer write-up still fits: the link stays inside the pane.
  const pane = await page.locator('#panel-items .detail').boundingBox();
  const link = await item.locator('.detail__link').boundingBox();
  expect(link.y + link.height).toBeLessThanOrEqual(pane.y + pane.height);
});

test('Equipment: Fun Fact sits under FastAPI and FastAPI no longer names a removed project', async ({ page }) => {
  await page.locator('#tab-equipment').click();
  await page.locator('[aria-controls="skill-fastapi"]').focus();
  await expect(page.locator('#skill-fastapi .detail__desc')).toHaveText('REST APIs for data ingestion and async analysis.');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[aria-controls="skill-funfact"]')).toBeFocused();
  await expect(page.locator('#skill-funfact .detail__title')).toHaveText('Fun Fact');
  await expect(page.locator('#skill-funfact .detail__desc')).toHaveText('The inspiration for this whole website was a game I beat in a week. HYAH!');
  await expect(page.locator('body')).not.toContainText('College Prerequisite Validator');
});

test('degrees read as Matthew described them', async ({ page }) => {
  await page.locator('#tab-collection').click();
  await expect(page.locator('#about-associates .detail__title')).toHaveText('Associate’s in Computer Science');
  await expect(page.locator('#about-bs .detail__title')).toHaveText('B.S. in Information Technology');
  await expect(page.locator('body')).not.toContainText('B.S. in Computer Science');
});
