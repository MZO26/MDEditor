import { formatNoteDate } from "@/utils/date";
import { findElement, requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import type { Note } from "@shared/schemas/note-schema";

const template = requireElement<HTMLTemplateElement>("#note-item-template");

const baseNoteItem = template.content.firstElementChild as HTMLDivElement;

function createNoteItem(note: Note): HTMLDivElement {
  // Deep clone with true
  const item = baseNoteItem.cloneNode(true) as HTMLDivElement;
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
