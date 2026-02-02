import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

import { expect, test } from '@playwright/test';

import type { CalculationNodeData } from '@/types';
import {
  ensureNodeVisible,
  gotoEditor,
  repoRoot,
  setEditableValue,
  stringifySteps,
  toNodeMap,
  waitForBulkResponse,
} from './utils';

type Scenario = {
  name: string;
  relativePath: string;
  nodeChanges: Record<string, string>;
  txidNode: string;
  scriptNode: string;
};

const FLOW_SCENARIOS: Scenario[] = [
  {
    name: 'hash-roundtrip',
    relativePath: path.join('tests', 'e2e', 'fixtures', 'hash-flow.json'),
    nodeChanges: {
      node_input: 'deadbeef',
    },
    txidNode: 'node_hash',
    scriptNode: 'node_hash',
  },
  {
    name: 'p1_Intro_P2PKH_and_P2PK',
    relativePath: path.join('src', 'my_tx_flows', 'p1_Intro_P2PKH_and_P2PK.json'),
    nodeChanges: {
      node_8QSOHj19: '3',
      node_IRajBmor: '144900',
    },
    txidNode: 'node_Jev5NWr0',
    scriptNode: 'node_xXU31KtR',
  },
  {
    name: 'p13_Taproot_MultiSig',
    relativePath: path.join('src', 'my_tx_flows', 'p13_Taproot_MultiSig.json'),
    nodeChanges: {
      node_FZ9oWjOJ: '187000',
    },
    txidNode: 'node_0d7XluIl',
    scriptNode: 'node_KfX3PTyG',
  },
];

test.describe.configure({ mode: 'serial' });

test.describe('Flow roundtrip regression (E2E)', () => {
  for (const scenario of FLOW_SCENARIOS) {
    test(scenario.name, async ({ page }) => {
      test.setTimeout(120_000);

      await gotoEditor(page);

      const fileInput = page.locator('input[type="file"][accept=".json"]');
      await fileInput.waitFor({ state: 'attached' });

      const absolutePath = path.resolve(repoRoot, scenario.relativePath);
      const fixtureData = JSON.parse(readFileSync(absolutePath, 'utf8'));

      let baseline;
      try {
        const baselineResult = await waitForBulkResponse(
          page,
          () => fileInput.setInputFiles(absolutePath),
          { timeoutMs: 5_000 },
        );
        baseline = baselineResult.data;
      } catch {
        baseline = fixtureData;
        await page.waitForTimeout(500);
      }

      const baselineMap = toNodeMap(baseline.nodes);
      const originalTxid = String(baselineMap[scenario.txidNode]?.data?.result ?? '');
      const originalScriptData = baselineMap[scenario.scriptNode]?.data ?? {};
      const originalScriptResult = String(originalScriptData.result ?? '');
      const originalScriptSteps = stringifySteps(originalScriptData.scriptDebugSteps);

      if (scenario.name === 'hash-roundtrip') {
        expect(originalTxid).toBe(doubleSha256Hex('68656c6c6f'));
      }

      const originalInputs = new Map<string, string>();
      for (const [nodeId] of Object.entries(scenario.nodeChanges)) {
        originalInputs.set(nodeId, getInputValue(baselineMap[nodeId]?.data));
      }

      await ensureNodeVisible(page, scenario.txidNode);
      const resultLocator = page
        .locator(`[data-id="${scenario.txidNode}"] [data-testid="node-result"]`)
        .first();
      await expect(resultLocator).toBeVisible({ timeout: 10_000 });

      let latestResponse = baseline;
      for (const [nodeId, newValue] of Object.entries(scenario.nodeChanges)) {
        const result = await waitForBulkResponse(
          page,
          () => setEditableValue(page, nodeId, newValue),
          { timeoutMs: 120_000 },
        );
        latestResponse = result.data;
      }

      const modifiedMap = toNodeMap(latestResponse.nodes);
      const modifiedTxid = String(modifiedMap[scenario.txidNode]?.data?.result ?? '');
      expect(modifiedTxid).not.toBe(originalTxid);

      const modifiedScriptData = modifiedMap[scenario.scriptNode]?.data ?? {};
      const modifiedScriptResult = String(modifiedScriptData.result ?? '');
      const modifiedScriptSteps = stringifySteps(modifiedScriptData.scriptDebugSteps);
      expect(
        modifiedScriptResult !== originalScriptResult ||
          modifiedScriptSteps !== originalScriptSteps,
      ).toBe(true);

      let finalResponse = latestResponse;
      for (const [nodeId, originalValue] of originalInputs) {
        const result = await waitForBulkResponse(
          page,
          () => setEditableValue(page, nodeId, originalValue),
          { timeoutMs: 120_000 },
        );
        finalResponse = result.data;
      }

      const finalMap = toNodeMap(finalResponse.nodes);
      expect(String(finalMap[scenario.txidNode]?.data?.result ?? '')).toBe(originalTxid);

      const finalScriptData = finalMap[scenario.scriptNode]?.data ?? {};
      expect(String(finalScriptData.result ?? '')).toBe(originalScriptResult);
      if (scenario.scriptNode === scenario.txidNode) {
        expect(stringifySteps(finalScriptData.scriptDebugSteps)).toBe(originalScriptSteps);
      }
    });
  }
});

function getInputValue(
  nodeData: CalculationNodeData | Record<string, unknown> | undefined
): string {
  if (!nodeData) return '';
  const inputs = nodeData.inputs as { val?: unknown; vals?: Record<string, string> } | undefined;
  if (typeof inputs?.val === 'string') return inputs.val;
  if (inputs?.vals && typeof inputs.vals === 'object') {
    const firstKey = Object.keys(inputs.vals)[0];
    if (firstKey !== undefined) return inputs.vals[firstKey];
  }
  return String(nodeData.value ?? '');
}

function doubleSha256Hex(hex: string) {
  const first = createHash('sha256').update(Buffer.from(hex, 'hex')).digest();
  return createHash('sha256').update(first).digest('hex');
}
