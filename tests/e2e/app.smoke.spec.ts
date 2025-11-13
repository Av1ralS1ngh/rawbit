import { expect, test } from '@playwright/test';

test.describe('App smoke', () => {
  test('loads the flow builder UI shell @smoke', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/raw/i);
    await expect(page.getByTitle('Load')).toBeVisible();
    await expect(page.getByPlaceholder('Search nodes...')).toBeVisible();
    await expect(page.locator('.react-flow')).toBeVisible();
  });
});
