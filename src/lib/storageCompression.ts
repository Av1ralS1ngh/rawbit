import { compressToUTF16, decompressFromUTF16 } from "lz-string";

export const STORAGE_COMPRESSED_PREFIX = "lzjson:";

export function encodeStoragePayload<T>(value: T): string {
  const json = JSON.stringify(value);
  const compressed = compressToUTF16(json);
  if (typeof compressed === "string" && compressed.length > 0) {
    return `${STORAGE_COMPRESSED_PREFIX}${compressed}`;
  }
  return json;
}

export function decodeStoragePayload(payload: string): unknown {
  if (payload.startsWith(STORAGE_COMPRESSED_PREFIX)) {
    const compressed = payload.slice(STORAGE_COMPRESSED_PREFIX.length);
    const decompressed = decompressFromUTF16(compressed);
    if (typeof decompressed === "string") {
      return JSON.parse(decompressed);
    }
    throw new Error("Failed to decompress stored payload");
  }
  return JSON.parse(payload);
}
