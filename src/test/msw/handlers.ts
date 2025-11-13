import { http, HttpResponse } from "msw";

type BulkCalculatePayload = {
  nodes?: unknown[];
  edges?: unknown[];
  version?: number;
};

type ShareRequestPayload = {
  name?: string;
  nodes?: unknown[];
  edges?: unknown[];
  schemaVersion?: number;
};

const sharedFlows = new Map<string, ShareRequestPayload>();

const TEST_BUILD_VERSION = __APP_VERSION__ || "test-build";
const DEFAULT_LIMITS_PAYLOAD = {
  maxPayloadBytes: 5 * 1024 * 1024,
  calculationTimeoutSeconds: 5,
  calculationTimeBudgetSeconds: 10,
  calculationTimeWindowSeconds: 60,
};

export const apiHandlers = {
  bulkCalculate: () =>
    http.post("*/bulk_calculate", async ({ request }) => {
      const body = (await request.json()) as BulkCalculatePayload;
      const { nodes = [], version = 0 } = body ?? {};
      return HttpResponse.json({ nodes, version, errors: [] });
    }),
  shareFlow: () =>
    http.post("*/share", async ({ request }) => {
      const payload = (await request.json()) as ShareRequestPayload;
      const id =
        (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto)
          ? globalThis.crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10);
      sharedFlows.set(id, payload);
      return HttpResponse.json({ id, url: `https://share.local/s/${id}`, bytes: JSON.stringify(payload ?? {}).length });
    }),
  loadShared: () =>
    http.get("*/s/:id", ({ params }) => {
      const id = params.id as string;
      if (!sharedFlows.has(id)) {
        return HttpResponse.json({ error: "not_found" }, { status: 404 });
      }
      return HttpResponse.json(sharedFlows.get(id));
    }),
  healthz: () =>
    http.get("*/healthz", () =>
      HttpResponse.json({
        ok: true,
        version: TEST_BUILD_VERSION,
        limits: DEFAULT_LIMITS_PAYLOAD,
      })
    ),
};

export const handlers = [
  apiHandlers.bulkCalculate(),
  apiHandlers.shareFlow(),
  apiHandlers.loadShared(),
  apiHandlers.healthz(),
];

export function seedSharedFlow(id: string, payload: ShareRequestPayload) {
  sharedFlows.set(id, payload);
}

export function clearSharedFlows() {
  sharedFlows.clear();
}
