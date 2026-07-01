import { updateSettings } from "@/api/api";
import {
  buildSnippet,
  updateSnippetHighlight,
} from "@/components/sidebar/sidebar-note-items";
import type { SearchMatchResult } from "@/notes/search";
import { noteStore, searchEngine, stateStore } from "@/settings/app-state";
import { debounce } from "@/utils/async";
import { requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { estimateReadingTime } from "@/utils/note";
import { getAppItem, getUIItem, getUIItems } from "@/utils/registry";
import { initTippyDelegate } from "@/utils/ui";
import { DEBOUNCE_MS } from "@shared/constants";
import type { ResizeOptions } from "@shared/types";
import tippy from "tippy.js";

// sidebar

export let allTagsMenu: ReturnType<typeof createAllTagsPopover> | null = null;

function handleSearchInput(searchInput: string) {
  const sidebar = getAppItem("sidebar");
  const nextQuery = searchInput.trim();
  const prevQuery = stateStore.get("searchQuery");
  if (nextQuery === prevQuery) return;
  stateStore.setState({ searchQuery: nextQuery });
  if (!nextQuery) {
    restoreSidebarScope();
    return;
  }
  const results = nextQuery.startsWith("#")
    ? searchEngine.searchTags(nextQuery.slice(1))
    : searchEngine.search(nextQuery);
  applySearch(results);
  const noteElements = Array.from(
    sidebar.getElementsByClassName("note-item"),
  ) as HTMLDivElement[];
  updateSearchHighlights(noteElements, results);
}

function updateSearchHighlights(
  noteElements: HTMLDivElement[],
  results: SearchMatchResult[],
) {
  const resultsById = new Map(
    results.map((result) => [result.item.id, result]),
  );
  const noteIndex = noteStore.get("noteIndex");
  for (const noteElement of noteElements) {
    const noteId = noteElement.getAttribute("data-id");
    if (!noteId) continue;
    const result = resultsById.get(noteId);
    if (result) {
      const { snippet, indices } = buildSnippet(
        result.item.plainText ?? "",
        result.item.snippet,
        result.queryTerms,
      );
      updateSnippetHighlight(noteElement, snippet, indices);
      continue;
    }
    const note = noteIndex.get(noteId);
    if (!note) continue;
    updateSnippetHighlight(noteElement, note.snippet, []);
  }
}

// applies the search to the note state to only show searched items or empty state

function applySearch(searchMatches: SearchMatchResult[]) {
  const matchedIdSet = new Set(searchMatches.map((match) => match.item.id));
  const activeTag = stateStore.get("activeTag");
  const notes = noteStore.get("notes");
  const visibleIds = notes
    .filter((note) => {
      const isSearchMatch = matchedIdSet.has(note.id);
      const matchesActiveTag = !activeTag || note.tags.includes(activeTag);
      return isSearchMatch && matchesActiveTag;
    })
    .map((note) => note.id);
  noteStore.setState({
    visibleIds,
    sidebarChange: { type: "reload" },
  });
}

// removes search scope but stays in activeTag scope if there is one

function restoreSidebarScope() {
  const activeTag = stateStore.get("activeTag");
  noteStore.setState((state) => ({
    visibleIds: activeTag
      ? state.notes
          .filter((note) => note.tags.includes(activeTag))
          .map((note) => note.id)
      : state.notes.map((note) => note.id),
    sidebarChange: { type: "reload" },
  }));
}

//------------------------------------------------------------

// footer-bar

function updateStats() {
  const editor = getAppItem("editor");
  const { wordCountEl, charCountEl, readingTime } = getUIItems([
    "wordCountEl",
    "charCountEl",
    "readingTime",
  ]);
  const charCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  charCountEl.textContent = charCount.toString();
  wordCountEl.textContent = wordCount === 1 ? "1 word" : `${wordCount} words`;
  readingTime.textContent = estimateReadingTime(wordCount);
}

//------------------------------------------------------------

// sidebar-header all tag button

function createAllTagsPopover(button: HTMLButtonElement) {
  const popover = document.createElement("div");
  popover.className = "tags-popover";
  const content = document.createElement("div");
  content.className = "tags-popover-content";
  const span = document.createElement("span");
  span.className = "info-span tags-popover-title";
  span.textContent = "All Tags";
  popover.append(span, content);
  content.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const clickedTag = target.closest(".tag-node") as HTMLElement | null;
    const tagId = clickedTag?.getAttribute("data-tag");
    if (clickedTag && tagId) {
      applyTagView(tagId);
      return;
    }
  });
  const instance = tippy(button, {
    content: popover,
    trigger: "manual",
    interactive: true,
    theme: "preview-theme",
    appendTo: () => document.body,
  });
  initTippyDelegate(popover, popover, "auto", false);
  renderIcons(button);
  return { button, popover, content, tippy: instance };
}

