import type { CodeTheme, Theme } from "@shared/schemas/store-schema";
import type { Code, ResolvedTheme, ViewItem } from "@shared/types";

const ZOOMS = [1, 1.1, 1.25] as const;

const LIMITS = {
  WRITE_HEAVY: 500, // saveImage
  WRITE_STANDARD: 500, // create, delete, store:set
  WRITE_LIGHT: 300, // update
  READ_HEAVY: 500, // search, getAll
  READ_LIGHT: 100, // getById, store:get
  WRITE_FLUSH: 5, // update with flush arg
};

const DEBOUNCE_MS = {
  fast: 300,
  slow: 1000,
} as const;

const mimeToExt = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
} as const;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const MAX_SIZE = 25 * 1024 * 1024; // 25MB -> 25MB * 1024 = 25,600KB -> *1024 = 26,214,400B. file.size from JS is always in bytes

const VIEWS: ViewItem[] = [
  { id: "all", label: "All Notes" },
  { id: "bookmarked", label: "Bookmarked" },
  { id: "pinned", label: "Pinned" },
  { id: "todos", label: "Pending Todos" },
  { id: "untagged", label: "Untagged Notes" },
];

const THEME_MAP = {
  system: "system",
  light: "light",
  dark: "dark",
  "light-warm": "light",
  "dark-warm": "dark",
} as const;

const CODE_THEME_MAP: Record<CodeTheme, Record<ResolvedTheme, Code>> = {
  focus: { dark: "github-dark", light: "github-light" },
  balanced: { dark: "atom-one-dark", light: "atom-one-light" },
  "eye-comfort": { dark: "solarized-dark", light: "solarized-light" },
} as const;

const THEME_DATA: Record<
  Exclude<Theme, "system">,
  {
    color: string;
    symbolColor: string;
    background: string;
    isDark: boolean;
    focus: string;
  }
> = {
  light: {
    color: "#f8f8f8", // --bg-sidebar
    symbolColor: "#18181b", // --text-main
    background: "#fcfcfc", // --bg-editor
    isDark: false,
    focus: "#fcfcfc", // --bg-editor
  },
  dark: {
    color: "#111115",
    symbolColor: "#a1a1aa",
    background: "#1e1e21",
    isDark: true,
    focus: "#1e1e21",
  },
  "light-warm": {
    color: "#f8f7f3",
    symbolColor: "#1c1917",
    background: "#f8f7f3",
    isDark: false,
    focus: "#f8f7f3",
  },
  "dark-warm": {
    color: "#110f0b",
    symbolColor: "#d4cfc5",
    background: "#1e1b17",
    isDark: true,
    focus: "#1e1b17",
  },
} as const;

export {
  ALLOWED_TYPES,
  CODE_THEME_MAP,
  DEBOUNCE_MS,
  LIMITS,
  MAX_SIZE,
  mimeToExt,
  THEME_DATA,
  THEME_MAP,
  VIEWS,
  ZOOMS,
};
