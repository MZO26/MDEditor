import { FUSE_OPTIONS } from "@shared/constants";
import type { NoteListItem, NoteSearchDoc } from "@shared/schemas/note-schema";
import type { FuseResult, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";

export interface SearchMatchResult {
  item: NoteListItem;
  matches?: readonly FuseResultMatch[];
}

class NoteSearch {
  private fuse: Fuse<NoteSearchDoc>;
  private lastQuery: string = "";
  private lastResults: FuseResult<NoteSearchDoc>[] = [];

  constructor(initialNotes: NoteListItem[] = []) {
    this.fuse = new Fuse<NoteSearchDoc>(
      initialNotes.map((note) => ({
        id: note.id,
        snippet: note.snippet,
        title: note.title,
        plainText: note.plainText,
        tags: note.tags,
      })),
      FUSE_OPTIONS,
    );
  }

  public bulkLoad(notes: NoteListItem[]) {
    this.fuse.setCollection(
      notes.map((note) => ({
        id: note.id,
        snippet: note.snippet,
        title: note.title,
        plainText: note.plainText,
        tags: note.tags,
      })),
    );
    this.lastQuery = "";
    this.lastResults = [];
  }

  public addMany(notes: NoteListItem[]) {
    for (const note of notes) {
      this.fuse.add(note);
    }
    this.lastQuery = "";
    this.lastResults = [];
  }

  public upsertNote(note: NoteListItem) {
    this.fuse.remove((doc) => doc.id === note.id);
    this.fuse.add({
      id: note.id,
      snippet: note.snippet,
      title: note.title,
      plainText: note.plainText,
      tags: note.tags,
    });
    this.lastQuery = "";
    this.lastResults = [];
  }

  public removeNote(id: string) {
    this.fuse.remove((doc) => doc.id === id);
    this.lastQuery = "";
    this.lastResults = [];
  }

  public search(query: string): FuseResult<NoteSearchDoc>[] {
    const trimmed = query.trim();
    if (!trimmed) {
      this.lastQuery = "";
      this.lastResults = [];
      return [];
    }
    if (trimmed === this.lastQuery) return this.lastResults;
    this.lastQuery = trimmed;
    this.lastResults = this.fuse.search(trimmed, { limit: 50 });
    return this.lastResults;
  }
}

export { NoteSearch };
