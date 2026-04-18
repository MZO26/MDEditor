import type { ThemeConfig } from "../shared/types";

// This file defines a mapping between the themes available in the application and the corresponding system theme that should be applied. This is used to determine which system theme (light or dark) should be applied based on the user's selected theme in the application.
const THEME_MAP = {
  light: "light",
  dark: "dark",
  "dark-glass": "dark",
  "light-glass": "light",
  paper: "light",
  cappucino: "light",
  "rainy-slate": "light",
  "night-pine": "dark",
  ashfall: "dark",
  bronze: "dark",
  system: "system",
} as const;

const THEME_DATA = {
  light: { color: "#fcfcfc", symbolColor: "#18181b", isDark: false },
  dark: { color: "#1e1e21", symbolColor: "#d4d4d8", isDark: true },
  "dark-glass": {
    color: "rgba(24, 24, 27, 0.25)",
    symbolColor: "#e4e4e7",
    isDark: true,
  },
  "light-glass": {
    color: "rgba(226, 228, 232, 0.42)",
    symbolColor: "#202024",
    isDark: false,
  },
  paper: { color: "#f4efe4", symbolColor: "#2b2723", isDark: false },
  cappucino: { color: "#f2ebe2", symbolColor: "#2e2823", isDark: false },
  "rainy-slate": { color: "#f3f1f6", symbolColor: "#27252d", isDark: false },
  "night-pine": { color: "#1d2321", symbolColor: "#d9e2dd", isDark: true },
  ashfall: { color: "#1c1f24", symbolColor: "#d9d4c9", isDark: true },
  bronze: { color: "#211f1d", symbolColor: "#e2dad2", isDark: true },
} satisfies Record<string, ThemeConfig>;

export { THEME_DATA, THEME_MAP };
