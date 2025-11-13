import { useCallback, useEffect, useRef } from "react";

type AutoRefreshArgs = {
  tabs: { id: string }[];
  saveTabData: (tabId: string) => void;
  onReload?: () => void;
  disableVersionPolling?: boolean;
};

const VERSION_ENDPOINT = "/healthz";
const VERSION_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const HIDDEN_IDLE_THRESHOLD_MS = 60 * 1000; // 1 minute
const NEEDS_RELOAD_KEY = "rawbit:needsReload";
const LAST_CHECK_KEY = "rawbit:lastVersionCheck";
const LAST_HIDDEN_KEY = "rawbit:lastHiddenAt";
const LOCAL_BUILD_VERSION = __APP_VERSION__ || "dev";

function markNeedsReload() {
  try {
    window.localStorage.setItem(NEEDS_RELOAD_KEY, "1");
  } catch (error) {
    console.warn("Failed to persist reload flag", error);
  }
}

function getCurrentBuildVersion() {
  if (typeof window !== "undefined" && window.__RAWBIT_VERSION__) {
    return window.__RAWBIT_VERSION__;
  }
  return LOCAL_BUILD_VERSION;
}

function clearNeedsReload() {
  try {
    window.localStorage.removeItem(NEEDS_RELOAD_KEY);
  } catch (error) {
    console.warn("Failed to clear reload flag", error);
  }
}

async function fetchVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_ENDPOINT, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload && typeof payload.version === "string") {
      return payload.version;
    }
  } catch (error) {
    console.warn("Version check failed", error);
  }
  return null;
}

export function useAutoRefreshVersion({
  tabs,
  saveTabData,
  onReload,
  disableVersionPolling = false,
}: AutoRefreshArgs) {
  const reloadingRef = useRef(false);

  const triggerReload = useCallback(() => {
    if (typeof window === "undefined") return;
    if (reloadingRef.current) return;
    reloadingRef.current = true;

    try {
      tabs.forEach((tab) => {
        if (tab?.id) {
          saveTabData(tab.id);
        }
      });
    } catch (error) {
      console.error("Failed to persist tabs before reload", error);
    } finally {
      clearNeedsReload();
      if (onReload) {
        onReload();
      } else {
        window.location.reload();
      }
    }
  }, [onReload, saveTabData, tabs]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        try {
          window.localStorage.setItem(LAST_HIDDEN_KEY, String(Date.now()));
        } catch (error) {
          console.warn("Failed to store last hidden timestamp", error);
        }
        return;
      }

      if (document.visibilityState !== "visible") return;

      try {
        const needsReload =
          window.localStorage.getItem(NEEDS_RELOAD_KEY) === "1";
        if (!needsReload) return;

        const rawLastHidden = window.localStorage.getItem(LAST_HIDDEN_KEY);
        if (!rawLastHidden) return;

        const lastHidden = Number(rawLastHidden);
        if (!Number.isFinite(lastHidden)) return;
        if (Date.now() - lastHidden < HIDDEN_IDLE_THRESHOLD_MS) {
          return;
        }

        triggerReload();
      } catch (error) {
        console.warn("Failed to evaluate reload condition", error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [triggerReload]);

  useEffect(() => {
    if (
      disableVersionPolling ||
      typeof window === "undefined" ||
      typeof window.fetch !== "function"
    ) {
      return;
    }

    let cancelled = false;

    const setLastCheckTimestamp = () => {
      try {
        window.localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
      } catch (error) {
        console.warn("Failed to store version check timestamp", error);
      }
    };

    const runCheck = async () => {
      if (cancelled) return;
      const version = await fetchVersion();
      if (cancelled || version == null) {
        setLastCheckTimestamp();
        return;
      }
      if (version !== getCurrentBuildVersion()) {
        markNeedsReload();
      }
      setLastCheckTimestamp();
    };

    const maybeCheck = () => {
      try {
        const rawValue = window.localStorage.getItem(LAST_CHECK_KEY);
        const lastCheck = rawValue ? Number(rawValue) : NaN;
        if (
          !Number.isFinite(lastCheck) ||
          Date.now() - lastCheck >= VERSION_CHECK_INTERVAL_MS
        ) {
          void runCheck();
        }
      } catch (error) {
        console.warn("Failed to inspect last version check", error);
        void runCheck();
      }
    };

    maybeCheck();
    const interval = window.setInterval(maybeCheck, VERSION_CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [disableVersionPolling]);
}
