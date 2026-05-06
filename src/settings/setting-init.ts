import { debouncedSetSettings, getAllSettings } from "@/api/settingsAPI";
import { createSettingsMenu } from "@/settings/setting-builder";
import { initSettingItems } from "@/settings/setting-items";
import {
  applyAppTheme,
  resolveTheme,
  setAppTheme,
  setCodeTheme,
} from "@/settings/setting-theme";
import {
  createAsyncHandler,
  findElement,
  getItem,
  registerAppEvents,
  requireElement,
  setActiveItem,
} from "@/utils";
import type { AppSettings, Theme } from "@shared/schemas/store-schema";

function setModalState(show: boolean): void {
  const appContainer = getItem("appContainer");
  const overlay = findElement<HTMLDivElement>(".overlay");
  const modal = findElement<HTMLDivElement>(".modal");
  overlay?.classList.toggle("show", show);
  modal?.classList.toggle("show", show);
  appContainer.inert = show;
}

async function initAppSettings(settings: AppSettings) {
  const modal = findElement<HTMLDivElement>(".modal");
  const settingsContainer = findElement<HTMLDivElement>(".settings-content");
  if (!modal || !settingsContainer) return;
  settingsContainer.appendChild(createSettingsMenu());
  initSettingItems(settingsContainer, settings);
  const buttonsContainer = findElement<HTMLDivElement>(".settings-buttons");
  if (!buttonsContainer) return;
  const openModalBtn = requireElement<HTMLButtonElement>(".settings-btn");
  const closeModalBtn = requireElement<HTMLButtonElement>(".closeModal-btn");
  const firstActiveBtn = requireElement<HTMLButtonElement>(
    "button:first-child",
    buttonsContainer,
  );
  const themeSelect = requireElement<HTMLSelectElement>("#theme");
  const codeThemeSelect = requireElement<HTMLSelectElement>("#code-theme");
  if (firstActiveBtn) setActiveItem(firstActiveBtn, buttonsContainer);

  closeModalBtn.addEventListener("click", () => setModalState(false));
  openModalBtn.addEventListener("click", () => setModalState(true));
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
  codeThemeSelect.addEventListener(
    "change",
    createAsyncHandler(async () => {
      const baseTheme = resolveTheme(themeSelect.value as Theme);
      const codePref = setCodeTheme(baseTheme);
      debouncedSetSettings({ "code-theme": codePref });
    }),
  );
  themeSelect.addEventListener("change", createAsyncHandler(setAppTheme));
  await applyAppTheme(undefined, false, settings.theme, settings["code-theme"]);
  registerAppEvents(document, {
    "app:open-settings": () => setModalState(true),
    "app:escape": () => {
      if (modal.classList.contains("show")) {
        setModalState(false);
      }
    },
  });
}

async function loadSettings(): Promise<AppSettings> {
  const response = await getAllSettings();
  if (!response.success) {
    console.error(response.message);
    throw new Error(response.message);
  }
  return response.data;
}

export { initAppSettings, loadSettings };
