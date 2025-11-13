# Frontend End-to-End Tests

## Roundtrip Flows

- The Playwright suite drives the UI using prebuilt JSON fixtures. `tests/e2e/fixtures/hash-flow.json` is a minimal identity → `double_sha256_hex` graph for fast deterministic verification, while flows under `src/my_tx_flows/` (for example `p1_Intro_P2PKH_and_P2PK.json`) cover the canonical scenarios.
- `tests/e2e/flow.builder.spec.ts` uploads the hash flow, waits for the first `/bulk_calculate` response, edits the identity node, and asserts the backend payload contains the expected double SHA256 hash. The check is performed on the response JSON, not on rendered DOM text, to avoid flakiness.
- `tests/e2e/flow.roundtrip.spec.ts` iterates through the hash flow and the saved `p1` flow. For each scenario it captures a baseline graph (falling back to the fixture payload when the upload doesn’t trigger `/bulk_calculate`), applies the same `node_changes` used in the backend regression suite, confirms the backend result diverges, then restores only those modified nodes and verifies the response returns to the baseline (TXID and, when applicable, script/debug steps).
- Each scenario runs serially with a 60 s timeout (`test.setTimeout(60_000)`) to give complex flows enough breathing room without hiding hangs.
- Ensure the backend is running locally (`python backend/routes.py`) before executing `npm run test:e2e`; otherwise the `/bulk_calculate` requests will time out.

## UI Interaction Coverage

- `tests/e2e/app.smoke.spec.ts` exercises the shell boot sequence and asserts the sidebar, toolbar, and canvas render with the expected accessibility hooks.
- `tests/e2e/topbar.interactions.spec.ts` drives the global chrome (sidebar toggle, search panel visibility, theme persistence) to ensure top-level state serialises via local storage.
- `tests/e2e/canvas.minimap.spec.ts` verifies imported flows trigger `fitView` and that the minimap correctly toggles/offsets when right-hand panels open.
- `tests/e2e/sidebar.palette.spec.ts` covers sidebar search, drag-and-drop creation, and undo/redo history integration for freshly dropped nodes.
- `tests/e2e/grouping.color.spec.ts` confirms group/ungroup behaviour, marquee selection mode, and the colour palette—including undo snapshots for style changes.
- `tests/e2e/node.backend.spec.ts` routes `/bulk_calculate` to simulate backend validation errors, checks the top-bar badge, error panel affordances, and clipboard copy feedback.
- `tests/e2e/flow.manual-wiring.spec.ts` walks through the connect dialog’s manual wiring mode. When the optional share service is disabled (default OSS setup) the Turnstile branch is skipped.
- `tests/e2e/script.debug.persistence.spec.ts` verifies script debug steps persist across reloads and share/load cycles.
- `tests/e2e/tabs.clipboard.spec.ts` confirms copy/paste across tabs, tooltip updates, and selection persistence after history navigation.
- `tests/e2e/panels.autoclose.spec.ts` ensures error/search panels auto-close when conditions clear or tabs switch.
- `tests/e2e/undo.snapshots.spec.ts` runs through grouped edits to confirm snapshot scheduling and undo history operate as expected.
- `tests/e2e/connect.share.spec.ts` drives the sharing dialog end-to-end and therefore requires a share service (`VITE_SHARE_BASE_URL`) plus Turnstile keys. When those env vars are absent the spec is skipped.
- `tests/e2e/file.accessibility.spec.ts` validates keyboard navigation and ARIA hooks for the file menu, simplified save prompt, and context actions.
- `tests/e2e/welcome.dialog.spec.ts` covers the first-run modal: dismissing tips, loading example flows, and ensuring the “seen” flag persists across reloads.
- Shared helpers live in `tests/e2e/utils.ts`; they provide fixture loading, bulk-response harnesses, node-edit helpers, and share stubs to keep specs concise.
