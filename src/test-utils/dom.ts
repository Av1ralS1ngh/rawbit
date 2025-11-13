import { vi } from "vitest";
import type { Mock } from "vitest";

export type MockCleanup = () => void;

type MaybeCleanup = MockCleanup | void | undefined;

function cleanupAll(cleanups: MaybeCleanup[]): void {
  cleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") {
      cleanup();
    }
  });
}

export function ensureMatchMedia(): MockCleanup | undefined {
  const globalObject = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => MediaQueryList;
  };
  const windowObject = (globalThis as typeof globalThis & {
    window?: (Window & { matchMedia?: (query: string) => MediaQueryList }) | undefined;
  }).window;
  const originalWindowMatchMedia = windowObject?.matchMedia;

  if (typeof globalObject.matchMedia === "function") {
    return undefined;
  }

  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === "function") {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      } else if (listener && "handleEvent" in listener && typeof listener.handleEvent === "function") {
        listeners.add((event: MediaQueryListEvent) => listener.handleEvent(event));
      }
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === "function") {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      } else if (listener && "handleEvent" in listener && typeof listener.handleEvent === "function") {
        listeners.forEach((registered) => {
          if (registered === listener.handleEvent) {
            listeners.delete(registered);
          }
        });
      }
    },
    dispatchEvent: (event: Event) => {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
      return true;
    },
  });

  globalObject.matchMedia = matchMedia;
  if (windowObject) {
    windowObject.matchMedia = matchMedia;
  }

  return () => {
    Reflect.deleteProperty(globalObject, "matchMedia");
    if (windowObject) {
      if (originalWindowMatchMedia) {
        windowObject.matchMedia = originalWindowMatchMedia;
      } else {
        Reflect.deleteProperty(windowObject, "matchMedia");
      }
    }
    listeners.clear();
  };
}

export function ensureResizeObserver(): MockCleanup | undefined {
  if ("ResizeObserver" in globalThis) {
    return undefined;
  }

  class StubResizeObserver implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element): void {
      this.callback([], this);
      void target;
    }

    unobserve(): void {
      // no-op
    }

    disconnect(): void {
      // no-op
    }
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: StubResizeObserver,
  });

  return () => {
    Reflect.deleteProperty(globalThis, "ResizeObserver");
  };
}

export function ensureStructuredClone(): MockCleanup | undefined {
  const target = globalThis as typeof globalThis & {
    structuredClone?: <T>(value: T) => T;
  };

  if (typeof target.structuredClone === "function") {
    return undefined;
  }

  const fallback = <T>(value: T): T =>
    value == null ? value : (JSON.parse(JSON.stringify(value)) as T);

  target.structuredClone = fallback;

  return () => {
    Reflect.deleteProperty(target, "structuredClone");
  };
}

export function ensureLocalStorage(initial: Record<string, string> = {}): MockCleanup | undefined {
  const globalObject = globalThis as typeof globalThis & {
    localStorage?: Storage;
  };

  if (globalObject.localStorage) {
    return undefined;
  }

  const store = new Map<string, string>(Object.entries(initial));

  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalObject, "localStorage", {
    configurable: true,
    value: storage,
  });

  return () => {
    Reflect.deleteProperty(globalObject, "localStorage");
  };
}

export function ensureClipboard(): MockCleanup | undefined {
  const navigatorObject = globalThis.navigator as Navigator & {
    clipboard?: Clipboard;
  };

  if (navigatorObject.clipboard) {
    return undefined;
  }

  let stored = "";

  const clipboard = Object.assign(new EventTarget(), {
    read: async () => [] as ClipboardItem[],
    write: async (_items: ClipboardItem[]) => {
      void _items;
    },
    readText: async () => stored,
    writeText: async (value: string) => {
      stored = value;
    },
  }) as Clipboard;

  Object.defineProperty(navigatorObject, "clipboard", {
    configurable: true,
    value: clipboard,
  });

  return () => {
    Reflect.deleteProperty(navigatorObject, "clipboard");
    stored = "";
  };
}

export function ensureRequestIdleCallback(): MockCleanup | undefined {
  const target = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (typeof target.requestIdleCallback === "function") {
    return undefined;
  }

  let lastHandle = 0;
  const handleMap = new Map<number, ReturnType<typeof setTimeout>>();

  const requestIdleCallback = (cb: IdleRequestCallback, options?: IdleRequestOptions) => {
    const timeout = options?.timeout ?? 200;
    const handle = ++lastHandle;
    const id = setTimeout(() => {
      handleMap.delete(handle);
      const start = Date.now();
      const deadline: IdleDeadline = {
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      };
      cb(deadline);
    }, timeout);

    handleMap.set(handle, id);
    return handle;
  };

  const cancelIdleCallback = (handle: number) => {
    const timeoutId = handleMap.get(handle);
    if (timeoutId) {
      clearTimeout(timeoutId);
      handleMap.delete(handle);
    }
  };

  target.requestIdleCallback = requestIdleCallback;
  target.cancelIdleCallback = cancelIdleCallback;

  return () => {
    handleMap.forEach((timeoutId) => clearTimeout(timeoutId));
    handleMap.clear();
    Reflect.deleteProperty(target, "requestIdleCallback");
    Reflect.deleteProperty(target, "cancelIdleCallback");
  };
}

