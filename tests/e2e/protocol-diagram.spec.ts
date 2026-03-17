import { expect, test, type Page } from '@playwright/test';

import { parseBulkRequestPayload } from './fixtures';
import { resolveFixturePath } from './utils';

const uploadProtocolFixture = async (page: Page) => {
  const fileInput = page.locator('input[type="file"][accept=".json"]');
  await fileInput.waitFor({ state: 'attached' });
  await fileInput.setInputFiles(resolveFixturePath('protocol-diagram-flow.json'));
  await expect(page.locator('[data-id="group_keys"]')).toBeVisible({ timeout: 10_000 });
};

test.describe('Flow overview panel', () => {
  test('shows boundary nodes in read-only mode', async ({ page }) => {
    await page.route('**/bulk_calculate', async (route) => {
      let payload: unknown;
      try {
        payload = route.request().postDataJSON();
      } catch {
        payload = undefined;
      }

      const { version, nodes } = parseBulkRequestPayload(payload);
      const hydratedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data ?? {}),
          dirty: false,
          error: false,
          extendedError: undefined,
        },
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version,
          nodes: hydratedNodes,
          errors: [],
        }),
      });
    });

    await page.goto('/');
    await uploadProtocolFixture(page);

    const protocolPanel = page.getByTestId('protocol-diagram-panel');
    await expect.poll(async () =>
      protocolPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThan(10);

    await page.getByRole('button', { name: 'Flow map' }).click();
    await expect.poll(async () =>
      protocolPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(200);

    await expect(protocolPanel.getByText('Alice Public Key').first()).toBeVisible();
    await expect(protocolPanel.getByText('Taproot Tweak').first()).toBeVisible();
    await expect(protocolPanel.getByTitle('Zoom in')).toBeVisible();
    await expect(protocolPanel.getByTitle('Zoom out')).toBeVisible();
    await expect(protocolPanel.getByTitle('Fit view')).toBeVisible();

    await expect(protocolPanel.locator("button[title^='Bundle ']")).toHaveCount(0);

    await page.unroute('**/bulk_calculate');
  });

  test('repositions minimap when protocol diagram opens and closes', async ({ page }) => {
    await page.route('**/bulk_calculate', async (route) => {
      let payload: unknown;
      try {
        payload = route.request().postDataJSON();
      } catch {
        payload = undefined;
      }

      const { version, nodes } = parseBulkRequestPayload(payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version,
          nodes: nodes.map((node) => ({
            ...node,
            data: { ...(node.data ?? {}), dirty: false, error: false },
          })),
          errors: [],
        }),
      });
    });

    await page.goto('/');
    await uploadProtocolFixture(page);

    const showMiniMap = page.getByTitle('Show minimap');
    if (await showMiniMap.count()) {
      await showMiniMap.click();
    }

    const minimap = page.locator('.react-flow__minimap');
    await expect(minimap.first()).toBeVisible({ timeout: 10_000 });
    const boxBefore = (await minimap.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

    await page.getByRole('button', { name: 'Flow map' }).click();
    const protocolPanel = page.getByTestId('protocol-diagram-panel');
    await expect.poll(async () =>
      protocolPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThan(200);

    const boxWithPanel = (await minimap.boundingBox()) ?? boxBefore;
    expect(boxWithPanel.x).toBeLessThan(boxBefore.x);

    await protocolPanel.getByTitle('Close diagram').click();
    await expect.poll(async () =>
      protocolPanel.evaluate((element) => element.getBoundingClientRect().width)
    ).toBeLessThan(10);

    const boxAfterClose = (await minimap.boundingBox()) ?? boxWithPanel;
    expect(boxAfterClose.x).toBeGreaterThan(boxWithPanel.x);

    await page.unroute('**/bulk_calculate');
  });
});
