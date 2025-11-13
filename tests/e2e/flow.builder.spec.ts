import { createHash } from 'crypto';
import { expect, test } from '@playwright/test';

import { getNodeResult, loadFixture, waitForBulkResponse } from './utils';

test.describe('Flow builder roundtrip', () => {
  test('creates a node, edits value, and receives calculated result', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');

    const { data: baseline } = await loadFixture(page, 'hash-flow.json');

    const hashNode = page.locator('[data-id="node_hash"]').first();
    await expect(hashNode).toBeVisible();

    const baselineResult = getNodeResult(baseline, 'node_hash');
    expect(baselineResult).toBe(doubleSha256Hex('68656c6c6f'));

    const inputField = page
      .locator('[data-id="node_input"] textarea, [data-id="node_input"] input')
      .first();
    await expect(inputField).toBeVisible({ timeout: 10_000 });
    await inputField.click({ timeout: 10_000 });

    const { data: updated } = await waitForBulkResponse(page, async () => {
      await inputField.fill('776f726c64');
      await inputField.evaluate((element) => {
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      });
    });
    expect(getNodeResult(updated, 'node_hash')).toBe(doubleSha256Hex('776f726c64'));
  });
});

function doubleSha256Hex(hex: string) {
  const first = createHash('sha256').update(Buffer.from(hex, 'hex')).digest();
  return createHash('sha256').update(first).digest('hex');
}
