declare global {
  const __APP_VERSION__: string;
  interface Window {
    __RAWBIT_VERSION__?: string;
  }
}

export {};
