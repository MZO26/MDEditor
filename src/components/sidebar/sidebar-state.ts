import { debouncedSetSettings } from "@/api/settingsAPI";
import emptySidebar from "@/assets/emptySidebar.svg?raw";
import searchNotFound from "@/assets/searchNotFound.svg?raw";
import { getElement } from "@/utils/helpers";

async function setSidebarState(
  element: HTMLElement,
  key: string,
  collapsed: boolean,
): Promise<void> {
  const isCollapsed = element.classList.contains("collapsed");
  if (isCollapsed === collapsed) return;
  element.classList.toggle("collapsed", collapsed);
  debouncedSetSettings({ [key]: collapsed });
}

function handleSidebarEmptyState(
  container: HTMLDivElement = getElement<HTMLDivElement>(".notes-container"),
  searchInput?: string | undefined,
) {
  if (!container) return;
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

function showSidebarEmptyState(searchInput?: string) {
  const emptyStateContainer = document.createElement("div");
  emptyStateContainer.className = "sidebar-empty-state";
  if (searchInput) {
    emptyStateContainer.innerHTML = searchNotFound;
    const p = document.createElement("p");
    p.append(`No results found for ${searchInput}`);
    emptyStateContainer.append(p);
  } else {
    emptyStateContainer.innerHTML = emptySidebar;
    const p = document.createElement("p");
    p.textContent = "No notes here";
    emptyStateContainer.append(p);
  }
  return emptyStateContainer;
}

export { handleSidebarEmptyState, setSidebarState };
