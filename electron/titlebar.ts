import { nativeTheme } from "electron";
import { THEME_DATA } from "../src/constants/themes";
import type { Theme, TitleBarOverlayOptions } from "../src/shared/types";

function getTitleBarOverlay(
  themeName: keyof typeof THEME_DATA,
): TitleBarOverlayOptions {
  const theme = THEME_DATA[themeName];
  return {
    color: theme.color,
    symbolColor: theme.symbolColor,
    height: 30,
  };
}

function resolveThemeForOverlay(theme: Theme): keyof typeof THEME_DATA {
  if (theme === "system") {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  }
  return theme as keyof typeof THEME_DATA;
}

export { getTitleBarOverlay, resolveThemeForOverlay };
