import type { Editor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { positionManager } from "../../components/editor";
import { updateNoteInList } from "../../components/sidebarNotes";
import { handleEditorEmptyState } from "../../handlers/editorHandlers";
import type { Note, UpdateNotePayload } from "../../shared/types";
import {
  abortCurrentSave,
  setupAutoSave,
  startNewSaveCycle,
} from "../../utils/autoSave";
import { getValue, setValue, StorageKeys } from "../../utils/cache";
import { safeParse } from "../../utils/helpers";
import { updateNote } from "./noteAPI";

async function saveNote(note: UpdateNotePayload): Promise<void> {
  const currentId =
    note.id !== undefined ? note.id : getValue(StorageKeys.NOTE_ID);
  if (currentId === null) return;
  try {
    const result = await updateNote(note);
    if (!result) return;
    updateNoteInList(result);
    setValue(StorageKeys.NOTE_ID, note.id);
    console.log("saved!");
  } catch (error) {
    console.error(`Error saving note: `, error);
  }
}

function viewNote(note: Note, editor: Editor): void {
  if (!editor) return;
  abortCurrentSave();
  positionManager.save(editor); // save position from old note
  const content = safeParse(note.content);
  handleEditorEmptyState(note.id);
  editor.commands.setContent(content, { emitUpdate: false });
  const newState = EditorState.create({
    doc: editor.state.doc,
    plugins: editor.state.plugins,
    schema: editor.state.schema,
  });
  editor.view.updateState(newState);
  editor.commands.unsetAllMarks();
  positionManager.restore(editor, note.id); // moves cursor and updates id
  const newController = startNewSaveCycle();
  setupAutoSave({
    editor,
    signal: newController.signal,
    noteID: note.id,
  });
}

export { saveNote, updateNote, viewNote };
