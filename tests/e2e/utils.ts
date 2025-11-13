import path from 'path';
import { fileURLToPath } from 'url';

import { expect } from '@playwright/test';
import type { Locator, Page, Request, Response } from '@playwright/test';

import type { FlowNode, RecalcResponse } from '@/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, '..', '..');
export const fixturesDir = path.resolve(__dirname, 'fixtures');

export function resolveFixturePath(...segments: string[]) {
  return path.resolve(fixturesDir, ...segments);
}

type GotoWaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

export async function gotoEditor(
  page: Page,
  {
    timeoutMs = 120_000,
    waitUntil = 'domcontentloaded',
  }: { timeoutMs?: number; waitUntil?: GotoWaitUntil } = {},
) {
  await page.goto('/', { timeout: timeoutMs, waitUntil });
}

export type WaitForBulkResponseResult = {
  data: RecalcResponse | null;
  response: Response;
  request: Request;
  requestBody: unknown;
};

export type WaitForBulkResponseOptions = {
  timeoutMs?: number;
  allowErrors?: boolean;
  onResponse?: (payload: WaitForBulkResponseResult) => Promise<void> | void;
};

export async function waitForBulkResponse(
  page: Page,
  action: () => Promise<void>,
  options: WaitForBulkResponseOptions = {},
): Promise<WaitForBulkResponseResult> {
  const { timeoutMs = 60_000, allowErrors = false, onResponse } = options;

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes('/bulk_calculate') && res.request().method() === 'POST',
    { timeout: timeoutMs },
  );

  await action();
  const response = await responsePromise;
  const request = response.request();

  let data: RecalcResponse | null = null;
  try {
    data = (await response.json()) as RecalcResponse;
  } catch {
    data = null;
  }

  let requestBody: unknown = null;
  try {
    requestBody = request.postDataJSON();
  } catch {
    try {
      requestBody = request.postData();
    } catch {
      requestBody = null;
    }
  }

  if (!allowErrors) {
    if (!response.ok()) {
      const statusText = await response.text().catch(() => '');
      throw new Error(
        `/bulk_calculate failed (${response.status()}): ${statusText || '[no body]'}`,
      );
    }

    const errors = Array.isArray(data?.errors) ? data.errors : [];
    if (errors.length) {
      throw new Error(`/bulk_calculate returned errors: ${JSON.stringify(errors)}`);
    }
  }

  const payload: WaitForBulkResponseResult = { data, response, request, requestBody };
  if (onResponse) {
    await onResponse(payload);
  }
  return payload;
}

export type LoadFixtureOptions = WaitForBulkResponseOptions & {
  inputSelector?: string;
};

export async function loadFixture(
  page: Page,
  fixtureName: string,
  options: LoadFixtureOptions = {},
): Promise<WaitForBulkResponseResult & { fixturePath: string }>
{
  const { inputSelector = 'input[type="file"][accept=".json"]', ...waitOptions } = options;
  const fileInput = page.locator(inputSelector);
  await fileInput.waitFor({ state: 'attached' });

  const fixturePath = path.isAbsolute(fixtureName)
    ? fixtureName
    : resolveFixturePath(fixtureName);

  const result = await waitForBulkResponse(
    page,
    () => fileInput.setInputFiles(fixturePath),
    waitOptions,
  );

  return { ...result, fixturePath };
}

export function toNodeMap(nodes: FlowNode[] = []): Record<string, FlowNode> {
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

export function getNodeResult(data: RecalcResponse | null | undefined, nodeId: string): string {
  const map = toNodeMap(data?.nodes ?? []);
  const node = map[nodeId];
  return String(node?.data?.result ?? '');
}

export function stringifySteps(steps: unknown): string {
  if (steps === undefined) return 'undefined';
  return JSON.stringify(steps);
}

export async function ensureNodeVisible(page: Page, nodeId: string): Promise<Locator> {
  let node = page.locator(`[data-id="${nodeId}"]`).first();
  if ((await node.count()) === 0 || !(await node.isVisible())) {
    const searchToggle = page.getByTitle('Search nodes');
    await searchToggle.click();

    const searchInput = page.getByPlaceholder('Search node id, name, text');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(nodeId);
    await page.waitForTimeout(400);

    node = page.locator(`[data-id="${nodeId}"]`).first();
    const resultRow = page
      .locator(`div[role="button"]:has(span[title="${nodeId}"])`)
      .first();

    if ((await resultRow.count()) > 0) {
      await resultRow.click();
    } else {
      const fallbackRow = page
        .locator('div[role="button"]:has(strong:has-text("TXID → Reversed"))')
        .first();
      if (await fallbackRow.count()) {
        await fallbackRow.click();
      }
    }

    const closeButton = page.getByTitle('Close search');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await searchToggle.click();
    }

    node = page.locator(`[data-id="${nodeId}"]`).first();
  }

  await node.waitFor({ state: 'attached' });
  await node.scrollIntoViewIfNeeded();
  await expect(node).toBeVisible();
  return node;
}

