import { debouncedSetSettings } from "@/api/settingsAPI";
import { setModalState } from "@/services/state";
import { setUpEditorSettings } from "@/settings/setting-actions";
import { buildSelects } from "@/settings/setting-items";
import {
  applyAppTheme,
  resolveTheme,
  setAppTheme,
  setCodeTheme,
} from "@/settings/setting-theme";
import { createAsyncHandler, getElement, setActiveItem } from "@/utils/helpers";
import type { Theme } from "@shared/schemas/store-schema";

async function initAppSettings() {
  const buttonsContainer = getElement<HTMLDivElement>(".settings-buttons");
  const settingsContainer = getElement<HTMLDivElement>(".settings-content");
  const closeModalBtn = getElement<HTMLButtonElement>(".closeModal-btn");
  closeModalBtn.addEventListener("click", () => setModalState(false));
  const openModalBtn = getElement<HTMLButtonElement>(".settings-btn");
  const modal = getElement<HTMLDivElement>(".modal");
  openModalBtn.addEventListener("click", () => setModalState(true));
  document.addEventListener("app:open-settings", () => setModalState(true));
  document.addEventListener("app:escape", () => {
    if (modal.classList.contains("show")) {
      setModalState(false);
    }
  });
  const firstActiveBtn =
    buttonsContainer.querySelector<HTMLButtonElement>("button:first-child");
  if (firstActiveBtn) setActiveItem(firstActiveBtn, buttonsContainer);
  buildSelects(settingsContainer);

  setUpEditorSettings({
    selectId: "#font-family",
    storageKey: "font-family",
    cssVar: "--editor-font-family",
    defaultValue: "system",
  });

  setUpEditorSettings({
    selectId: "#line-height",
    storageKey: "line-height",
    cssVar: "--editor-line-height",
    defaultValue: 1.5,
    min: 1.2,
    max: 1.7,
  });

  setUpEditorSettings({
    selectId: "#font-size",
    storageKey: "font-size",
    cssVar: "--editor-font-size",
    defaultValue: 16,
    min: 12,
    max: 24,
    formatValue: (v) => `${v}px`,
  });

  buttonsContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target === buttonsContainer) return;
    const btn = target.closest(".selection-btn") as HTMLButtonElement | null;
    if (!btn) return;
    const targetTab = btn.dataset["category"];
    if (!targetTab) return;
    settingsContainer.dataset["activetab"] = targetTab;
    setActiveItem(btn, buttonsContainer);
  });
  const themeSelect = getElement<HTMLSelectElement>("#theme");
  const codeThemeSelect = getElement<HTMLSelectElement>("#code-theme");
  codeThemeSelect.addEventListener(
    "change",
    createAsyncHandler(async () => {
      const baseTheme = resolveTheme(themeSelect.value as Theme);
      const codePref = setCodeTheme(baseTheme);
      debouncedSetSettings({ "code-theme": codePref });
    }),
  );
  themeSelect.addEventListener("change", createAsyncHandler(setAppTheme));
  await applyAppTheme();
}

export { initAppSettings };
