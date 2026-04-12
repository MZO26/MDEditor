import { deleteNote, getAll, getNoteById } from "../features/notes/noteAPI";
import { viewNote } from "../features/notes/noteHandlers";
import { handleEditorEmptyState } from "../handlers/editorHandlers";
import type { Note, NoteItemElements } from "../shared/types";
import { setValue, StorageKeys } from "../utils/cache";
import { formatNoteDate, getElement, setActiveItem } from "../utils/helpers";
import { getNoteItemUI, showSidebarEmptyState } from "../utils/templates";
import { editor } from "./editor";

async function initNotesSidebar(): Promise<void> {
  const container = getElement<HTMLDivElement>(".notes-container");
  if (!container) return;
  container.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const deleteBtn = target.closest<HTMLButtonElement>(".delete-btn");
    if (deleteBtn) {
      const noteElement = deleteBtn.closest<HTMLDivElement>(".noteItem");
      const noteID = noteElement?.dataset["id"];
      if (!noteID) return;
      await deleteNote(noteID, noteElement);
      handleSidebarEmptyState(container);
      handleEditorEmptyState();
      return;
    }
    const noteItem = target.closest<HTMLDivElement>(".noteItem");
    const noteID = noteItem?.dataset["id"];
    if (!noteID) return;
    const note = await getNoteById(noteID);
    if (note && editor) {
      setValue(StorageKeys.NOTE_ID, noteID);
      viewNote(note, editor);
      console.log("Viewing note with content: ", note.snippet);
      setActiveItem(noteItem, container);
      return;
    }
  });
}

function handleSidebarEmptyState(
  container: HTMLDivElement,
  searchInput?: string | undefined,
) {
  if (container.childElementCount === 0) {
    const emptyStateNode = showSidebarEmptyState(searchInput);
    container.appendChild(emptyStateNode);
    return;
  } else if (
    container.childElementCount === 1 &&
    container.firstElementChild?.classList.contains("sidebar-empty-state")
  ) {
    return;
  }
  const existingEmptyState = container.querySelector(".sidebar-empty-state");
  if (existingEmptyState) {
    existingEmptyState.remove();
  }
}

function addOneNoteToList(note: Note): HTMLDivElement | undefined {
  const container = getElement<HTMLDivElement>(".notes-container");
  const noteElement = getNoteItemUI(note);
  if (noteElement) {
    container.prepend(noteElement);
    handleSidebarEmptyState(container);
    const noteID = noteElement.dataset["id"];
    if (noteID) {
      setValue(StorageKeys.NOTE_ID, noteID);
    }
    return noteElement;
  }
  return undefined;
}

function addManyNotesToList(notes: Note[]): void {
  const fragment = document.createDocumentFragment();
  const container = getElement<HTMLDivElement>(".notes-container");
  notes.forEach((note: Note) => {
    const noteElement = getNoteItemUI(note);
    if (noteElement) {
      fragment.appendChild(noteElement);
    }
  });
  container.appendChild(fragment);
  handleEditorEmptyState();
  handleSidebarEmptyState(container);
}

function updateNoteInList(note: Note): void {
  const noteElement = getElement<HTMLDivElement>(
    `.noteItem[data-id="${note.id}"]`,
  );
  if (!noteElement) {
    console.warn(`Note element with ID ${note.id} not found for update.`);
    return;
  }
  const titleContainer =
    noteElement.querySelector<HTMLDivElement>(".note-title");
  const snippetContainer =
    noteElement.querySelector<HTMLDivElement>(".note-content");
  const tagContainer = noteElement.querySelector<HTMLDivElement>(".note-tags");
  const dateContainer = noteElement.querySelector<HTMLDivElement>(".note-date");
  const tags = note.tags.slice(0, 3);
  updateTransition(
    {
      containers: {
        tagContainer,
        snippetContainer,
        titleContainer,
        dateContainer,
      },
      tags: tags,
    },
    note,
  );
}

function updateTransition(data: NoteItemElements, note: Note) {
  const { tagContainer, snippetContainer, dateContainer, titleContainer } =
    data.containers;
  if (!tagContainer || !snippetContainer || !dateContainer || !titleContainer) {
    console.warn("Missing elements, skipping transition.");
    return;
  }
  document.startViewTransition(() => {
    tagContainer.innerHTML = "";
    data.tags.forEach((tagItem) => {
      const tagElement = document.createElement("span");
      tagElement.classList.add("tag");
      tagElement.textContent = `#${tagItem}`;
      tagContainer.appendChild(tagElement);
    });
    snippetContainer.textContent = note.snippet;
    dateContainer.textContent = formatNoteDate(note.updated_at);
    titleContainer.textContent = note.title;
  });
}

async function reloadNoteList(): Promise<void> {
  const container = getElement<HTMLDivElement>(".notes-container");
  if (!container) return;
  container.innerHTML = "";
  try {
    const response = await getAll();
    if (!response) {
      console.warn("Attempted to reload missing notes");
      return;
    }
    addManyNotesToList(response);
    return;
  } catch (error) {
    console.error("Error loading notes:", error);
    return;
  }
}

export {
  addManyNotesToList,
  addOneNoteToList,
  handleSidebarEmptyState,
  initNotesSidebar,
  reloadNoteList,
  updateNoteInList,
};
