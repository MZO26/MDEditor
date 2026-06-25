import {
  databaseBackup,
  databaseBackupRestore,
  databaseVacuum,
  openAppPath,
  showNotification,
} from "@/api/api";
import { exportSelection } from "@/components/sidebar/sidebar-selection";
import { noteStore } from "@/settings/app-state";
import { initSettingsDialog } from "@/settings/dialog-init";
import { createSettingsMenu } from "@/settings/setting-factory";
import { buildSelects } from "@/settings/setting-items";
import { setSelectListeners } from "@/settings/setting-items-init";
import { applyAppTheme } from "@/settings/theme";
import { createAsyncHandler } from "@/utils/async";
import { requireElement, setActiveItem } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { getUIItem, registerAppEvents } from "@/utils/registry";
import { formatBytes, useDelayedSpinner } from "@/utils/ui";
import { QUICK_ACTIONS } from "@shared/constants";
import type { AppSettings } from "@shared/schemas/store-schema";
import type { SettingsCategory } from "@shared/types";

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
  const quickActionContainer = initQuickActionContainer();
  if (firstActiveBtn) setActiveItem(firstActiveBtn, buttonsContainer);
  await applyAppTheme(settings["theme"]);
  applyModalListeners(
    openModalBtn,
    buttonsContainer,
    settingsContainer,
    settingsDialog,
    quickActionContainer,
  );
  registerAppEvents(document, {
    "app:open-settings": () => settingsDialog.showModal(),
  });
}

function initQuickActionContainer() {
  const quickActionContainer = getUIItem("quickActionContainer");
  const settingsContainer = requireElement<HTMLDivElement>(".settings-content");
  const row = document.createElement("div");
  row.className = "settings-row";
  row.dataset["category"] = "Export" as SettingsCategory;
  const frag = document.createDocumentFragment();
  for (const action of QUICK_ACTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${action.id}-btn`;
    button.setAttribute("data-action", action.id);
    button.setAttribute("data-tippy-content", action.label);
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", action.icon);
    button.appendChild(icon);
    frag.appendChild(button);
  }
  quickActionContainer.appendChild(frag);
  row.appendChild(quickActionContainer);
  settingsContainer.appendChild(row);
  renderIcons(quickActionContainer);
  return quickActionContainer;
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
          const dbBackup = await databaseBackup();
          if (!dbBackup.success) {
            console.error(
              "[quickActions -> backup-db]: Failed to backup db:",
              dbBackup.error,
            );
            return;
          }
          await showNotification("Backup saved.", "");
          return;
        case "backup-db-restore":
          const restore = await databaseBackupRestore();
          if (!restore.success) {
            console.error(
              "[quickActions -> backup-db-restore]: Failed to restore db:",
              restore.error,
            );
            return;
          }
          await showNotification("Backup restored.", "");
          return;
        case "backup-notes":
          const allIds = noteStore.get("notes")?.map((n) => n.id);
          await exportSelection(allIds);
          break;
        case "vacuum-db":
          const stopSpinner = useDelayedSpinner();
          try {
            const savedBytes = await databaseVacuum();
            if (savedBytes.success) {
              await showNotification(
                "Optimized Database.",
                savedBytes.data === 0
                  ? "Database already compact"
                  : `Reclaimed ${formatBytes(savedBytes.data)} of space`,
              );
            }
          } catch (error) {
            console.error(
              "[quickActions -> vacuum-db]: Failed to vacuum db:",
              error,
            );
            showNotification("Failed to optimize database.", "");
          } finally {
            if (stopSpinner) stopSpinner();
          }
          break;
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
