import { FIELD_STRIDE, GROUP_STRIDE, INSTANCE_STRIDE } from "@/lib/utils";
import type { FieldDefinition, GroupDefinition, NodeData } from "@/types";

/** Returns the highest field index within a collection. */
export function maxFieldOrdinal(fields: FieldDefinition[]): number {
  return Math.max(...fields.map((f) => f.index));
}

/**
 * Determines whether the next group instance would still fit into the
 * allocated stride without overlapping neighbouring groups.
 */
export function canGrowGroup(
  base: number,
  offsets: number[],
  fields: FieldDefinition[]
): boolean {
  const next = offsets.length ? Math.max(...offsets) + INSTANCE_STRIDE : base;
  const blk = Math.floor(base / GROUP_STRIDE) * GROUP_STRIDE;
  return next + maxFieldOrdinal(fields) + FIELD_STRIDE <= blk + GROUP_STRIDE;
}

/** Returns the offset to use for the next group instance. */
export function getNextGapIndex(offsets: number[], base: number): number {
  return offsets.length ? Math.max(...offsets) + INSTANCE_STRIDE : base;
}

/** Counts visible input handles based on current group-instance keys. */
export function countVisibleInputs(data: NodeData): number {
  let total =
    data.inputStructure?.ungrouped?.filter((f) => !f.unconnectable).length ?? 0;
  total +=
    data.inputStructure?.afterGroups?.filter((f) => !f.unconnectable).length ?? 0;

  data.inputStructure?.groups?.forEach((group: GroupDefinition) => {
    const instanceCount = data.groupInstances?.[group.title] ?? 0;
    total += instanceCount * group.fields.filter((f) => !f.unconnectable).length;
  });

  Object.values(data.inputStructure?.betweenGroups ?? {}).forEach((fields) => {
    total += fields.filter((f) => !f.unconnectable).length;
  });

  return total;
}

/** Iterate over every concrete field instance rendered for the node. */
export function forEachFieldInstance(
  data: NodeData,
  callback: (absoluteIndex: number, field: FieldDefinition) => void
) {
  data.inputStructure?.ungrouped?.forEach((field) => {
    if (field.index !== undefined) callback(field.index, field);
  });

  data.inputStructure?.groups?.forEach((group: GroupDefinition) => {
    const keys = data.groupInstanceKeys?.[group.title];
    if (keys?.length) {
      keys.forEach((offset) => {
        group.fields.forEach((field) =>
          callback(offset + field.index, field)
        );
      });
      return;
    }

    const instanceCount = data.groupInstances?.[group.title] ?? 0;
    for (let i = 0; i < instanceCount; i += 1) {
      const offset = group.baseIndex + i * INSTANCE_STRIDE;
      group.fields.forEach((field) =>
        callback(offset + field.index, field)
      );
    }
  });

  Object.values(data.inputStructure?.betweenGroups ?? {}).forEach((fields) => {
    fields.forEach((field) => {
      if (field.index !== undefined) callback(field.index, field);
    });
  });

  data.inputStructure?.afterGroups?.forEach((field) => {
    if (field.index !== undefined) callback(field.index, field);
  });
}
