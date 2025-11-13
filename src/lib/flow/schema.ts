export const FLOW_SCHEMA_VERSION = 1 as const;

export const SUPPORTED_FLOW_SCHEMA_VERSIONS = new Set<number>([
  FLOW_SCHEMA_VERSION,
]);

export const MAX_FLOW_BYTES = 5 * 1024 * 1024;

const encoder = new TextEncoder();

export function measureFlowBytes(payload: string): number {
  return encoder.encode(payload).length;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : value < 10 ? 2 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}
