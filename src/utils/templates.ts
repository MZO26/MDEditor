import DOMPurify from "dompurify";
import emptyEditor from "../assets/emptyEditor.svg?raw";
import emptySidebar from "../assets/emptySidebar.svg?raw";
import searchNotFound from "../assets/searchNotFound.svg?raw";
import type { Note } from "../shared/types";
import { formatNoteDate } from "./helpers";
import { renderIcons } from "./icons";

function generateSnippet(plainText: string) {
  return plainText
    .replace(/#[\p{L}\p{N}_]+/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 50);
}

function noteItemTemplate(note: Omit<Note, "id" | "created_at">) {
  const { title, snippet, plainText, updated_at, tags } = note;
  const preview = snippet ? snippet : generateSnippet(plainText);
  const formattedDate = formatNoteDate(updated_at);
  const htmlString = `<div class="note-header">
                <span class="note-title">${title}</span>
                <button class="delete-btn">
                <i data-lucide="trash-2"></i>
                </button>
              </div>
              <div class="note-metadata">
                <div class="note-date">${formattedDate}</div>
                <div class="note-tags">
                  ${tags?.map((tag) => `<span class="tag">#${tag}</span>`).join("")}
                </div>
              </div>
                <div class="note-content">${preview}</div>
              `;
  return DOMPurify.sanitize(htmlString);
}

function showSidebarEmptyState(searchInput?: string | undefined) {
  const emptyStateContainer = document.createElement("div");
  const p = document.createElement("p");
  emptyStateContainer.className = "sidebar-empty-state";
  if (searchInput) {
    emptyStateContainer.innerHTML = searchNotFound;
    const safeInput = DOMPurify.sanitize(searchInput);
    p.innerHTML = `No results found for <strong>${safeInput}</strong>`;
  } else {
    emptyStateContainer.innerHTML = emptySidebar;
    p.innerHTML = "No notes here";
  }
  emptyStateContainer.appendChild(p);
  return emptyStateContainer;
}

function showEditorEmptyState() {
  const emptyStateContainer = document.createElement("div");
  const p = document.createElement("p");
  p.innerHTML =
    "Create a new note by clicking + <br/> To view a note select an item in the sidebar";
  emptyStateContainer.className = "editor-empty-state";
  emptyStateContainer.innerHTML = emptyEditor;
  emptyStateContainer.appendChild(p);
  return emptyStateContainer;
}

function getNoteItemUI(note: Note) {
  const noteElement = document.createElement("div");
  noteElement.classList.add("noteItem");
  noteElement.dataset["id"] = note.id;
  noteElement.innerHTML = noteItemTemplate(note);
  renderIcons(noteElement);
  return noteElement;
}

export {
  generateSnippet,
  getNoteItemUI,
  noteItemTemplate,
  showEditorEmptyState,
  showSidebarEmptyState,
};
