import { databaseBackup, openAppPath, showNotification } from "@/api/api";
import { initSettingsDialog } from "@/settings/dialog-init";
import { createSettingsMenu } from "@/settings/setting-factory";
import { buildSelects } from "@/settings/setting-items";
import { setSelectListeners } from "@/settings/setting-items-init";
import { applyAppTheme } from "@/settings/theme";
import { createAsyncHandler } from "@/utils/async";
import { requireElement, setActiveItem } from "@/utils/dom";
import { registerAppEvents } from "@/utils/registry";
import type { AppSettings } from "@shared/schemas/store-schema";

async function initAppSettings(settings: AppSettings) {
  const { settingsDialog, settingsContainer } = initSettingsDialog();
  const buttonsContainer = createSettingsMenu();
  settingsContainer.appendChild(buttonsContainer);
  buildSelects();
  setSelectListeners(settings, settingsContainer);
  const openModalBtn = requireElement<HTMLButtonElement>(".settings-btn");
  const firstActiveBtn = requireElement<HTMLButtonElement>(
    "button:first-child",
    buttonsContainer,
  );
  const quickActionsContainer = requireElement<HTMLDivElement>(
    ".settings-quick-actions",
  );
  if (firstActiveBtn) setActiveItem(firstActiveBtn, buttonsContainer);
  await applyAppTheme(settings["theme"]);
  applyModalListeners(
    openModalBtn,
    buttonsContainer,
    settingsContainer,
    settingsDialog,
    quickActionsContainer,
  );
  registerAppEvents(document, {
    "app:open-settings": () => settingsDialog.showModal(),
  });
}

function applyModalListeners(
  openModalBtn: HTMLButtonElement,
  buttonsContainer: HTMLDivElement,
  settingsContainer: HTMLDivElement,
  modal: HTMLDialogElement,
  quickActionsContainer: HTMLDivElement,
) {
  openModalBtn.addEventListener("click", () => {
    modal.showModal();
  });
  quickActionsContainer.addEventListener(
    "click",
    createAsyncHandler(async (e) => {
      const target = e.target as HTMLElement | null;
      if (target === quickActionsContainer || !target) return;
      const button = target.closest<HTMLButtonElement>("button[data-action]");
      if (!button) return;
      const action = button.getAttribute("data-action");
      switch (action) {
        case "open-path":
          const open = await openAppPath();
          if (!open.success) {
            console.error(
              "[quickActions -> open-path]: Failed to open app path:",
              open.error,
            );
            return;
          }
          break;
        case "backup-db":
          const backup = await databaseBackup();
          if (!backup.success) {
            console.error(
              "[quickActions -> backup-db]: Failed to backup db:",
              backup.error,
            );
            return;
          }
          await showNotification("Backup saved.", "");
          return;
      }
    }),
  );
  buttonsContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (target === buttonsContainer || !target) return;
    const btn = target.closest<HTMLButtonElement>(".selection-btn");
    if (!btn) return;
    const targetTab = btn.dataset["category"];
    if (!targetTab) return;
    settingsContainer.dataset["activetab"] = targetTab;
    setActiveItem(btn, buttonsContainer);
  });
}

export { initAppSettings };
