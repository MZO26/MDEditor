import { getManyById, getViews } from "@/api/api";
import {
  reloadNoteList,
  showTodoProgress,
} from "@/components/sidebar/sidebar-ui";
import { searchEngine, stateStore } from "@/settings/app-state";
import { debounce } from "@/utils/async";
import { formatNoteDate } from "@/utils/date";
import { estimateReadingTime } from "@/utils/note";
import { getAppItem, getInfobarItem, getInfobarItems } from "@/utils/registry";
import { DEBOUNCE_MS } from "@shared/constants";
import type { Note } from "@shared/schemas/note-schema";
import type { View } from "@shared/types";

// sidebar

function handleSearchInput(searchInput: string) {
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
  const matchingIds = new Set(limitedResults.map((note: Note) => note.id));
  for (const element of noteElements) {
    const noteId = element.getAttribute("data-id");
    const isMatch = noteId ? matchingIds.has(noteId) : false;
    element.classList.toggle("hidden", !isMatch);
  }
}

async function handleViews(view: View) {
  const editor = getAppItem("editor");
  stateStore.setState({ searchQuery: "" });
  editor.commands.setSearchTerm("");
  const result = await getViews(view);
  if (!result.success) {
    console.error("[handleViews]: Failed to fetch views:", result.error);
    return;
  }
  await reloadNoteList(result.data);
}

//------------------------------------------------------------

// info-sidebar

function updateInfoHeader(date: Note["created_at"], title: Note["title"]) {
  const container = getInfobarItem("headerContainer");
  if (!container) return;
  container.replaceChildren();
  if (!date || !title) return;
  const formattedDate = formatNoteDate(date);
  const span = document.createElement("span");
  const h4 = document.createElement("h4");
  span.classList.add("info-span");
  span.textContent = formattedDate;
  h4.classList.add("note-title");
  h4.textContent = title.trim();
  container.append(span, h4);
}

function updateNoteTags(tags: Note["tags"]) {
  const container = getInfobarItem("tagContainer");
  if (!container) return;
  container.replaceChildren();
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    const span = document.createElement("span");
    span.classList.add("tag", "searchTag");
    span.setAttribute("data-tag", String(tag));
    span.textContent = `#${tag}`;
    container.append(span);
  }
}

async function updateNoteLinks(links: Note["links"]) {
  const container = getInfobarItem("linkContainer");
  if (!container) return;
  container.replaceChildren();
  if (!links || links.length === 0) return;
  const ids: string[] = links.map((link) => link.id);
  const relatedNotes = await getManyById(ids);
  if (!relatedNotes.success) {
    console.error(
      "[updateNoteLinks]: Failed to fetch linked notes:",
      relatedNotes.error,
    );
    return;
  }
  const linkMap = new Map<string, string>();
  for (const note of relatedNotes.data) {
    linkMap.set(note.id, note.title.trim());
  }
  for (const link of links) {
    const span = document.createElement("span");
    span.classList.add("link");
    span.setAttribute("data-link", link.id);
    span.textContent = `${link.dir}: ${linkMap.get(link.id) ?? link.id}`;
    container.append(span);
  }
}

async function updateStats(note: Note) {
  const editor = getAppItem("editor");
  const { wordCountEl, charCountEl, readingTime } = getInfobarItems([
    "wordCountEl",
    "charCountEl",
    "readingTime",
  ]);
  const charCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  charCountEl.textContent = charCount.toString();
  wordCountEl.textContent = wordCount === 1 ? "1 word" : `${wordCount} words`;
  readingTime.textContent = estimateReadingTime(wordCount);
  showTodoProgress(note.content);
  updateNoteTags(note.tags);
  updateInfoHeader(note.created_at, note.title);
  await updateNoteLinks(note.links);
}

//------------------------------------------------------------

// debounced functions

const debouncedUpdateStats = debounce(updateStats, DEBOUNCE_MS.normal);

const debouncedSearch = debounce((e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value.trim();
  handleSearchInput(value);
}, DEBOUNCE_MS.normal);

export { debouncedSearch, debouncedUpdateStats, handleViews };
