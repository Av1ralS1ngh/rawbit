declare global {
  interface Window {
    turnstile?: {
      render: (container: string | Element, options?: { callback?: (token: string) => void }) => string | void;
      reset: (widgetId?: string) => void;
    };
  }
}

export {};
