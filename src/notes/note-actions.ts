import {
  createManyNotes,
  createNote,
  deleteNote,
  getNoteById,
  importNote,
  showNotification,
  updateNote,
} from "@/api/api";
import { resetEditorHistory } from "@/components/editor/editor-init";
import { updateStats } from "@/components/sidebar/sidebar-features";
import { setImportedContent } from "@/notes/import-actions";
import { handleConflict, isMirrorEnabled } from "@/notes/note-conflict";
import { noteStore, searchEngine, stateStore } from "@/settings/app-state";
import { debounce } from "@/utils/async";
import { toNoteListItem } from "@/utils/note";
import { getAppItem } from "@/utils/registry";
import { DEBOUNCE_MS, EMPTY_DOC, UNTITLED } from "@shared/constants";
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
  const editor = getAppItem("editor");
  const editorContent = EMPTY_DOC;
  const metadata = getMetadata(editorContent);
  const payload: CreateNotePayload = {
    content: editorContent,
    ...(isMirrorEnabled() ? { markdown: "" } : {}),
    ...metadata,
    title: UNTITLED,
    pinned: false,
    bookmarked: false,
  };
  const result = await createNote(payload);
  if (!result.success) {
    console.error("[handleCreateNote]: Failed to create note:", result.error);
    return;
  }
  const noteListItem = toNoteListItem(result.data);
  noteStore.setState((state) => ({
    activeNote: result.data,
    notes: [noteListItem, ...state.notes],
    sidebarChange: { type: "prepend", noteId: result.data.id },
  }));
  searchEngine.upsertNote(noteListItem);
  stateStore.setState({ activeId: result.data.id });
  editor.commands.setContent(result.data.content, {
    emitUpdate: false,
  });
  resetEditorHistory(editor);
  requestAnimationFrame(() => {
    editor.commands.focus();
  });
  updateStats();
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
  const notes = new Array(result.data.length);
  let i = 0;
  for (const note of result.data) {
    const noteListItem = toNoteListItem(note);
    notes[i] = noteListItem;
    i++;
  }
  noteStore.setState((state) => ({
    notes: [...notes, ...state.notes],
    sidebarChange: { type: "reload" },
  }));
  searchEngine.addMany(notes);
}

//----------------------------------------------------------

// delete

async function handleDeleteNote(id: string) {
  const editor = getAppItem("editor");
  const { activeId } = stateStore.getState();
  const isActiveDeletedId = activeId === id;
  if (isActiveDeletedId) {
    debouncedSaveNote.cancel();
  }
  const result = await deleteNote(id);
  if (!result.success) {
    console.error("[handleDeleteNote]: Failed to delete:", result.error);
    return;
  }
  noteStore.setState((state) => ({
    activeNote: state.activeNote?.id === id ? null : state.activeNote,
    notes: state.notes.filter((note) => note.id !== id),
    sidebarChange: { type: "remove", noteId: id },
  }));
  searchEngine.removeNote(id);
  if (isActiveDeletedId) {
    stateStore.setState({ activeId: null });
    editor.commands.clearContent();
  }
}

//------------------------------------------------------------

// update

async function handleSaveNote(
  id: string,
  content: Note["content"],
  markdown?: string,
  flush: boolean = false,
) {
  const metaData = getMetadata(content);
  const newTitle = titleGenerator(content);
  const payload: UpdateNotePayload = {
    id,
    title: newTitle,
    content,
    ...metaData,
    ...(isMirrorEnabled() && markdown !== undefined ? { markdown } : {}),
  };
  const result = await updateNote(payload, flush);
  if (!result.success) {
    console.error("[handleSaveNote]: Save failed.", result.error);
    return;
  }
  const updatedListItem = toNoteListItem(result.data);
  noteStore.setState((state) => ({
    activeNote:
      state.activeNote?.id === result.data.id ? result.data : state.activeNote,
    notes: state.notes.map((n) =>
      n.id === updatedListItem.id ? updatedListItem : n,
    ),
    sidebarChange: { type: "update", noteId: result.data.id },
  }));
  searchEngine.upsertNote(updatedListItem);
  updateStats();
}

const debouncedSaveNote = debounce(handleSaveNote, DEBOUNCE_MS.slow);

//------------------------------------------------------------

// read or getById

async function handleSelectNote(id: string) {
  const editor = getAppItem("editor");
  debouncedSaveNote.flush();
  stateStore.setState({ activeId: id });
  noteStore.setState({ activeNote: null });
  const result = await getNoteById(id);
  if (stateStore.getState().activeId !== id) return;
  if (!result.success) {
    console.error("[handleSelectNote]: Failed to fetch note:", result.error);
    return;
  }
  editor.commands.setContent(result.data.content, {
    emitUpdate: false,
  });
  noteStore.setState({ activeNote: result.data });
  const markdown = isMirrorEnabled() ? editor.getMarkdown() : undefined;
  if (markdown !== undefined) {
    await handleConflict(result.data, markdown).catch((error) =>
      console.error(
        "[handleSelectNote -> handleConflict]: Error while trying to sync note",
        error,
      ),
    );
  }
  resetEditorHistory(editor);
  requestAnimationFrame(() => {
    editor.commands.focus();
  });
  updateStats();
}

//------------------------------------------------------------

export {
  debouncedSaveNote,
  handleCreateNote,
  handleDeleteNote,
  handleImportNote,
  handleSaveNote,
  handleSelectNote,
};
