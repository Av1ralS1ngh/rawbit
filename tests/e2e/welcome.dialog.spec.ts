import { expect, test } from '@playwright/test';

test.describe('Welcome dialog', () => {
  test('is suppressed for automated runs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('dialog', { name: /Welcome to raw₿it/i })).toHaveCount(0);

    const startEmptyButton = page.getByRole('button', { name: /Start empty canvas/i });
    await expect(startEmptyButton).toHaveCount(0);

    await expect(page.locator('.react-flow__pane')).toBeVisible();

    const sidebarToggle = page.getByTitle('Sidebar');
    await expect(sidebarToggle).toBeVisible();
    await sidebarToggle.click();
  });
});
