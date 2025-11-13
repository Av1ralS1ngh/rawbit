/// <reference lib="webworker" />
import { encodeStoragePayload } from "@/lib/storageCompression";
import type {
  CompressTabRequest,
  CompressTabResponse,
} from "./tabsCompression.types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<CompressTabRequest>) => {
  const message = event.data;
  if (!message || message.type !== "compress-tab") return;

  const respond = (response: CompressTabResponse) => {
    self.postMessage(response);
  };

  try {
    const encoded = encodeStoragePayload(message.payload);
    respond({
      type: "compress-tab-result",
      requestId: message.requestId,
      tabId: message.tabId,
      data: encoded,
    });
  } catch (error) {
    respond({
      type: "compress-tab-result",
      requestId: message.requestId,
      tabId: message.tabId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
