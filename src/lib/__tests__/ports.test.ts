import { describe, expect, it } from "vitest";
import { buildPorts } from "@/lib/nodes/ports";
import type { FlowNode } from "@/types";

describe("buildPorts", () => {
  it("returns handles for numInputs when no structure provided", () => {
    const node = {
      id: "simple",
      type: "calculation",
      position: { x: 0, y: 0 },
      data: {
        title: "Simple",
        numInputs: 2,
      },
    } as FlowNode;

    const ports = buildPorts(node);
    expect(ports.inputs.map((p) => p.handleId)).toEqual(["input-0", "input-1"]);
    expect(ports.outputs).toHaveLength(1);
  });

  it("includes grouped fields and removes duplicates", () => {
    const node = {
      id: "grouped",
      type: "calculation",
      position: { x: 0, y: 0 },
      data: {
        functionName: "concat_all",
        numInputs: 1,
        customFieldLabels: { 110: "Custom" },
        inputStructure: {
          ungrouped: [
            {
              index: 0,
              label: "Primary",
              allowEmptyBlank: false,
            },
          ],
          groups: [
            {
              title: "Recipients",
              baseIndex: 10,
              fields: [
                { index: 10, label: "Address", allowEmptyBlank: false },
                { index: 20, label: "Amount", allowEmptyBlank: false },
              ],
            },
          ],
          betweenGroups: {
            Recipients: [
              {
                index: 110,
                label: "Memo",
                allowEmptyBlank: false,
              },
            ],
          },
          afterGroups: [
            {
              index: 200,
              label: "Change",
              allowEmptyBlank: false,
            },
          ],
        },
        groupInstanceKeys: {
          Recipients: [0, 100],
        },
      },
    } as FlowNode;

    const ports = buildPorts(node);
    const handles = ports.inputs.map((p) => p.handleId);

    expect(handles).toEqual([
      "input-0",
      "input-10",
      "input-20",
      "input-110",
      "input-120",
      "input-200",
    ]);
    expect(new Set(handles).size).toBe(handles.length);
  });
});
