import type { Note } from "../../shared/types";

async function searchNotes(searchInput: string): Promise<Note[] | undefined> {
  try {
    const result = await window.noteAPI.searchNotes(searchInput);
    if (!result.success) {
      console.warn("Failed to create note: ", result.message);
      return undefined;
    }
    return result.data;
  } catch (error) {
    console.error(`Error searching notes: `, error);
    return undefined;
  }
}

export { searchNotes };
