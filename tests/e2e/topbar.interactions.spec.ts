import { expect, test } from '@playwright/test';

test.describe('Top bar interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('toggles the sidebar visibility', async ({ page }) => {
    const sidebarToggle = page.getByTitle('Sidebar');
    const sidebar = page.getByTestId('sidebar');

    await expect.poll(async () =>
      sidebar.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(200);

    await sidebarToggle.click();
    await expect.poll(async () =>
      sidebar.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThan(10);

    await sidebarToggle.click();
    await expect.poll(async () =>
      sidebar.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(200);
  });

  test('opens and closes the search panel', async ({ page }) => {
    const openSearch = page.getByTitle('Search nodes');
    const searchPanelInput = page.getByPlaceholder('Search node id, name, text');

    const searchPanel = page.getByTestId('search-panel');
    await expect.poll(async () =>
      searchPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThan(10);
    await expect(searchPanelInput).toHaveCount(0);

    await openSearch.click();
    await expect(searchPanelInput).toBeVisible();

    await page.getByTitle('Close search').click();
    await expect.poll(async () =>
      searchPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThan(10);
    await expect(searchPanelInput).toHaveCount(0);
  });

  test('switches theme and persists preference', async ({ page }) => {
    const toggleTheme = page.getByTitle('Toggle theme');
    const html = page.locator('html');

    await page.evaluate(() => localStorage.setItem('vite-ui-theme', 'light'));
    await page.reload();
    await expect(html).not.toHaveClass(/dark/);

    await toggleTheme.click();
    await expect(html).toHaveClass(/dark/);

    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });
});
