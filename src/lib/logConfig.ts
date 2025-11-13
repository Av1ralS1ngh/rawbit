/* ------------------------------------------------------------------ *
 * logConfig.ts – minimal logging utility with opt-in modules
 * ------------------------------------------------------------------ *
 *  • Flags live in `logConfig`.  Set to true to see a module’s logs.
 *  • In production builds the logger is always silent.
 *  • On the server (SSR, tests) logging is skipped automatically.
 * ------------------------------------------------------------------ */

export const logConfig = {
  /* master switch – enable every module at once (dev only) */
  logAll: false, // opt-in, never opt-out

  /* per-area flags */
  snapshots: false,
  nodeOperations: true,
  fileOps: false,
  copyPaste: false,
  debounce: false,
  flow: true,
  groupNode: false,
  edgeCopy: false,
} as const;

/* ------------------------------------------------------------------ */
/* Types & helpers                                                    */
/* ------------------------------------------------------------------ */

/** Valid module keys for the logger */
export type LogModule = keyof typeof logConfig;

/**
 * Cheap helper so callers can pre-compute:
 *   const dbg = enabled(\"snapshots\");
 *   if (dbg) { …heavy code… }
 */
export function enabled(m: LogModule): boolean {
  return !(
    (
      typeof window === "undefined" || // SSR / tests
      process.env.NODE_ENV === "production" || // production build
      !(logConfig.logAll || logConfig[m])
    ) // flag not enabled
  );
}

/**
 * Log a message (and optional payload) if the module is enabled.
 *
 * @param module  – logical area of the codebase
 * @param message – concise description
 * @param data    – optional extra object/string for the console
 */
export function log(module: LogModule, message: string, data?: unknown): void {
  if (!enabled(module)) return;

  const timestamp = new Date().toISOString().split("T")[1].slice(0, -1); // HH:MM:SS.mmm
  const prefix = `[${timestamp}][${module}]`;

   
  if (data === undefined) {
    console.log(prefix, message);
  } else {
    console.log(prefix, message, data);
  }
   
}
