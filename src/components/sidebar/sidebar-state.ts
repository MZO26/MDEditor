import { noteStore, searchEngine, stateStore } from "@/settings/app-state";
import { findElement, requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { getAppItem, getTemplateItem } from "@/utils/registry";

function setSidebarState(element: HTMLDivElement, collapsed: boolean) {
  const isCollapsed = element.classList.contains("collapsed");
  if (isCollapsed === collapsed) return;
  element.classList.toggle("collapsed", collapsed);
}

function handleSidebarEmptyState() {
  const sidebar = getAppItem("sidebar");
  const { notes } = noteStore.getState();
  const { searchQuery } = stateStore.getState();
  let shouldShowEmptyState = false;
  if (searchQuery.trim() !== "") {
    const results = searchEngine.search(searchQuery);
    shouldShowEmptyState = results.length === 0;
  } else {
    shouldShowEmptyState = notes.length === 0;
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
    descEl.textContent = "Create a note to get started.";
  }
  iconEl.replaceChildren(newIcon);
  renderIcons(emptyState);
}

export { handleSidebarEmptyState, setSidebarState };
