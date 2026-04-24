import type { Note } from "../../shared/schemas/noteSchema";
import { formatNoteDate } from "./helpers";
import { renderIcons } from "./icons";

function createNoteItem(note: Note): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "noteItem";
  item.dataset["id"] = note.id;
  const header = document.createElement("div");
  header.className = "note-header";
  const title = document.createElement("span");
  title.className = "note-title";
  title.textContent = note.title;
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  const dots = document.createElement("span");
  dots.className = "dots";
  deleteBtn.append(dots);
  header.append(title, deleteBtn);
  const metadata = document.createElement("div");
  metadata.className = "note-metadata";
  const date = document.createElement("div");
  date.className = "note-date";
  date.textContent = formatNoteDate(note.updated_at);
  metadata.append(date);
  const content = document.createElement("div");
  content.className = "note-content";
  content.textContent = note.snippet;
  item.append(header, metadata, content);
  renderIcons(item);
  return item;
}

export { createNoteItem };
