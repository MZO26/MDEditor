import { formatNoteDate } from "@/utils/date";
import { findElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { getTemplateItem } from "@/utils/registry";
import type { Note } from "@shared/schemas/note-schema";

let cachedNoteItem: HTMLDivElement | null = null;

function createNoteItem(note: Note) {
  cachedNoteItem ??= getTemplateItem("noteItemTemplate").content
    .firstElementChild as HTMLDivElement; // if left side has a value it doesn't run right side. -> getTemplateItem only runs once
  const item = cachedNoteItem.cloneNode(true) as HTMLDivElement;
  // Deep clone with true
  item.setAttribute("data-id", note.id);
  item.setAttribute("data-pinned", String(!!note.pinned));
  item.setAttribute("data-bookmarked", String(!!note.bookmarked));
  item.setAttribute("data-tippy-content", note.title);
  if (note.pinned || note.bookmarked) {
    renderIcons(item);
  }
  const titleEl = findElement<HTMLSpanElement>(".note-title", item);
  if (titleEl) titleEl.textContent = note.title;
  const dateEl = findElement<HTMLDivElement>(".note-date", item);
  if (dateEl) dateEl.textContent = formatNoteDate(note.updated_at);
  const contentEl = findElement<HTMLDivElement>(".note-content", item);
  if (contentEl) contentEl.textContent = note.snippet;
  const tagsContainer = findElement<HTMLDivElement>(".note-tags", item);
  if (tagsContainer && note.tags?.length > 0) {
    tagsContainer.replaceChildren();
    for (const tag of note.tags) {
      const span = document.createElement("span");
      span.classList.add("tag");
      span.textContent = `#${tag}`;
      tagsContainer.append(span);
    }
  }
  return item;
}

export { createNoteItem };
