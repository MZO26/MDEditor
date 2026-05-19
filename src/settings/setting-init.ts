import { buildSelects } from "@/settings/select-items";
import { createSettingsMenu } from "@/settings/setting-builder";
import { setSelectListeners } from "@/settings/setting-items-init";
import { applyAppTheme } from "@/settings/theme-actions";
import { findElement, requireElement, setActiveItem } from "@/utils/dom";
import { registerAppEvents } from "@/utils/registry";
import type { AppSettings } from "@shared/schemas/store-schema";
import { delegate } from "tippy.js";

async function initAppSettings(settings: AppSettings) {
  const modal = findElement<HTMLDialogElement>(".modal-settings");
  const settingsContainer = findElement<HTMLDivElement>(".settings-content");
  if (!modal || !settingsContainer) return;
  settingsContainer.appendChild(createSettingsMenu());
  buildSelects();
  setSelectListeners(settings);
  const buttonsContainer = findElement<HTMLDivElement>(".settings-buttons");
  if (!buttonsContainer) return;
  const openModalBtn = requireElement<HTMLButtonElement>(".settings-btn");
  const firstActiveBtn = requireElement<HTMLButtonElement>(
    "button:first-child",
    buttonsContainer,
  );
  delegate(modal, {
    target: "[data-tippy-content]",
    content: (reference) => reference.getAttribute("data-tippy-content") || "",
    placement: "top",
    theme: "app-theme",
    appendTo: modal,
  });
  if (firstActiveBtn) setActiveItem(firstActiveBtn, buttonsContainer);
  await applyAppTheme(undefined, false, settings.theme, settings["code-theme"]);
  applyModalListeners(openModalBtn, buttonsContainer, settingsContainer, modal);
  registerAppEvents(document, {
    "app:open-settings": () => modal.showModal(),
  });
}

function applyModalListeners(
  openModalBtn: HTMLButtonElement,
  buttonsContainer: HTMLDivElement,
  settingsContainer: HTMLDivElement,
  modal: HTMLDialogElement,
) {
  openModalBtn.addEventListener("click", () => {
    modal.showModal();
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
}

export { initAppSettings };