export function ensureExecCommand(): MockCleanup | undefined {
  const documentObject = document as Document & {
    execCommand?: (commandId: string, showUI?: boolean, value?: string) => boolean;
  };

  if (typeof documentObject.execCommand === "function") {
    return undefined;
  }

  documentObject.execCommand = () => true;

  return () => {
    Reflect.deleteProperty(documentObject, "execCommand");
  };
}

export function installDomMocks(): MockCleanup {
  const cleanups: MaybeCleanup[] = [
    ensureMatchMedia(),
    ensureResizeObserver(),
    ensureStructuredClone(),
    ensureLocalStorage(),
    ensureClipboard(),
    ensureRequestIdleCallback(),
    ensureExecCommand(),
  ];

  return () => cleanupAll(cleanups);
}

export function mockMatchMedia(options: { matches?: boolean } = {}): MockCleanup {
  const globalObject = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => MediaQueryList;
  };
  const windowObject = (globalThis as typeof globalThis & {
    window?: (Window & { matchMedia?: (query: string) => MediaQueryList }) | undefined;
  }).window;
  const original = globalObject.matchMedia;
  const originalWindow = windowObject?.matchMedia;

  const stub = (query: string) => ({
    matches: options.matches ?? false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  });

  globalObject.matchMedia = stub;
  if (windowObject) {
    windowObject.matchMedia = stub;
  }

  return () => {
    if (original) {
      globalObject.matchMedia = original;
    } else {
      Reflect.deleteProperty(globalObject, "matchMedia");
    }
    if (windowObject) {
      if (originalWindow) {
        windowObject.matchMedia = originalWindow;
      } else {
        Reflect.deleteProperty(windowObject, "matchMedia");
      }
    }
  };
}

export interface ClipboardMockResult {
  clipboard: Clipboard;
  restore: MockCleanup;
  writeText: Mock<(text: string) => Promise<void>>;
}

export function mockClipboard(): ClipboardMockResult {
  const navigatorObject = globalThis.navigator as Navigator & {
    clipboard?: Clipboard;
  };
  const original = navigatorObject.clipboard;

  let stored = "";
  const writeText = vi.fn(async (value: string) => {
    stored = value;
  });

  const clipboard = Object.assign(new EventTarget(), {
    read: async () => [] as ClipboardItem[],
    write: async (_items: ClipboardItem[]) => {
      void _items;
    },
    readText: async () => stored,
    writeText,
  }) as Clipboard;

  Object.defineProperty(navigatorObject, "clipboard", {
    configurable: true,
    value: clipboard,
  });

  return {
    clipboard,
    writeText,
    restore: () => {
      stored = "";
      if (original) {
        Object.defineProperty(navigatorObject, "clipboard", {
          configurable: true,
          value: original,
        });
      } else {
        Reflect.deleteProperty(navigatorObject, "clipboard");
      }
    },
  };
}

export interface RequestIdleCallbackMock {
  callbacks: Array<{ handle: number; callback: IdleRequestCallback }>;
  restore: MockCleanup;
  triggerAll: () => void;
}

export function mockRequestIdleCallback(): RequestIdleCallbackMock {
  const target = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  const originalRequest = target.requestIdleCallback;
  const originalCancel = target.cancelIdleCallback;

  let handle = 0;
  const callbacks: RequestIdleCallbackMock["callbacks"] = [];

  target.requestIdleCallback = (cb: IdleRequestCallback) => {
    const current = ++handle;
    callbacks.push({ handle: current, callback: cb });
    return current;
  };

  target.cancelIdleCallback = (id: number) => {
    const index = callbacks.findIndex((item) => item.handle === id);
    if (index >= 0) {
      callbacks.splice(index, 1);
    }
  };

  return {
    callbacks,
    triggerAll: () => {
      while (callbacks.length) {
        const { callback } = callbacks.shift()!;
        callback({
          didTimeout: false,
          timeRemaining: () => 10,
        });
      }
    },
    restore: () => {
      if (originalRequest) {
        target.requestIdleCallback = originalRequest;
      } else {
        Reflect.deleteProperty(target, "requestIdleCallback");
      }
      if (originalCancel) {
        target.cancelIdleCallback = originalCancel;
      } else {
        Reflect.deleteProperty(target, "cancelIdleCallback");
      }
    },
  };
}

export function createDataTransfer(initialData: Record<string, string> = {}): DataTransfer {
  const store = new Map<string, string>(Object.entries(initialData));

  const dataTransfer: DataTransfer = {
    dropEffect: "move",
    effectAllowed: "all",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    get types() {
      return Array.from(store.keys()) as readonly string[];
    },
    setData: (format: string, data: string) => {
      store.set(format, data);
    },
    getData: (format: string) => store.get(format) ?? "",
    clearData: (format?: string) => {
      if (format) {
        store.delete(format);
      } else {
        store.clear();
      }
    },
    setDragImage: (_image: Element, _x: number, _y: number) => {
      void _image;
      void _x;
      void _y;
    },
  } as DataTransfer;

  return dataTransfer;
}
