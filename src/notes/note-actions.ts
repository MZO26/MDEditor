import {
  createManyNotes,
  createNote,
  deleteNote,
  getNoteById,
  importNote,
  showNotification,
  updateNote,
} from "@/api/api";
import {
  getEditorContent,
  resetEditorHistory,
} from "@/components/editor/editor-features";
import { debouncedUpdateStats } from "@/components/sidebar/sidebar-features";
import {
  addManyNotesToList,
  addOneNoteToList,
  updateNoteInList,
} from "@/components/sidebar/sidebar-ui";
import { setImportedContent } from "@/notes/import-actions";
import { setupAutoSave, stopAutoSave } from "@/notes/note-auto-save";
import { noteStore, stateStore } from "@/settings/app-state";
import { findElement, setActiveItem } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import { CLEANUP } from "@shared/constants";
import { getMetadata } from "@shared/generators";
import {
  type CreateNotePayload,
  type Note,
  type UpdateNotePayload,
} from "@shared/schemas/note-schema";

// note crud operations + import

//------------------------------------------------------------

// create

async function handleCreateNote() {
  const editorContent = {
    content: { type: "doc" as const, content: [{ type: "paragraph" }] },
    plainText: "",
  };
  const metadata = getMetadata(editorContent.content, editorContent.plainText);
  const payload: CreateNotePayload = {
    ...editorContent,
    ...metadata,
    pinned: false,
    bookmarked: false,
  };
  const result = await createNote(payload);
  if (!result.success) {
    console.error("[handleCreateNote]: Failed to create note:", result.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: [...state.notes, result.data],
  }));
  stateStore.setState({ activeId: result.data.id });
  addOneNoteToList(result.data);
  handleViewNote(result.data);
}

//------------------------------------------------------------

// import + create many

async function handleImportNote() {
  const imported = await importNote();
  if (!imported.success) return;
  const processedPayloads = await setImportedContent(imported.data);
  if (!processedPayloads.success) return;
  const result = await createManyNotes(processedPayloads.data);
  if (!result.success) {
    console.error(
      "[handleImportNote]: Failed to create imported notes:",
      result.error,
    );
    return;
  }
  const count = imported.data.length;
  await showNotification(
    "Import Successful.",
    `Successfully imported ${count} file${count === 1 ? "" : "s"}`,
  );
  noteStore.setState((state) => ({
    notes: [...state.notes, ...result.data],
  }));
  addManyNotesToList(result.data);
}

//------------------------------------------------------------

// delete

async function handleDeleteNote(id: string, noteElement: HTMLDivElement) {
  const editor = getAppItem("editor");
  debouncedUpdateStats.cancel();
  stopAutoSave(editor, "cancel");
  const result = await deleteNote(id);
  if (!result.success) {
    console.error("[handleDeleteNote]: Failed to delete:", result.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: state.notes.filter((note) => note.id !== id),
  }));
  noteElement?.remove();
  const { activeId } = stateStore.getState();
  if (activeId === id) {
    stateStore.setState({ activeId: null });
    const editor = getAppItem("editor");
    editor?.commands.clearContent();
  }
}

//------------------------------------------------------------

// update

async function handleSaveNote(id: string, flush: boolean = false) {
  const editorContent = getEditorContent();
  const metaData = getMetadata(editorContent.content, editorContent.plainText);
  const payload: UpdateNotePayload = {
    id,
    ...editorContent,
    ...metaData,
  };
  const result = await updateNote(payload, flush);
  if (!result.success) {
    console.error("[handleSaveNote]: save failed", result.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: state.notes.map((n) => (n.id === result.data.id ? result.data : n)),
  }));
  debouncedUpdateStats(result.data);
  updateNoteInList(result.data);
}

//------------------------------------------------------------

// read or getById

async function handleSelectNote(id: string) {
  const result = await getNoteById(id);
  if (!result.success) {
    console.error("[handleSelectNote]: Failed to fetch note:", result.error);
    return;
  }
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${id}"]`,
    getAppItem("sidebar"),
  );
  if (!noteElement) return;
  stateStore.setState({ activeId: id });
  handleViewNote(result.data);
  setActiveItem(noteElement, getAppItem("sidebar"));
}

//------------------------------------------------------------

// view function for editor content. gets called in combination with handleSelect

function handleViewNote(note: Note) {
  const editor = getAppItem("editor");
  debouncedUpdateStats.cancel();
  stopAutoSave(editor, "flush");
  editor.commands.setContent(note.content, {
    emitUpdate: false,
  });
  resetEditorHistory(editor);
  const newCleanup = setupAutoSave(editor, note.id);
  debouncedUpdateStats(note);
  debouncedUpdateStats.flush();
  CLEANUP.set(editor, newCleanup);
  requestAnimationFrame(() => {
    editor.commands.focus();
  });
}

export {
  handleCreateNote,
  handleDeleteNote,
  handleImportNote,
  handleSaveNote,
  handleSelectNote,
  handleViewNote,
};
