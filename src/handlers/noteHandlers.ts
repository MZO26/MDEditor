import type { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";

import { getNoteById, updateNote } from "@/api/noteAPI";
import { editor } from "@/components/editor/editor";
import { handleEditorEmptyState } from "@/components/editor/editorEmptyState";
import {
  debouncedStatUpdate,
  extractNoteDataFromEditor,
} from "@/components/editor/editorHandlers";
import { updateNoteInList } from "@/components/sidebar/sidebarNotes";
import { debouncedTagUpdate } from "@/extensions/tag";
import {
  abortCurrentSave,
  setupAutoSave,
  startNewSaveCycle,
} from "@/services/autoSave";
import { setValue, StorageKeys } from "@/services/cache";
import { setActiveItem } from "@/utils/helpers";
import { showToast } from "@/utils/toast";
import type { Note } from "@shared/schemas/noteSchema";

async function noteItemHandler(
  noteItem: HTMLDivElement,
  container: HTMLDivElement,
  editor: Editor,
) {
  const noteID = noteItem.dataset["id"];
  if (!noteID) return;
  const response = await getNoteById(noteID);
  if (!response.success) {
    showToast(response.message);
    return;
  }
  setValue(StorageKeys.NOTE_ID, noteID);
  viewNote(response.data, editor);
  debouncedTagUpdate(response.data.tags);
  debouncedStatUpdate(editor, response.data.content);
  setActiveItem(noteItem, container);
}

async function saveNote(id: string, flush: boolean = false): Promise<void> {
  if (!editor) return;
  const editorData = extractNoteDataFromEditor(editor);
  const payload = { ...editorData, id };
  const response = await updateNote(payload, flush);
  if (!response.success) {
    showToast(response.message);
    return;
  }
  updateNoteInList(response.data);
  setValue(StorageKeys.NOTE_ID, id);
}

function viewNote(note: Note, editor: Editor): void {
  if (!editor) return;
  abortCurrentSave();
  handleEditorEmptyState(note.id);
  editor.commands.setContent(note.content, { emitUpdate: false });
  const newState = EditorState.create({
    doc: editor.state.doc,
    plugins: editor.state.plugins,
    schema: editor.state.schema,
  });
  editor.view.updateState(newState);
  editor.commands.focus();
  editor.commands.unsetAllMarks();
  const newController = startNewSaveCycle();
  setupAutoSave({
    editor,
    signal: newController.signal,
    noteID: note.id,
  });
}

export { noteItemHandler, saveNote, updateNote, viewNote };
