import { readFileSync } from 'fs';

import { expect, test } from '@playwright/test';

import {
  loadFixture,
  resolveFixturePath,
  setEditableValue,
  waitForBulkResponse,
} from './utils';
import type { CalculationNodeData, FlowData, FlowNode } from '@/types';
import { doubleSha256Hex, parseBulkRequestPayload } from './fixtures';

test.describe('Panel coordination', () => {
  test('auto-closes sibling panels and supports search selection', async ({ page }) => {
    test.setTimeout(60_000);

    const readViewport = async () => {
      return page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (!viewport) return null;
        const style = window.getComputedStyle(viewport);
        const transform = style.transform || viewport.style.transform || '';
        if (!transform || transform === 'none') {
          return { x: 0, y: 0, zoom: 1 } as const;
        }
        if (transform.startsWith('matrix')) {
          const parts = transform
            .replace('matrix(', '')
            .replace(')', '')
            .split(',')
            .map((value) => parseFloat(value.trim()));
          const [a, , , d, e, f] = parts;
          return { x: e ?? 0, y: f ?? 0, zoom: a ?? d ?? 1 } as const;
        }
        const match = transform.match(/translate\(([-0-9.]+)px, ([-0-9.]+)px\) scale\(([-0-9.]+)\)/);
        if (match) {
          return {
            x: parseFloat(match[1] ?? '0'),
            y: parseFloat(match[2] ?? '0'),
            zoom: parseFloat(match[3] ?? '1'),
          } as const;
        }
        return { x: 0, y: 0, zoom: 1 } as const;
      });
    };

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

    const errorMessage = 'Backend explosion: invalid hex input';
    let calcCalls = 0;

    await page.route('**/bulk_calculate', async (route) => {
      let payload: unknown;
      try {
        payload = route.request().postDataJSON();
      } catch {
        payload = undefined;
      }
      const { version, nodes } = parseBulkRequestPayload(payload);
      const callIdx = calcCalls++;

      const requestNodes = nodes.length ? nodes : baselineNodes;
      const enrichedNodes = requestNodes.map((node) => {
        const data = { ...(node.data ?? {}) } as CalculationNodeData & Record<string, unknown>;
        if (node.id === 'node_hash') {
          const baseResult = data.result ?? baselineNodes.find((n) => n.id === 'node_hash')?.data?.result ?? '';
          return {
            ...node,
            data: {
              ...data,
              dirty: false,
              result: callIdx === 0 ? baseResult : '',
              ...(callIdx === 0
                ? {}
                : {
                    error: true,
                    extendedError: errorMessage,
                  }),
            },
          };
        }
        return {
          ...node,
          data: {
            ...data,
            dirty: false,
          },
        };
      });

      const errors = callIdx === 0 ? [] : [{ nodeId: 'node_hash', error: errorMessage }];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ nodes: enrichedNodes, errors, version }),
      });
    });

    await page.goto('/');
    await loadFixture(page, 'hash-flow.json');

    await waitForBulkResponse(
      page,
      () => setEditableValue(page, 'node_input', 'zzzz'),
      { allowErrors: true },
    );

    const showErrors = page.getByTitle('Show errors');
    await expect(showErrors).toBeVisible({ timeout: 10_000 });

    await page.getByTitle('History').click();
    await expect(page.getByRole('heading', { name: 'Undo/Redo Stack' })).toBeVisible();

    const openSearch = page.getByTitle('Search nodes');
    await openSearch.click();
    const searchPanel = page.getByTestId('search-panel');
    await expect(searchPanel).toBeVisible();
    await expect(searchPanel).toHaveAttribute('class', /w-64/);
    await expect(page.getByRole('heading', { name: 'Undo/Redo Stack' })).toHaveCount(0);

    const searchInput = page.getByPlaceholder('Search node id, name, text');
    await searchInput.fill('hash');

    const beforeFocus = (await readViewport()) ?? { x: 0, y: 0, zoom: 1 };
    const resultRow = searchPanel.locator('[role="button"]').first();
    await resultRow.click();
    await expect.poll(async () => {
      const vp = await readViewport();
      if (!vp) return null;
      return {
        x: Math.round(vp.x),
        y: Math.round(vp.y),
      };
    }).not.toEqual({ x: Math.round(beforeFocus.x), y: Math.round(beforeFocus.y) });

    await openSearch.click();
    await expect(searchPanel).toHaveAttribute('class', /w-0/);

    await showErrors.click();
    const errorsHeading = page.getByRole('heading', { name: 'Errors' });
    await expect(errorsHeading).toBeVisible();
    await showErrors.click();
    await expect(errorsHeading).toHaveCount(0);
    await expect(searchPanel).toHaveAttribute('class', /w-0/);

    await page.unroute('**/bulk_calculate');
  });
});
