import { findElement } from "@/utils/dom";
import type { Note } from "@shared/schemas/note-schema";

function createNoteUpdater() {
  let element: HTMLDivElement | null = null;
  return function updateNoteCount(notes: Note[]) {
    element ??= findElement<HTMLDivElement>(".note-count");
    if (!element) return;
    const count = notes.length;
    element.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
  };
}

const updateNoteCount = createNoteUpdater();

function getNotePriority(note: Note) {
  if (note.pinned && note.bookmarked) return 0; // top priority if it happens
  if (note.pinned) return 1; // highest priority
  if (note.bookmarked) return 2; // middle
  return 3; // normal
}

// this function returns a number by which note items are being displayed in the sidebar. If it returns a negative number, a comes first, then b
function compareNotes(a: Note, b: Note) {
  const priorityDiff = getNotePriority(a) - getNotePriority(b); // example: pinned note a (1) - regular note b(3) = -2, which means a comes before b
  if (priorityDiff !== 0) return priorityDiff;
  // if priorities are equal, they get sorted by updated_at
  return String(b.updated_at).localeCompare(String(a.updated_at));
}

function estimateReadingTime(wordCount: number, wpm = 238) {
  const s = Math.round((wordCount / wpm) * 60);
  const m = Math.floor(s / 60);
  return s < 30 ? "< 1 min read" : s < 60 ? "1 min read" : `${m} min read`;
}

export { compareNotes, estimateReadingTime, updateNoteCount };
