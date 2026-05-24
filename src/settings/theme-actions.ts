import { setTheme, updateSettings } from "@/api/api";
import { getSettingsItem } from "@/utils/registry";
import { CODE_THEME_MAP, THEME_MAP } from "@shared/constants";
import type { CodeTheme, Theme } from "@shared/schemas/store-schema";
import type { ResolvedTheme } from "@shared/types";

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return THEME_MAP[theme];
}

async function applyAppTheme(preference: Theme, saveToSettings = true) {
  const result = await setTheme(preference);
  if (!result.success) {
    console.error("Failed to apply theme:", result.error);
    return;
  }
  const validatedTheme = result.data;
  document.documentElement.dataset["theme"] = validatedTheme;
  const codePreference = setCodeTheme(resolveTheme(validatedTheme));
  if (saveToSettings) {
    updateSettings({ theme: preference, "code-theme": codePreference });
  }
}

function setCodeTheme(resolvedTheme: ResolvedTheme): CodeTheme {
  const codeThemeSelect = getSettingsItem("codeThemeSelect");
  const preference = codeThemeSelect?.value as CodeTheme;
  const codeTheme =
    CODE_THEME_MAP[preference]?.[resolvedTheme] ??
    CODE_THEME_MAP["balanced"]?.[resolvedTheme];
  document.documentElement.dataset["codetheme"] = codeTheme;
  return preference;
}

export { applyAppTheme, resolveTheme, setCodeTheme };
