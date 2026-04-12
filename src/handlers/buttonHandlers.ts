import { editor } from "../components/editor";
import { addOneNoteToList } from "../components/sidebarNotes";
import { createNote } from "../features/notes/noteAPI";
import { viewNote } from "../features/notes/noteHandlers";
import { getValue, removeValue, StorageKeys } from "../utils/cache";
import { createNotePayload } from "../utils/factory";
import { getElement, setActiveItem } from "../utils/helpers";
import { handleEditorEmptyState } from "./editorHandlers";

async function addNoteBtnHandler() {
  const container = getElement(".notes-container");
  const activeID = getValue(StorageKeys.NOTE_ID);
  if (activeID) removeValue(StorageKeys.NOTE_ID);
  try {
    const payload = createNotePayload();
    const note = await createNote(payload);
    console.log("new note created: ", note);

    if (note && editor) {
      const noteElement = addOneNoteToList(note);
      handleEditorEmptyState(note.id);
      if (noteElement) setActiveItem(noteElement, container);
      viewNote(note, editor);
      editor?.commands.setContent("", { emitUpdate: false }); //prevents debounced update to create another note
      editor?.commands.focus();
    }
  } catch (error) {
    console.error("Failed to add a new note: ", error);
  }
}

export { addNoteBtnHandler };
