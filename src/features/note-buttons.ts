import { createManyNotes } from "@/api/api";
import { handleEditorEmptyState } from "@/components/editor/editor-state";
import {
  addManyNotesToList,
  addOneNoteToList,
} from "@/components/sidebar/sidebar-actions";
import {
  getImportedContent,
  handleImportFile,
} from "@/features/import-actions";
import { handleCreateNote, viewNote } from "@/features/note-actions";
import { noteStore, stateStore } from "@/settings/app-state";

async function createNoteButton() {
  const response = await handleCreateNote();
  if (!response.success) {
    console.error("Failed to create note:", response.error);
    return;
  }
  const note = response.data;
  noteStore.setState((state) => ({
    notes: [...state.notes, note],
  }));
  stateStore.setState({ activeId: note.id });
  addOneNoteToList(note);
  handleEditorEmptyState();
  viewNote(note);
}

async function importNoteButton() {
  const imported = await handleImportFile();
  if (!imported.success) {
    console.error("Import failed:", imported.error);
    return;
  }
  const content = await getImportedContent(imported.data);
  if (!content.success) {
    console.error("Failed to process imported content:", content.error);
    return;
  }
  const response = await createManyNotes(content.data);
  if (!response.success) {
    console.error("Failed to create imported notes:", response.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: [...state.notes, ...response.data],
  }));
  addManyNotesToList(response.data);
  handleEditorEmptyState();
}

export { createNoteButton, importNoteButton };
