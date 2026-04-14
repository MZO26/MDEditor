import { handleEditorEmptyState } from "../../components/editor/editorHandlers";
import {
  addManyNotesToList,
  handleSidebarEmptyState,
  reloadNoteList,
} from "../../components/sidebar2/sidebarNotes";
import { renderIcons } from "../../utils/icons";
import { showToast } from "../../utils/toast";
import { searchNotes } from "./searchAPI";

async function handleSearchInput(
  inputElement: HTMLInputElement,
  notesContainer: HTMLDivElement,
) {
  notesContainer.innerHTML = "";
  const searchInput = inputElement.value.trim();

  try {
    if (searchInput === "") {
      await reloadNoteList();
      return;
    }

    const result = await searchNotes(searchInput, 20);
    if (!result.success) {
      showToast(result.message);
      handleEditorEmptyState();
      handleSidebarEmptyState(notesContainer, searchInput);
      return;
    }
    addManyNotesToList(result.data);
  } catch (error) {
    const action = searchInput === "" ? "reload note list" : "search notes";
    console.error(`(searchInputHandler): Failed to ${action}:`, error);
    return;
  }
  const newNoteElements =
    notesContainer.querySelectorAll<HTMLDivElement>(".noteItem");
  newNoteElements.forEach((noteElement) => {
    renderIcons(noteElement);
  });
}

export { handleSearchInput };
