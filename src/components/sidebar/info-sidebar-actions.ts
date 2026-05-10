import { calculateToDos } from "@/extensions/todo-bar";
import { findElement } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import type { Note } from "@shared/schemas/note-schema";

function updateNoteTags(tags: Note["tags"]) {
  const container = findElement(".tag-container");
  if (!container) return;
  container.innerHTML = "";
  if (!tags || tags.length === 0) return;
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.classList.add("tag", "searchTag");
    span.setAttribute("data-tippy-content", `filter notes with: ${tag}`);
    span.dataset["tag"] = String(tag);
    span.textContent = `#${tag}`;
    container.append(span);
  });
}

function updateStats() {
  const editor = getAppItem("editor");
  const content = editor.getJSON();
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
  calculateToDos(content);
}

function estimateReadingTime(wordCount: number, wpm = 238): string {
  const s = Math.round((wordCount / wpm) * 60);
  const m = Math.floor(s / 60);
  return s < 30 ? "< 1 min read" : s < 60 ? "1 min read" : `${m} min read`;
}

export { updateNoteTags, updateStats };
