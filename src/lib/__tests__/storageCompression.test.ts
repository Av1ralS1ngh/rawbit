import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_COMPRESSED_PREFIX,
  decodeStoragePayload,
  encodeStoragePayload,
} from "../storageCompression";
import * as lzString from "lz-string";

vi.mock("lz-string", async () => {
  const actual = await vi.importActual<typeof import("lz-string")>("lz-string");
  return {
    ...actual,
    compressToUTF16: vi.fn(actual.compressToUTF16),
    decompressFromUTF16: vi.fn(actual.decompressFromUTF16),
  };
});

describe("storageCompression", () => {
  const lzMock = vi.mocked(lzString);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("round-trips JSON payloads with compression prefix", () => {
    const value = { foo: "bar", count: 2 };
    const encoded = encodeStoragePayload(value);
    expect(encoded.startsWith(STORAGE_COMPRESSED_PREFIX)).toBe(true);

    const decoded = decodeStoragePayload(encoded);
    expect(decoded).toEqual(value);
  });

  it("falls back to JSON stringify when compression returns empty output", () => {
    lzMock.compressToUTF16.mockReturnValueOnce("");

    const encoded = encodeStoragePayload({ foo: "bar" });
    expect(encoded).toBe(JSON.stringify({ foo: "bar" }));
  });

  it("decodes plain JSON without compression prefix", () => {
    const payload = JSON.stringify({ hello: "world" });
    const decoded = decodeStoragePayload(payload);
    expect(decoded).toEqual({ hello: "world" });
  });

  it("throws when compressed payload cannot be decompressed", () => {
    lzMock.decompressFromUTF16.mockReturnValueOnce(null as unknown as string);

    expect(() =>
      decodeStoragePayload(`${STORAGE_COMPRESSED_PREFIX}!`)
    ).toThrow("Failed to decompress stored payload");
  });
});
