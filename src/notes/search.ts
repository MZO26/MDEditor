import { FUSE_OPTIONS } from "@shared/constants";
import type { Note } from "@shared/schemas/note-schema";
import Fuse from "fuse.js";

class NoteSearch {
  private fuse: Fuse<Note>;
  private allNotes: Note[] = [];
  private lastQuery: string = "";
  private lastResults: Note[] = [];
  constructor(initialNotes: Note[] = []) {
    this.allNotes = initialNotes;
    this.fuse = new Fuse(initialNotes, FUSE_OPTIONS);
  }
  public updateNotes(newNotes: Note[]) {
    this.allNotes = newNotes;
    this.fuse.setCollection(newNotes);
  }
  public search(query: string): Note[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return this.allNotes;
    }
    // avoid new search if it is same query and return cached results from cached query
    if (trimmedQuery === this.lastQuery) {
      return this.lastResults;
    }
    const results = this.fuse
      .search(trimmedQuery, { limit: 20 })
      .map((result) => result.item);
    this.lastQuery = query;
    this.lastResults = results;
    return results;
  }
}

export { NoteSearch };
