import { searchByTag } from "@/components/sidebar/sidebar-filter";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { handleSelectNote } from "@/features/note-actions";
import { createAsyncHandler } from "@/utils/async";
import { findElement } from "@/utils/dom";
import { registerAppEvents } from "@/utils/registry";
import { delegate } from "tippy.js";
import "tippy.js/dist/tippy.css";

const collapseInfoSidebar = (infoSidebar: HTMLDivElement) => {
  const collapsed = infoSidebar.classList.contains("collapsed");
  setSidebarState(infoSidebar, "info-sidebar-state", !collapsed);
};

async function initInfoSidebar(collapsed: boolean = true) {
  const toggleBtn = findElement<HTMLButtonElement>(".info-sidebar-toggle");
  const infoSidebar = findElement<HTMLDivElement>(".info-sidebar");
  const tagContainer = findElement<HTMLDivElement>(".tag-container");
  const linkContainer = findElement<HTMLDivElement>(".link-container");
  if (!toggleBtn || !infoSidebar || !tagContainer || !linkContainer) return;
  delegate(infoSidebar, {
    target: "[data-tippy-content]",
    placement: "auto",
    theme: "app-theme",
    trigger: "mouseenter",
    touch: false,
    hideOnClick: true,
  });
  setSidebarState(infoSidebar, "info-sidebar-state", collapsed);
  applyInfoSidebarListeners(
    tagContainer,
    linkContainer,
    toggleBtn,
    infoSidebar,
  );
  registerAppEvents(document, {
    "app:toggle-info-sidebar": () => collapseInfoSidebar(infoSidebar),
  });
}

function applyInfoSidebarListeners(
  tagContainer: HTMLDivElement,
  linkContainer: HTMLDivElement,
  toggleBtn: HTMLButtonElement,
  infoSidebar: HTMLDivElement,
) {
  tagContainer.addEventListener(
    "click",
    createAsyncHandler(async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === tagContainer) return;
      const spanEl = target.closest(".tag") as HTMLSpanElement | null;
      if (!spanEl) return;
      const tag = spanEl.dataset["tag"];
      if (!tag) return;
      searchByTag(tag);
    }),
  );
  linkContainer.addEventListener(
    "click",
    createAsyncHandler(async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === linkContainer) return;
      const spanEl = target.closest(".link") as HTMLSpanElement | null;
      if (!spanEl) return;
      const link = spanEl.dataset["link"];
      const noteElement = findElement<HTMLDivElement>(`div[data-id="${link}"]`);
      if (!link || !noteElement) return;
      handleSelectNote(noteElement);
    }),
  );
  toggleBtn.addEventListener("click", () => collapseInfoSidebar(infoSidebar));
}

export { initInfoSidebar };
