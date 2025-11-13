import { beforeEach, describe, expect, it } from "vitest";
import {
  ingestScriptSteps,
  hydrateNodesWithScriptSteps,
  getScriptSteps,
  snapshotScriptSteps,
  restoreScriptSteps,
  removeScriptSteps,
} from "@/lib/share/scriptStepsCache";
import type { FlowNode } from "@/types";
import { buildScriptExecutionResult, buildStepData } from "@/test-utils/types";

describe("scriptStepsCache", () => {
  beforeEach(() => {
    restoreScriptSteps([]);
  });

  it("ingests script steps without mutating the original node", () => {
    const scriptResult = buildScriptExecutionResult({
      steps: [buildStepData({ opcode_name: "TRACE" })],
    });
    const original: FlowNode = {
      id: "node-1",
      type: "calculation",
      position: { x: 0, y: 0 },
      data: {
        functionName: "script_verification",
        scriptDebugSteps: scriptResult,
      },
    } as FlowNode;

    const ingested = ingestScriptSteps([original]);

    expect(getScriptSteps("node-1")).toEqual(scriptResult);
    expect(ingested[0].data?.scriptDebugSteps).toBeUndefined();
    expect(original.data?.scriptDebugSteps).toEqual(scriptResult);
  });

  it("hydrates nodes with cached script steps", () => {
    const nodes: FlowNode[] = [
      {
        id: "node-2",
        type: "calculation",
        position: { x: 0, y: 0 },
        data: { functionName: "identity" },
      } as FlowNode,
    ];

    const cachedResult = buildScriptExecutionResult({
      steps: [buildStepData({ opcode_name: "TEST" })],
    });

    ingestScriptSteps([
      {
        ...nodes[0],
        data: {
          ...nodes[0].data,
          scriptDebugSteps: cachedResult,
        },
      } as FlowNode,
    ]);

    const hydrated = hydrateNodesWithScriptSteps(nodes);

    expect(hydrated[0].data?.scriptDebugSteps).toEqual(cachedResult);
    expect(nodes[0].data?.scriptDebugSteps).toBeUndefined();
  });

  it("supports snapshot and restore cycles", () => {
    const fooResult = buildScriptExecutionResult({
      steps: [buildStepData({ opcode_name: "FOO" })],
    });

    ingestScriptSteps([
      {
        id: "node-3",
        type: "calculation",
        position: { x: 0, y: 0 },
        data: {
          scriptDebugSteps: fooResult,
        },
      } as FlowNode,
    ]);

    const snapshot = snapshotScriptSteps();
    removeScriptSteps("node-3");
    expect(getScriptSteps("node-3")).toBeNull();

    restoreScriptSteps(snapshot);
    expect(getScriptSteps("node-3")).toEqual(fooResult);
  });
});
