let patched = false;

/**
 * Safari/WebKit can spam "ResizeObserver loop completed with undelivered notifications"
 * when a resize callback mutates layout synchronously. Wrapping the callback in
 * requestAnimationFrame breaks the sync loop while keeping the observer intact.
 */
export function patchResizeObserver() {
  if (patched) return;
  if (typeof window === "undefined" || typeof window.ResizeObserver === "undefined")
    return;

  const OriginalResizeObserver = window.ResizeObserver;
  const descriptor = Object.getOwnPropertyDescriptor(window, "ResizeObserver");
  const isWritable =
    !descriptor || descriptor.writable === true || descriptor.configurable === true;
  if (!isWritable) {
    // In some test/jsdom environments ResizeObserver is non-writable; bail quietly.
    return;
  }
  const raf =
    window.requestAnimationFrame ||
    ((cb: FrameRequestCallback) => window.setTimeout(cb, 16));
  const caf =
    window.cancelAnimationFrame || ((id: number) => window.clearTimeout(id));

  try {
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        let frame = 0;
        const wrapped = (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
          if (frame) caf(frame);
          frame = raf(() => callback(entries, observer));
        };
        super(wrapped);
      }
    };
  } catch {
    // If assignment fails (frozen global), leave the native observer untouched.
    return;
  }

  patched = true;
}
