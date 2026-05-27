import { getAll, getByTag, getViews } from "@/api/api";
import { createNoteItem } from "@/components/sidebar/sidebar-items";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { noteStore, searchEngine, stateStore } from "@/settings/app-state";
import { debounce } from "@/utils/async";
import { findElement, requireElement, setActiveItem } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import { DEBOUNCE_MS } from "@shared/constants";
import type { Note } from "@shared/schemas/note-schema";
import type { ViewItem } from "@shared/types";

async function handleSearchInput(searchInput: string) {
  const editor = getAppItem("editor");
  const sidebar = getAppItem("sidebar");
  stateStore.setState({ searchQuery: searchInput });
  const noteElements = Array.from(
    sidebar.getElementsByClassName("note-item"),
  ) as HTMLDivElement[];
  editor.commands.setSearchTerm(searchInput);
  if (searchInput === "") {
    for (const element of noteElements) {
      element.classList.remove("hidden");
    }
    return;
  }
  const results = searchEngine.search(searchInput);
  const limitedResults = results.slice(0, 50);
  const matchingIds = new Set(limitedResults.map((note) => note.id));
  for (const element of noteElements) {
    const noteId = element.getAttribute("data-id");
    const isMatch = noteId ? matchingIds.has(noteId) : false;
    element.classList.toggle("hidden", !isMatch);
  }
}

const debouncedSearch = debounce((e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value.trim();
  void handleSearchInput(value);
}, DEBOUNCE_MS.normal);

function createViews(views: ViewItem[]) {
  const select = requireElement<HTMLSelectElement>(".view-select");
  for (const view of views) {
    const option = document.createElement("option");
    option.textContent = view["label"];
    option.value = view["id"];
    select.append(option);
  }
  return select;
}

async function handleViews(view: string) {
  const editor = getAppItem("editor");
  stateStore.setState({ activeView: view, searchQuery: "" });
  editor.commands.setSearchTerm("");
  const result = await getViews(view);
  if (!result.success) {
    console.error("[handleViews]: Failed to fetch views:", result.error);
    return;
  }
  await reloadNoteList(result.data);
}

async function searchByTag(tag: string) {
  const sidebar = getAppItem("sidebar");
  const result = await getByTag(tag);
  if (!result.success) {
    console.error("[searchByTag]: Failed to fetch notes by tag:", result.error);
    return;
  }
  const noteElements = Array.from(
    sidebar.getElementsByClassName("note-item"),
  ) as HTMLDivElement[];
  const matchingIds = new Set(result.data.map((note) => note.id));
  for (const element of noteElements) {
    const noteId = element.getAttribute("data-id");
    const isMatch = noteId ? matchingIds.has(noteId) : false;
    element.classList.toggle("hidden", !isMatch);
  }
}

function toggleSidebar(appContainer: HTMLDivElement) {
  const collapsed = appContainer.classList.contains("collapsed");
  setSidebarState(appContainer, !collapsed);
}

function createNoteUpdater() {
  let element: HTMLDivElement | null = null;
  return function updateNoteCount(notes: Note[]) {
    element ??= findElement<HTMLDivElement>(".note-count");
    if (!element) return;
    const count = notes.length;
    element.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
  };
}

const updateNoteCount = createNoteUpdater();

function getNotePriority(note: Note) {
  if (note.pinned && note.bookmarked) return 0; // top priority if it happens
  if (note.pinned) return 1; // highest priority
  if (note.bookmarked) return 2; // middle
  return 3; // normal
}

// this function returns a number by which note items are being displayed in the sidebar. If it returns a negative number, a comes first, then b
function compareNotes(a: Note, b: Note) {
  const priorityDiff = getNotePriority(a) - getNotePriority(b); // example: pinned note a (1) - regular note b(3) = -2, which means a comes before b
  if (priorityDiff !== 0) return priorityDiff;
  // if priorities are equal, they get sorted by updated_at
  return String(b.updated_at).localeCompare(String(a.updated_at));
}

function addOneNoteToList(note: Note) {
  const noteElement = createNoteItem(note);
  let target: Element | null = null;
  const sidebar = getAppItem("sidebar");
  for (const child of sidebar.children) {
    const element = child as HTMLElement;
    if (
      element.getAttribute("data-pinned") !== "true" &&
      element.getAttribute("data-bookmarked") !== "true"
    ) {
      target = element;
      break;
    }
  }
  requestAnimationFrame(() => {
    if (target && sidebar.contains(target)) {
      sidebar.insertBefore(noteElement, target);
    } else {
      sidebar.appendChild(noteElement);
    }
  });
  setActiveItem(noteElement, sidebar);
}

function addManyNotesToList(notes: Note[]) {
  const sidebar = getAppItem("sidebar");
  const fragment = document.createDocumentFragment();
  for (const note of notes) {
    const noteElement = createNoteItem(note);
    if (noteElement) {
      fragment.appendChild(noteElement);
    }
  }
  requestAnimationFrame(() => {
    sidebar.appendChild(fragment);
    const { activeId } = stateStore.getState();
    if (!activeId) return;
    const noteElement = findElement<HTMLDivElement>(
      `.note-item[data-id="${activeId}"]`,
      getAppItem("sidebar"),
    );
    if (noteElement) setActiveItem(noteElement, sidebar);
  });
}

async function reloadNoteList(notes?: Note[]) {
  const sidebar = getAppItem("sidebar");
  sidebar.replaceChildren();
  if (notes) {
    const sortedNotes = notes.sort(compareNotes);
    noteStore.setState({ notes: sortedNotes });
    addManyNotesToList(sortedNotes);
    return;
  }
  const result = await getAll();
  if (!result.success) {
    console.error("[getAll]: Failed to fetch all notes:", result.error);
    return;
  } else {
    const sortedNotes = result.data.sort(compareNotes);
    noteStore.setState({ notes: sortedNotes });
    addManyNotesToList(sortedNotes);
  }
}

async function updateNoteInList(note: Note) {
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${note.id}"]`,
    getAppItem("sidebar"),
  );
  if (!noteElement) {
    console.warn("Note Element not found.");
    return;
  }
  const wasActive = noteElement.classList.contains("is-active");
  const newElement = createNoteItem(note);
  if (wasActive) {
    setActiveItem(newElement, getAppItem("sidebar"));
  }
  noteElement.replaceWith(newElement);
}

export {
  addManyNotesToList,
  addOneNoteToList,
  createViews,
  debouncedSearch,
  handleSearchInput,
  handleViews,
  reloadNoteList,
  searchByTag,
  toggleSidebar,
  updateNoteCount,
  updateNoteInList,
};
