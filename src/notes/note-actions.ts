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
import { setImportedContent } from "@/notes/import-actions";
import { setupAutoSave, stopAutoSave } from "@/notes/note-auto-save";
import {
  handleSync,
  handleSyncDelete,
  handleSyncWrite,
  isSyncEnabled,
} from "@/notes/note-sync";
import { noteStore, stateStore } from "@/settings/app-state";
import { findElement, setActiveItem } from "@/utils/dom";
import { resolveTitle } from "@/utils/note";
import { getAppItem } from "@/utils/registry";
import { CLEANUP, UNTITLED } from "@shared/constants";
import { getMetadata, titleGenerator } from "@shared/generators";
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
    markdown: "",
  };
  const metadata = getMetadata(editorContent.content, editorContent.plainText);
  const title = UNTITLED;
  const payload: CreateNotePayload = {
    ...editorContent,
    ...metadata,
    title,
    pinned: false,
    bookmarked: false,
  };
  const result = await createNote(payload);
  if (!result.success) {
    console.error("[handleCreateNote]: Failed to create note:", result.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: [result.data, ...state.notes],
    sidebarChange: { type: "prepend", noteId: result.data.id },
  }));
  stateStore.setState({ activeId: result.data.id });
  await handleViewNote(result.data);
  if (isSyncEnabled()) handleSyncWrite(result.data.id, title);
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
    sidebarChange: { type: "reload" },
  }));
}

//----------------------------------------------------------

// delete

async function handleDeleteNote(id: string) {
  const editor = getAppItem("editor");
  const { notes } = noteStore.getState();
  const noteToDelete = notes.find((n) => n.id === id);
  const { activeId } = stateStore.getState();
  const isActiveDeletedId = activeId === id;
  if (isActiveDeletedId) {
    debouncedUpdateStats.cancel();
    await stopAutoSave(editor, "cancel");
  }
  const result = await deleteNote(id);
  if (!result.success) {
    console.error("[handleDeleteNote]: Failed to delete:", result.error);
    return;
  }
  noteStore.setState((state) => ({
    notes: state.notes.filter((note) => note.id !== id),
    sidebarChange: { type: "remove", noteId: id },
  }));
  if (isActiveDeletedId) {
    stateStore.setState({ activeId: null });
    editor.commands.clearContent();
  }
  if (isSyncEnabled() && noteToDelete) {
    const deleteRequestPayload = {
      id: noteToDelete.id,
      extension: "md" as const,
      fileName: noteToDelete.title,
    };
    handleSyncDelete(deleteRequestPayload);
  }
}

//------------------------------------------------------------

// update

async function handleSaveNote(id: string, flush: boolean = false) {
  const editorContent = getEditorContent();
  const metaData = getMetadata(editorContent.content, editorContent.plainText);
  const oldNote = noteStore.getState().notes.find((n) => n.id === id);
  const previousTitle = oldNote?.title ?? "";
  let newTitle = previousTitle;
  if (!flush) {
    newTitle = resolveTitle(previousTitle, editorContent.plainText);
  } else newTitle = titleGenerator(editorContent.plainText);
  const payload: UpdateNotePayload = {
    id,
    title: newTitle,
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
    sidebarChange: { type: "update", noteId: result.data.id },
  }));
  debouncedUpdateStats(result.data);
  if (isSyncEnabled()) handleSyncWrite(result.data.id, newTitle, previousTitle);
}

//------------------------------------------------------------

// read or getById

async function handleSelectNote(id: string) {
  const sidebar = getAppItem("sidebar");
  const editor = getAppItem("editor");
  debouncedUpdateStats.cancel();
  await stopAutoSave(editor, "flush");
  const result = await getNoteById(id);
  if (!result.success) {
    console.error("[handleSelectNote]: Failed to fetch note:", result.error);
    return;
  }
  if (isSyncEnabled()) {
    handleSync(id, result.data.updated_at).catch((error) =>
      console.error(
        "[handleSelectNote]: Error while trying to sync note",
        error,
      ),
    );
  }
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${id}"]`,
    sidebar,
  );
  if (!noteElement) return;
  stateStore.setState({ activeId: id });
  await handleViewNote(result.data);
  setActiveItem(noteElement, sidebar);
}

//------------------------------------------------------------

// view function for editor content. gets called in combination with handleSelect

async function handleViewNote(note: Note) {
  const editor = getAppItem("editor");
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
