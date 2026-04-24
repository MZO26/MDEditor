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
  searchInput: string,
  notesContainer: HTMLDivElement,
) {
  notesContainer.innerHTML = "";
  try {
    if (searchInput === "") {
      await reloadNoteList();
      return;
    }
  } catch (error) {
    console.error(`(searchInputHandler): Failed to reload note list`);
    return;
  }
  const response = await searchNotes(searchInput, 20);
  if (!response.success) {
    showToast(response.message);
    handleEditorEmptyState();
    handleSidebarEmptyState(notesContainer, searchInput);
    return;
  }
  addManyNotesToList(response.data);
  const newNoteElements =
    notesContainer.querySelectorAll<HTMLDivElement>(".noteItem");
  newNoteElements.forEach((noteElement) => {
    renderIcons(noteElement);
  });
}

export { handleSearchInput };
