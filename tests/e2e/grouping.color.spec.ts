import { expect, test } from '@playwright/test';

import { loadFixture, gotoEditor } from './utils';

test.describe('Grouping and color palette', () => {
  test('groups and ungroups selected nodes with undo/redo support', async ({ page }) => {
    await gotoEditor(page);
    await loadFixture(page, 'hash-flow.json');

    const firstNode = page.locator('[data-id="node_input"]');
    const secondNode = page.locator('[data-id="node_hash"]');

    await firstNode.click();
    await page.keyboard.down('Shift');
    await secondNode.click();
    await page.keyboard.up('Shift');

    const selectedNodes = page.locator('.react-flow__node.selected');
    await expect(selectedNodes).toHaveCount(2);

    const groupButton = page.getByRole('button', { name: /^Group$/ });
    await expect(groupButton).toBeEnabled();
    await groupButton.click();

    const groupNode = page.locator('.react-flow__node-shadcnGroup');
    await expect(groupNode).toBeVisible({ timeout: 10_000 });

    await page.getByTitle('Undo').click();
    await expect(groupNode).toHaveCount(0);

    await page.getByTitle('Redo').click();
    await expect(groupNode).toBeVisible();

    await page.getByTitle('Sidebar').click();
    await groupNode.click({ position: { x: 20, y: 20 } });
    await page.getByRole('button', { name: /^Ungroup$/ }).click();

    await expect(groupNode).toHaveCount(0);
    await expect(selectedNodes).toHaveCount(2);
  });

  test('selection mode toggle activates and deactivates marquee selection', async ({ page }) => {
    await gotoEditor(page);
    await loadFixture(page, 'hash-flow.json');

    const selectionTool = page.getByTitle('Selection tool (click to toggle or hold S + drag with LMB)');
    await selectionTool.click();
    await expect(selectionTool).toHaveAttribute('data-active', 'true');

    const pane = page.locator('.react-flow__pane');
    const box = await pane.boundingBox();
    if (!box) throw new Error('Flow pane not ready');

    const start = {
      x: Math.max(20, Math.min(box.width - 120, 120)),
      y: Math.max(20, Math.min(box.height - 160, 120)),
    };
    const end = {
      x: Math.min(box.width - 20, start.x + Math.max(80, box.width * 0.5)),
      y: Math.min(box.height - 40, start.y + Math.max(80, box.height * 0.4)),
    };

    await pane.dragTo(pane, {
      sourcePosition: start,
      targetPosition: end,
      force: true,
    });

    const selectedNodes = page.locator('.react-flow__node.selected');
    await expect(selectedNodes).toHaveCount(2);

    await selectionTool.click();
    await expect(selectionTool).not.toHaveAttribute('data-active', 'true');
  });

  test('applies and resets node color via palette with undo snapshot', async ({ page }) => {
    await gotoEditor(page);
    await loadFixture(page, 'hash-flow.json');

    const node = page.locator('[data-id="node_input"]');
    await node.click();

    const paletteButton = page.getByTitle('Colour palette');
    await expect(paletteButton).toBeEnabled();

    const card = node.locator('div.rounded-xl.relative.border-2').first();
    const initialBorder = await card.evaluate((el) => getComputedStyle(el).borderColor);
    await paletteButton.click();

    const palette = page.locator('div.nodrag').filter({ has: page.locator('button[title="#3b82f6"]') });
    await expect(palette).toBeVisible();

    const targetColor = '#3b82f6';
    await page.locator(`button[title="${targetColor}"]`).click();

    await expect.poll(async () => card.evaluate((el) => getComputedStyle(el).borderColor)).not.toBe(initialBorder);

    const historyButton = page.getByTitle('History');
    await historyButton.click();
    await expect(page.locator('button', { hasText: 'Change Node Color' })).toBeVisible();
    await page.getByTitle('Close panel').click();

    await paletteButton.click();
    await page.locator('button[title="Remove border color"]').click();

    await expect.poll(async () => card.evaluate((el) => getComputedStyle(el).borderColor)).toBe(initialBorder);
  });
});
