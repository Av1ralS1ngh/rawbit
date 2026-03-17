import { useEffect, useState } from "react";
import {
  Theme,
  Skin,
  ThemeProviderState,
  ThemeProviderContext,
} from "@/contexts/theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  skinStorageKey?: string;
};

const VALID_SKINS: readonly Skin[] = [
  "shadcn",
  "paper",
  "midnight",
];

function normalizeSkin(value: string | null): Skin {
  if (value === "default") {
    return "shadcn";
  }
  if (value && VALID_SKINS.includes(value as Skin)) {
    return value as Skin;
  }
  return "shadcn";
}

// This script will run before your React app mounts
// to prevent theme flashing
const setInitialTheme = (
  storageKey: string,
  defaultTheme: Theme,
  skinStorageKey: string
) => {
  const validSkins = JSON.stringify(VALID_SKINS);
  // This function will be converted to a string and injected into a script tag
  return `(function() {
    const getStoredTheme = () => localStorage.getItem('${storageKey}');
    const getSystemTheme = () => {
      if (typeof window.matchMedia !== 'function') {
        return 'light';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const storedTheme = getStoredTheme();
    const theme = storedTheme ? storedTheme : '${defaultTheme}';
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

    document.documentElement.classList.add(resolvedTheme);

    var validSkins = ${validSkins};
    var rawSkin = localStorage.getItem('${skinStorageKey}');
    var migratedSkin = rawSkin === 'default' ? 'shadcn' : rawSkin;
    var skin = validSkins.includes(migratedSkin) ? migratedSkin : 'shadcn';
    if (skin !== rawSkin) {
      localStorage.setItem('${skinStorageKey}', skin);
    }
    document.documentElement.dataset.skin = skin;
  })();`;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  skinStorageKey = "vite-ui-skin",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [skin, setSkin] = useState<Skin>(() =>
    normalizeSkin(localStorage.getItem(skinStorageKey))
  );
  const [mounted, setMounted] = useState(false);

  // Set up the initial theme script
  useEffect(() => {
    // Only inject the script on client-side
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.textContent = setInitialTheme(storageKey, defaultTheme, skinStorageKey);
      script.id = "theme-initializer";

      const existingScript = document.getElementById("theme-initializer");
      if (!existingScript) {
        document.head.appendChild(script);
      }
    }

    setMounted(true);
  }, [defaultTheme, storageKey, skinStorageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.dataset.skin = skin;
  }, [skin, mounted]);

  const value: ThemeProviderState = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    skin,
    setSkin: (skin: Skin) => {
      const normalizedSkin = normalizeSkin(skin);
      localStorage.setItem(skinStorageKey, normalizedSkin);
      setSkin(normalizedSkin);
    },
  };

  // Avoid theme flashing by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
