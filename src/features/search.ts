import type { Note } from "@shared/schemas/note-schema";
import Fuse, { type IFuseOptions } from "fuse.js";

const FUSE_OPTIONS: IFuseOptions<Note> = {
  useExtendedSearch: true,
  ignoreLocation: true,
  keys: [
    { name: "title", weight: 2.0 },
    { name: "plainText", weight: 1.0 },
    { name: "tags", weight: 1.5 },
  ],
  threshold: 0.3,
};

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
