import { CODE_THEME_MAP, THEME_MAP } from "../../constants/themes";
import type {
  AppTheme,
  CodeThemePreference,
} from "../../shared/schemas/storeSchema";
import type { Code, ResolvedTheme } from "../../shared/types";
import { getElement } from "../../utils/helpers";
import { showToast } from "../../utils/toast";

function resolveTheme(theme: AppTheme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return THEME_MAP[theme];
}

const applyAppTheme = async (
  selectElement: HTMLSelectElement,
  themeOverride?: AppTheme,
) => {
  try {
    const codeThemeSelect = getElement<HTMLSelectElement>(
      "#code-theme-dropdown",
    );
    let theme: AppTheme;
    if (themeOverride) {
      theme = themeOverride; // theme override
    } else {
      // fallback reading from store
      const result = await window.storeApi.getSettings("theme");
      theme = result.success ? result.data : "system";
    }
    const resolvedTheme = resolveTheme(theme);
    document.documentElement.setAttribute(
      "data-theme",
      theme === "system" ? resolvedTheme : theme,
    ); // set selected theme as background and fallback for system
    if (selectElement) {
      selectElement.value = theme; // update select value to selected theme
    }
    await window.electronAPI.setTheme(theme); // api call for theme to resolve electrons internal theme
    updateCodeTheme(codeThemeSelect);
    await window.storeApi.setSettings("theme", theme);
    showToast(`Set theme: ${theme}`);
  } catch (error) {
    console.error("Failed to apply theme: ", error);
  }
};

function getDefaultCodeTheme(
  selectElement: HTMLSelectElement,
  resolvedTheme: ResolvedTheme,
): { preference: CodeThemePreference; codeTheme: Code } {
  const preference = selectElement.value as CodeThemePreference;
  selectElement.value = preference;
  return {
    preference,
    codeTheme:
      CODE_THEME_MAP[preference]?.[resolvedTheme] ??
      CODE_THEME_MAP["Balanced"]?.[resolvedTheme],
  };
}

async function updateCodeTheme(selectElement: HTMLSelectElement) {
  const theme = document.documentElement.getAttribute("data-theme") as AppTheme;
  const resolvedTheme = resolveTheme(theme);
  const { preference, codeTheme } = getDefaultCodeTheme(
    selectElement,
    resolvedTheme,
  );
  document.documentElement.setAttribute("code-theme", codeTheme);
  await window.storeApi.setSettings("code-theme", preference);
}

const setAppTheme = async (event: Event) => {
  try {
    const selectElement = event.currentTarget as HTMLSelectElement;
    const newTheme = selectElement.value as AppTheme;
    // sets the theme in the main process, which will trigger the theme-changed event
    await applyAppTheme(selectElement, newTheme);
  } catch (error) {
    console.error("Failed to get current theme:", error);
    return;
  }
};

export { applyAppTheme, resolveTheme, setAppTheme, updateCodeTheme };
