import { FUSE_OPTIONS } from "@shared/constants";
import type { Note } from "@shared/schemas/note-schema";
import type { FuseResult, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";

export interface SearchMatchResult {
  item: Note;
  matches?: readonly FuseResultMatch[];
}

class NoteSearch {
  private fuse: Fuse<Note>;
  private lastQuery: string = "";
  private lastResults: FuseResult<Note>[] = [];
  constructor(initialNotes: Note[] = []) {
    this.fuse = new Fuse(initialNotes, FUSE_OPTIONS);
  }
  public updateNotes(newNotes: Note[]) {
    this.fuse.setCollection(newNotes);
    this.lastQuery = "";
    this.lastResults = [];
  }
  public search(query: string): SearchMatchResult[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      this.lastQuery = "";
      this.lastResults = [];
      return [];
    }
    if (trimmedQuery === this.lastQuery) {
      return this.lastResults;
    }
    this.lastQuery = trimmedQuery;
    this.lastResults = this.fuse.search(trimmedQuery, { limit: 50 });
    return this.lastResults;
  }
}

export { NoteSearch };
