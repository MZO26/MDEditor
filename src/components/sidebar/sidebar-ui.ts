import { createNoteItem } from "@/components/sidebar/sidebar-note-items";
import { noteStore, stateStore } from "@/settings/app-state";
import { findElement, requireElement, setActiveItem } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { compareNotes, updateNoteCount } from "@/utils/note";
import { getAppItem, getInfobarItems, getTemplateItem } from "@/utils/registry";
import { getTodoStats } from "@shared/generators";
import type { EditorDoc } from "@shared/schemas/editor-schema";
import type { Note } from "@shared/schemas/note-schema";
import type { ViewItem } from "@shared/types";

// sidebar

// element is either appContainer (normal sidebar is bound to grid layout) or infoSidebar itself as it's positioned absolute

function setSidebarState(element: HTMLDivElement, collapsed: boolean) {
  const isCollapsed = element.classList.contains("collapsed");
  if (isCollapsed === collapsed) return;
  element.classList.toggle("collapsed", collapsed);
}

//-----------------------------------------------------------

// sidebar empty state (only applies to normal sidebar. info-sidebar does not have one)

function handleSidebarEmptyState() {
  const sidebar = getAppItem("sidebar");
  const { notes } = noteStore.getState();
  const { searchQuery } = stateStore.getState();
  let shouldShowEmptyState = false;
  if (notes.length === 0) {
    shouldShowEmptyState = true;
  } else if (searchQuery.trim() !== "") {
    const visibleItems = sidebar.querySelectorAll(".note-item:not(.hidden)");
    shouldShowEmptyState = visibleItems.length === 0;
  } else {
    shouldShowEmptyState = false;
  }
  const existingEmptyState = findElement<HTMLDivElement>(
    ".sidebar-empty-state",
    sidebar,
  );
  if (shouldShowEmptyState) {
    if (!existingEmptyState) {
      const template = getTemplateItem("sidebarEmptyStateTemplate");
      const newEmptyState = template.content.firstElementChild?.cloneNode(
        true,
      ) as HTMLDivElement;
      updateSidebarEmptyState(newEmptyState);
      sidebar.appendChild(newEmptyState);
    } else {
      updateSidebarEmptyState(existingEmptyState);
    }
  } else {
    if (existingEmptyState) {
      existingEmptyState.remove();
    }
  }
}

function updateSidebarEmptyState(emptyState: HTMLDivElement) {
  const { searchQuery } = stateStore.getState();
  const isSearch = Boolean(searchQuery?.trim());
  const titleEl = requireElement<HTMLHeadingElement>(
    ".empty-state-title",
    emptyState,
  );
  const descEl = requireElement<HTMLParagraphElement>(
    ".empty-state-description",
    emptyState,
  );
  const iconEl = requireElement<HTMLElement>("#sidebar-empty-icon", emptyState);
  const newIcon = document.createElement("i");
  if (isSearch) {
    newIcon.setAttribute("data-lucide", "search-x");
    titleEl.textContent = "No results found";
    const strongEl = document.createElement("strong");
    strongEl.textContent = `"${searchQuery}"`;
    descEl.replaceChildren("No notes matching ", strongEl);
  } else {
    newIcon.setAttribute("data-lucide", "library");
    titleEl.textContent = "No notes here";
  }
  iconEl.replaceChildren(newIcon);
  renderIcons(emptyState);
}

//----------------------------------------------------------

// create view options

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

//-----------------------------------------------------------

// render note list

function renderNoteList(notes: Note[]) {
  const sidebar = getAppItem("sidebar");
  const fragment = document.createDocumentFragment();
  for (const note of [...notes].sort(compareNotes)) {
    const element = createNoteItem(note);
    fragment.appendChild(element);
  }
  sidebar.replaceChildren(fragment);
  const { activeId } = stateStore.getState();
  if (!activeId) return;
  const activeElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${activeId}"]`,
    sidebar,
  );
  if (activeElement) {
    setActiveItem(activeElement, sidebar);
  }
}

// create note

function prependNoteToList(note: Note) {
  const sidebar = getAppItem("sidebar");
  const noteElement = createNoteItem(note);
  sidebar.prepend(noteElement);
}

// delete note

function removeNoteFromList(noteId: string) {
  const sidebar = getAppItem("sidebar");
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${noteId}"]`,
    sidebar,
  );
  if (!noteElement) {
    console.error("[removeNoteFromList]: Note Element not found.");
    return;
  }
  noteElement.remove();
}

// update note

function updateNoteInList(note: Note) {
  const sidebar = getAppItem("sidebar");
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${note.id}"]`,
    sidebar,
  );
  if (!noteElement) {
    console.error("[updateNoteInList]: Note Element not found.");
    return;
  }
  const wasActive = noteElement.classList.contains("is-active");
  const newElement = createNoteItem(note);
  noteElement.replaceWith(newElement);
  if (wasActive) {
    setActiveItem(newElement, sidebar);
  }
}

//------------------------------------------------------------

// info-sidebar

function showTodoProgress(content: EditorDoc) {
  const stats = getTodoStats(content);
  const { todoContainer, todoCount, todoProgress } = getInfobarItems([
    "todoContainer",
    "todoCount",
    "todoProgress",
  ]);
  if (stats.total === 0) {
    if (todoContainer.style.display !== "none")
      todoContainer.style.display = "none";
    return;
  }
  if (todoContainer.style.display !== "block")
    todoContainer.style.display = "block";

  todoCount.textContent = `${stats.completed}/${stats.total}`;
  const percentage = (stats.completed / stats.total) * 100;
  todoProgress.style.width = `${percentage}%`;
  todoProgress.style.backgroundColor =
    percentage === 100 ? "var(--tag-color)" : "var(--text-muted)";
}

export {
  createViews,
  handleSidebarEmptyState,
  prependNoteToList,
  removeNoteFromList,
  renderNoteList,
  setSidebarState,
  showTodoProgress,
  updateNoteCount,
  updateNoteInList,
};
