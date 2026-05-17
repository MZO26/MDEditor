import { getManyById } from "@/api/noteAPI";
import { calculateToDos } from "@/extensions/todo-bar";
import { findElement } from "@/utils/dom";
import { formatNoteDate } from "@/utils/format";
import { getAppItem } from "@/utils/registry";
import { showToast } from "@/utils/toast";
import type { Note } from "@shared/schemas/note-schema";

function updateNoteData(date: Note["created_at"], title: Note["title"]) {
  const container = findElement(".info-sidebar-header");
  if (!container) return;
  container.innerHTML = "";
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
  const container = findElement(".tag-container");
  if (!container) return;
  container.innerHTML = "";
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    const span = document.createElement("span");
    span.classList.add("tag", "searchTag");
    span.setAttribute("data-tippy-content", `Filter notes with: ${tag}`);
    span.dataset["tag"] = String(tag);
    span.textContent = `#${tag}`;
    container.append(span);
  }
}

async function updateNoteLinks(links: Note["links"]) {
  const container = findElement(".link-container");
  if (!container) return;
  container.innerHTML = "";
  if (!links || links.length === 0) return;
  const ids: string[] = links.map((link) => link.id);
  const relatedNotes = await getManyById(ids);
  if (!relatedNotes.success) {
    showToast("Error updating note links.");
    return;
  }
  const linkMap = new Map<string, string>();
  for (const note of relatedNotes.data) {
    linkMap.set(note.id, note.title.trim());
  }
  for (const link of links) {
    const span = document.createElement("span");
    span.classList.add("link");
    span.dataset["link"] = link.id;
    span.setAttribute(
      "data-tippy-content",
      `Go to note with ${linkMap.get(link.id) ?? link.id}`,
    );
    span.textContent = `${link.dir}: ${linkMap.get(link.id) ?? link.id}`;
    container.append(span);
  }
}

async function updateStats(note: Note) {
  const editor = getAppItem("editor");
  const charCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  const wordCountEl = findElement<HTMLSpanElement>("#word-count");
  const charCountEl = findElement<HTMLSpanElement>("#char-count");
  const readingTimeEl = findElement("#reading-time");
  if (!wordCountEl || !charCountEl || !readingTimeEl) return;
  charCountEl.innerText = charCount.toString();
  if (wordCount === 1) {
    wordCountEl.innerText = "1 word";
  } else {
    wordCountEl.innerText = `${wordCount} words`;
  }
  readingTimeEl.innerText = estimateReadingTime(wordCount);
  calculateToDos(note.content);
  updateNoteTags(note.tags);
  await updateNoteLinks(note.links);
  updateNoteData(note.created_at, note.title);
}

function estimateReadingTime(wordCount: number, wpm = 238): string {
  const s = Math.round((wordCount / wpm) * 60);
  const m = Math.floor(s / 60);
  return s < 30 ? "< 1 min read" : s < 60 ? "1 min read" : `${m} min read`;
}

export { updateNoteData, updateNoteLinks, updateNoteTags, updateStats };
