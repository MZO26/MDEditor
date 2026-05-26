import { collapseInfoSidebar } from "@/components/sidebar/info-sidebar-actions";
import { searchByTag } from "@/components/sidebar/sidebar-actions";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { handleSelectNote } from "@/features/note-actions";
import { createAsyncHandler } from "@/utils/async";
import { findElement, requireElement } from "@/utils/dom";
import {
  getAppItem,
  getInfobarItems,
  initializeInfobarRegistry,
  registerAppEvents,
} from "@/utils/registry";

async function initInfoSidebar() {
  initializeInfobarRegistry();
  const { toggleBtn, infoSidebar } = getInfobarItems([
    "toggleBtn",
    "infoSidebar",
  ]);
  setSidebarState(infoSidebar, true);
  applyInfoSidebarListeners(toggleBtn, infoSidebar);
  registerAppEvents(document, {
    "app:toggle-info-sidebar": () => collapseInfoSidebar(infoSidebar),
  });
}

function applyInfoSidebarListeners(
  toggleBtn: HTMLButtonElement,
  infoSidebar: HTMLDivElement,
) {
  const searchInput = requireElement<HTMLInputElement>(".search-input");
  infoSidebar.addEventListener(
    "click",
    createAsyncHandler(async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === infoSidebar) return;
      const tagEl = target.closest<HTMLSpanElement>(".tag");
      if (tagEl) {
        const tag = tagEl.getAttribute("data-tag");
        if (!tag) return;
        await searchByTag(tag);
        searchInput.focus();
        searchInput.value = `#${tag}`;
        return;
      }
      const linkEl = target.closest<HTMLSpanElement>(".link");
      if (linkEl) {
        const link = linkEl.getAttribute("data-link");
        const noteElement = findElement<HTMLDivElement>(
          `div[data-id="${link}"]`,
          getAppItem("sidebar"),
        );
        if (!link || !noteElement) return;
        await handleSelectNote(noteElement);
        return;
      }
    }),
  );
  toggleBtn.addEventListener("click", () => collapseInfoSidebar(infoSidebar));
}

export { initInfoSidebar };