export async function getEditableField(page: Page, nodeId: string): Promise<Locator> {
  const node = await ensureNodeVisible(page, nodeId);

  const textareas = node.locator('textarea');
  if (await textareas.count()) {
    const first = textareas.first();
    await expect(first).toBeVisible();
    return first;
  }

  const inputs = node.locator('input[type="text"], input:not([type]), input[type="number"]');
  if (await inputs.count()) {
    const first = inputs.first();
    await expect(first).toBeVisible();
    return first;
  }

  throw new Error(`Editable field not found for node ${nodeId}`);
}

export async function setEditableValue(page: Page, nodeId: string, newValue: string) {
  const field = await getEditableField(page, nodeId);
  await field.click({ timeout: 10_000, force: true });
  await field.fill(newValue ?? '');
  await field.evaluate((element) => {
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  });
}

export type ShareStubResponse = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delayMs?: number;
  onRequest?: (request: Request) => Promise<void> | void;
};

export async function stubShareFlow(
  page: Page,
  responses: ShareStubResponse | ShareStubResponse[],
  pattern = '**/share',
) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  await page.route(pattern, async (route) => {
    const config = queue.length > 1 ? queue.shift()! : queue[0] ?? {};
    if (config.onRequest) {
      await config.onRequest(route.request());
    }
    if (config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, config.delayMs));
    }

    const body = config.body ?? {
      id: 'share-e2e-id',
      url: 'https://share.local/s/share-e2e-id',
      bytes: 0,
    };

    await route.fulfill({
      status: config.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        ...config.headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  });
}

export async function readClipboard(page: Page) {
  return page.evaluate(async () => {
    const win = window as unknown as { __rawbitClipboard?: string };
    const fallback = () => (typeof win.__rawbitClipboard === 'string' ? win.__rawbitClipboard : '');

    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (typeof text === 'string') return text;
      }
    } catch {
      /* ignore and use fallback */
    }

    return fallback();
  });
}

export async function writeClipboard(page: Page, text: string) {
  await page.evaluate(async (value) => {
    const win = window as unknown as { __rawbitClipboard?: string };
    win.__rawbitClipboard = value;

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        /* swallow permission errors; fallback buffer already updated */
      }
    }
  }, text);
}

export async function prepareClipboardSpy(page: Page) {
  await page.evaluate(() => {
    const win = window as unknown as { __rawbitClipboard?: string };
    win.__rawbitClipboard = '';

    const record = (value: unknown) => {
      win.__rawbitClipboard = typeof value === 'string' ? value : String(value ?? '');
    };

    const clipboard = navigator.clipboard as (Clipboard & { __rawbitWrapped?: boolean }) | undefined;

    if (clipboard && !clipboard.__rawbitWrapped) {
      const originalWrite = clipboard.writeText?.bind(clipboard);
      const originalRead = clipboard.readText?.bind(clipboard);

      clipboard.writeText = async (value: string) => {
        record(value);
        if (originalWrite) {
          try {
            await originalWrite(value);
          } catch {
            /* ignore permission denials */
          }
        }
      };

      clipboard.readText = async () => {
        if (originalRead) {
          try {
            const text = await originalRead();
            record(text);
            return typeof text === 'string' ? text : fallbackValue();
          } catch {
            /* fall through */
          }
        }
        return fallbackValue();
      };

      clipboard.__rawbitWrapped = true;
      return;
    }

    if (!clipboard) {
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (value: string) => record(value),
            readText: async () => fallbackValue(),
          },
        });
      } catch {
        /* ignore - clipboard API not shimmed */
      }
    }

    function fallbackValue() {
      return typeof win.__rawbitClipboard === 'string' ? win.__rawbitClipboard : '';
    }
  });
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
