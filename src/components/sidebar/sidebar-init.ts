import {
  createViews,
  debouncedSearch,
  handleViews,
  toggleSidebar,
} from "@/components/sidebar/sidebar-actions";
import { handleSelectNote } from "@/features/note-actions";
import { createNoteButton, importNoteButton } from "@/features/note-buttons";
import { createAsyncHandler } from "@/utils/async";
import { requireElement } from "@/utils/dom";
import { getAppItem, registerAppEvents } from "@/utils/registry";
import { initTippyDelegate } from "@/utils/ui";
import { VIEWS } from "@shared/constants";
import type { View } from "@shared/types";

async function initNotesSidebar() {
  const appContainer = getAppItem("appContainer");
  const sidebar = getAppItem("sidebar");
  const sidebarContainer = requireElement<HTMLDivElement>(".sidebar-container");
  const addNoteBtn = requireElement<HTMLButtonElement>(".add-note-btn");
  const importBtn = requireElement<HTMLButtonElement>(".import-btn");
  const searchInput = requireElement<HTMLInputElement>(".search-input");
  initTippyDelegate(sidebarContainer);
  const viewSelect = createViews(VIEWS);
  applySidebarListeners(
    sidebar,
    addNoteBtn,
    importBtn,
    searchInput,
    viewSelect,
  );
  registerAppEvents(document, {
    "app:toggle-sidebar": () => toggleSidebar(appContainer),
    "app:create-new-note": () => createNoteButton(),
  });
}

function applySidebarListeners(
  sidebar: HTMLDivElement,
  addNoteBtn: HTMLButtonElement,
  importBtn: HTMLButtonElement,
  searchInput: HTMLInputElement,
  viewSelect: HTMLSelectElement,
) {
  addNoteBtn.addEventListener("click", createAsyncHandler(createNoteButton));
  importBtn.addEventListener("click", createAsyncHandler(importNoteButton));
  searchInput.addEventListener("input", debouncedSearch);
  viewSelect.addEventListener(
    "change",
    createAsyncHandler(async (e) => {
      const target = e.target as HTMLSelectElement;
      const view = target.value as View;
      handleViews(view);
    }),
  );
  sidebar.addEventListener(
    "click",
    createAsyncHandler(async (e) => {
      const target = e.target as HTMLElement;
      if (target === sidebar) return;
      const actionBtn = target.closest<HTMLButtonElement>("button");
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const item = target.closest<HTMLElement>(".note-item");
        if (!item) return;
        const id = item.getAttribute("data-id");
        if (!id) return;
        const isPinned = item.getAttribute("data-pinned") === "true";
        const isBookmarked = item.getAttribute("data-bookmarked") === "true";
        window.electronAPI.showContextMenu("note", {
          id: id,
          pinned: isPinned,
          bookmarked: isBookmarked,
        });
        return;
      }
      const noteItem = target.closest<HTMLDivElement>(".note-item");
      if (noteItem) {
        await handleSelectNote(noteItem);
        return;
      }
    }),
  );
}

export { initNotesSidebar };
