import { readFileSync } from 'fs';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  loadFixture,
  prepareClipboardSpy,
  readClipboard,
  resolveFixturePath,
  setEditableValue,
  waitForBulkResponse,
} from './utils';
import type { CalculationNodeData, FlowData, FlowNode } from '@/types';
import { doubleSha256Hex, parseBulkRequestPayload } from './fixtures';

test.describe('Node editing and backend responses', () => {
  test('shows error badge and panel when backend returns calculation error', async ({ page, browserName }) => {
    await tryGrantClipboardPermissions(page, browserName);

    const fixture: FlowData = JSON.parse(
      readFileSync(resolveFixturePath('hash-flow.json'), 'utf8'),
    );
    const initialInputNode = (fixture.nodes ?? []).find((node) => node.id === 'node_input');
    const initialInputData = (initialInputNode?.data as CalculationNodeData | undefined)?.inputs;
    const initialInput = String(
      (initialInputData as { val?: unknown } | undefined)?.val ?? '',
    );
    const baselineNodes: FlowNode[] = (fixture.nodes ?? []).map((node) => ({
      ...node,
      data: {
        ...(node.data ?? {}),
        dirty: false,
        result:
          node.id === 'node_hash'
            ? doubleSha256Hex(initialInput)
            : node.data?.result ?? '',
      },
    }));

    let callCounter = 0;

    await page.route('**/bulk_calculate', async (route) => {
      let payload: unknown;
      try {
        payload = route.request().postDataJSON();
      } catch {
        payload = undefined;
      }
      const { version, nodes } = parseBulkRequestPayload(payload);
      const callIndex = callCounter++;

      if (callIndex === 0) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ nodes: baselineNodes, version, errors: [] }),
        });
        return;
      }

      const requestNodes = nodes.length ? nodes : baselineNodes;
      const inputNode = requestNodes.find((n) => n.id === 'node_input');
      const newValue = (inputNode?.data as CalculationNodeData | undefined)?.inputs?.val ?? '';

      const errorMessage = 'Backend explosion: invalid hex input';
      const errorNodes = (fixture.nodes ?? []).map((node) => {
        if (node.id === 'node_input') {
          return {
            ...node,
            data: {
              ...(node.data ?? {}),
              value: newValue,
              inputs: { ...((node.data as CalculationNodeData | undefined)?.inputs ?? {}), val: newValue },
              dirty: false,
              result: newValue,
            },
          };
        }
        if (node.id === 'node_hash') {
          return {
            ...node,
            data: {
              ...(node.data ?? {}),
              dirty: false,
              result: '',
              error: true,
              extendedError: errorMessage,
            },
          };
        }
        return { ...node, data: { ...(node.data ?? {}), dirty: false } };
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: errorNodes,
          version,
          errors: [{ nodeId: 'node_hash', error: errorMessage }],
        }),
      });
    });
    await page.goto('/');
    await prepareClipboardSpy(page);
    await loadFixture(page, 'hash-flow.json');

    const response = await waitForBulkResponse(
      page,
      () => setEditableValue(page, 'node_input', 'c0ffee'),
      { allowErrors: true },
    );
    expect(Array.isArray(response.data?.errors)).toBe(true);

    const errorBadge = page.getByTitle('Show errors');
    await expect(errorBadge).toBeVisible({ timeout: 10_000 });
    await expect(errorBadge).toHaveText('error (1)');

    await errorBadge.click();
    const errorPanelHeading = page.getByRole('heading', { name: 'Errors' });
    await expect(errorPanelHeading).toBeVisible();

    const errorRow = page.getByRole('button', { name: /Select node/i }).first();
    await errorRow.hover();
    const copyButton = errorRow.getByRole('button', { name: /Copy error info for/i });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    const clipboardText = await readClipboard(page);
    expect(clipboardText).toContain('Backend explosion');

    await page.getByTitle('Close panel').click();
    await expect(errorPanelHeading).toHaveCount(0);

    await page.unroute('**/bulk_calculate');
  });

});

async function tryGrantClipboardPermissions(page: Page, browserName: string) {
  const permissions: Record<string, string[]> = {
    chromium: ['clipboard-read', 'clipboard-write'],
  };

  const requested = permissions[browserName];
  if (!requested?.length) {
    return;
  }

  try {
    await page.context().grantPermissions(requested);
  } catch (error) {
    test.info().annotations.push({ type: 'warning', description: `Clipboard permissions unavailable: ${String(error)}` });
  }
}
