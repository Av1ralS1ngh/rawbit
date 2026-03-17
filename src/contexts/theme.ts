import { createContext } from "react";

export type Theme = "dark" | "light" | "system";
export type Skin =
  | "shadcn"
  | "paper"
  | "midnight";

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  skin: Skin;
  setSkin: (skin: Skin) => void;
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);
