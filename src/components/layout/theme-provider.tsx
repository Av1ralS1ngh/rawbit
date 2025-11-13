import { useEffect, useState } from "react";
import {
  Theme,
  ThemeProviderState,
  ThemeProviderContext,
} from "@/contexts/theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// This script will run before your React app mounts
// to prevent theme flashing
const setInitialTheme = (storageKey: string, defaultTheme: Theme) => {
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
  })();`;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [mounted, setMounted] = useState(false);

  // Set up the initial theme script
  useEffect(() => {
    // Only inject the script on client-side
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.textContent = setInitialTheme(storageKey, defaultTheme);
      script.id = "theme-initializer";

      const existingScript = document.getElementById("theme-initializer");
      if (!existingScript) {
        document.head.appendChild(script);
      }
    }

    setMounted(true);
  }, [defaultTheme, storageKey]);

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

  const value: ThemeProviderState = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
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
