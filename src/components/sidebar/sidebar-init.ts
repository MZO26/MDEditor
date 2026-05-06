import { showContextMenu } from "@/api/electronAPI";
import { editor } from "@/components/editor/editor-init";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { handleSelectNote } from "@/features/note-actions";
import { createNoteButton } from "@/features/note-ui";
import {
  createAsyncHandler,
  getItem,
  registerAppEvents,
  requireElement,
} from "@/utils";
import { delegate } from "tippy.js";

async function initNotesSidebar(state: boolean) {
  const appContainer = getItem("appContainer");
  const sidebar = getItem("sidebar");
  const addNoteBtn = requireElement(".add-note-btn");
  delegate(sidebar, {
    target: "[tippy-content]",
    theme: "app-theme",
    content: (reference) =>
      reference.getAttribute("tippy-content") || "options",
  });
  async function createContextMenu(e: Event) {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>(".noteItem");
    if (!item) return;
    e.preventDefault();
    const id = item.dataset["id"];
    const pinned = item.dataset["pinned"] === "true";
    const bookmarked = item.dataset["bookmarked"] === "true";
    if (!id) return;
    await showContextMenu(id, pinned, bookmarked);
  }
  setSidebarState(appContainer, "note-sidebar-state", state);
  void appContainer.offsetWidth;
  appContainer.classList.remove("no-transition");
  const toggleSidebar = () => {
    const collapsed = appContainer.classList.contains("collapsed");
    setSidebarState(appContainer, "note-sidebar-state", !collapsed);
  };
  sidebar.addEventListener(
    "contextmenu",
    createAsyncHandler(createContextMenu),
  );
  addNoteBtn.addEventListener("click", createAsyncHandler(createNoteButton));
  sidebar.addEventListener(
    "click",
    createAsyncHandler(async (event) => {
      const target = event.target as HTMLElement;
      // early return if clicking the container background
      if (target === sidebar) return;
      const actionBtn = target.closest<HTMLButtonElement>("button");
      if (actionBtn) {
        event.preventDefault();
        event.stopPropagation();
        await createContextMenu(event);
        return;
      }
      const noteItem = target.closest<HTMLDivElement>(".noteItem");
      if (noteItem && editor) {
        await handleSelectNote(noteItem, sidebar, editor);
        return;
      }
    }),
  );
  registerAppEvents(document, {
    "app:toggle-sidebar": () => toggleSidebar(),
    "app:create-new-note": () => createNoteButton(),
  });
}

export { initNotesSidebar };