function applyTagView(tagId: string) {
  const normalizedTag = tagId.trim().toLowerCase();
  if (!normalizedTag) return;
  stateStore.setState({ activeTag: normalizedTag });
  updateSettings({ "active-tag": normalizedTag });
  noteStore.setState((state) => ({
    visibleIds: state.notes
      .filter((note) => note.tags.includes(normalizedTag))
      .map((note) => note.id),
    sidebarChange: { type: "reload" },
  }));
}

function clearActiveTagFilter() {
  stateStore.setState({ activeTag: null, searchQuery: "" });
  const searchInput = getUIItem("searchInput");
  searchInput.value = "";
  updateSettings({ "active-tag": null });
  noteStore.setState((state) => ({
    visibleIds: state.notes.map((n) => n.id),
    sidebarChange: { type: "reload" },
  }));
  return;
}

function renderAllTags(button: HTMLButtonElement, tags: string[]) {
  const menu = (allTagsMenu ??= createAllTagsPopover(button));
  const frag = document.createDocumentFragment();
  for (const tag of [...new Set(tags)]) {
    const item = document.createElement("span");
    item.className = "tags-popover-item tag-node";
    item.setAttribute("data-tippy-content", `#${tag}`);
    item.dataset["tag"] = tag;
    item.textContent = `#${tag}`;
    frag.appendChild(item);
  }
  menu.content.replaceChildren(frag);
}

//-------------------------------------------------------------

// resizing logic

function resizeSidebar(
  resizerSelector: string,
  sidebarSelector: string,
  options: ResizeOptions = {},
) {
  const {
    minWidth = 0,
    maxWidth = 420,
    cssVariable = "--sidebar-width",
  } = options;
  const resizer = requireElement<HTMLDivElement>(resizerSelector);
  const sidebar = requireElement<HTMLDivElement>(sidebarSelector);
  let isResizing = false;
  let isUpdatePending = false;
  let startX = 0;
  let startWidth = 0;
  resizer.addEventListener("pointerdown", (e: PointerEvent) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.getBoundingClientRect().width;
    resizer.setPointerCapture(e.pointerId);
    document.body.classList.add("is-dragging");
    document.body.style.userSelect = "none";
  });

  document.addEventListener("pointermove", (e: PointerEvent) => {
    if (!isResizing || isUpdatePending) return;
    isUpdatePending = true;
    requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      const adjustedWidth = startWidth + deltaX;
      const newWidth = Math.max(minWidth, Math.min(adjustedWidth, maxWidth));

      document.documentElement.style.setProperty(cssVariable, `${newWidth}px`);
      isUpdatePending = false;
    });
  });

  document.addEventListener("pointerup", (e: PointerEvent) => {
    if (isResizing) {
      isResizing = false;
      if (resizer.hasPointerCapture(e.pointerId)) {
        resizer.releasePointerCapture(e.pointerId);
      }
      document.body.classList.remove("is-dragging");
      document.body.style.userSelect = "";
    }
  });
}

//------------------------------------------------------------

// debounced functions

const debouncedSearch = debounce((e: Event) => {
  const target = e.target as HTMLInputElement | null;
  if (!target) return;
  const value = target.value.trim();
  handleSearchInput(value ?? "");
}, DEBOUNCE_MS.fast);

export {
  applyTagView,
  clearActiveTagFilter,
  debouncedSearch,
  handleSearchInput,
  renderAllTags,
  resizeSidebar,
  updateStats,
};
