import { getSettings } from "@/api/settingsAPI";
import { editor } from "@/components/editor/editor-init";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { handleSelectNote } from "@/features/note-actions";
import { createNoteButton } from "@/features/note-ui";
import {
  createAsyncHandler,
  getElement,
  registerAppEvents,
} from "@/utils/helpers";
import { createContextMenu } from "@/utils/templates";

async function initNotesSidebar() {
  const response = await getSettings("note-sidebar-state");
  const collapsed = response.success ? response.data === true : false;
  const appContainer = getElement<HTMLDivElement>(".app-container");
  const container = getElement<HTMLDivElement>(".notes-container");
  const addNoteBtn = getElement(".add-note-btn");
  setSidebarState(appContainer, "note-sidebar-state", collapsed);
  void appContainer.offsetWidth;
  appContainer.classList.remove("no-transition");
  const toggleSidebar = () => {
    const collapsed = appContainer.classList.contains("collapsed");
    setSidebarState(appContainer, "note-sidebar-state", !collapsed);
  };
  container.addEventListener(
    "contextmenu",
    createAsyncHandler(createContextMenu),
  );
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
  registerAppEvents(document, {
    "app:toggle-sidebar": () => toggleSidebar(),
    "app:create-new-note": () => createNoteButton(),
  });
}

export { initNotesSidebar };
