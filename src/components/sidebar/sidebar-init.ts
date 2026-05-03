import { getSettings } from "@/api/settingsAPI";
import { editor } from "@/components/editor/editor-init";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { handleSelectNote } from "@/features/note-actions";
import { createNoteButton } from "@/features/note-ui";
import { createAsyncHandler, getElement } from "@/utils/helpers";
import { createContextMenu } from "@/utils/templates";
import tippy from "tippy.js";

async function initNotesSidebar() {
  const response = await getSettings("note-sidebar-state");
  const collapsed = response.success ? response.data === true : false;
  const appContainer = getElement<HTMLDivElement>(".app-container");
  const collapseBtn = getElement<HTMLButtonElement>(".collapse-btn");
  const tippyInstance = tippy(collapseBtn, {
    placement: "top",
    theme: "app-theme",
    content: collapsed ? "Open sidebar" : "Close sidebar",
  });
  setSidebarState(
    appContainer,
    "note-sidebar-state",
    collapsed,
    tippyInstance,
    "MOD+O",
  );
  const toggleSidebar = () => {
    const collapsed = appContainer.classList.contains("collapsed");
    setSidebarState(
      appContainer,
      "note-sidebar-state",
      !collapsed,
      tippyInstance,
      "MOD+O",
    );
  };
  collapseBtn.addEventListener("click", toggleSidebar);
  document.addEventListener("keydown", (event) => {
    const isCmdOrCtrl = event.ctrlKey || event.metaKey;
    if (isCmdOrCtrl && event.key.toLowerCase() === "o") {
      event.preventDefault();
      toggleSidebar();
    }
  });
  void appContainer.offsetWidth;
  appContainer.classList.remove("no-transition");
  const container = getElement<HTMLDivElement>(".notes-container");
  container.addEventListener(
    "contextmenu",
    createAsyncHandler(createContextMenu),
  );
  const addNoteBtn = getElement(".add-note-btn");
  addNoteBtn.addEventListener("click", createAsyncHandler(createNoteButton));
  container.addEventListener(
    "click",
    createAsyncHandler(async (event) => {
      const target = event.target as HTMLElement;
      // early return if clicking the container background
      if (target === container) return;
      const actionBtn = target.closest<HTMLButtonElement>("button");
      if (actionBtn) {
        event.preventDefault();
        event.stopPropagation();
        await createContextMenu(event);
        return;
      }
      const noteItem = target.closest<HTMLDivElement>(".noteItem");
      if (noteItem && editor) {
        await handleSelectNote(noteItem, container, editor);
        return;
      }
    }),
  );
}

export { initNotesSidebar };
