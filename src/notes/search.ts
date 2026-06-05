import { getPlainTextFromJson } from "@/components/editor/editor-init";
import { FUSE_OPTIONS } from "@shared/constants";
import type { Note, NoteSearchDoc } from "@shared/schemas/note-schema";
import type { FuseResult, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";

export interface SearchMatchResult {
  item: Note;
  matches?: readonly FuseResultMatch[];
}

class NoteSearch {
  private fuse: Fuse<NoteSearchDoc>;
  private lastQuery: string = "";
  private lastResults: FuseResult<NoteSearchDoc>[] = [];

  constructor(initialNotes: Note[] = []) {
    this.fuse = new Fuse<NoteSearchDoc>(
      initialNotes.map((note) => ({
        id: note.id,
        snippet: note.snippet,
        title: note.title,
        plainText: getPlainTextFromJson(note.content),
        tags: note.tags,
      })),
      FUSE_OPTIONS,
    );
  }

  public bulkLoad(notes: Note[]) {
    this.fuse.setCollection(
      notes.map((note) => ({
        id: note.id,
        snippet: note.snippet,
        title: note.title,
        plainText: getPlainTextFromJson(note.content),
        tags: note.tags,
      })),
    );
    this.lastQuery = "";
    this.lastResults = [];
  }

  public upsertNote(note: Note) {
    this.fuse.remove((doc) => doc.id === note.id);
    this.fuse.add({
      id: note.id,
      snippet: note.snippet,
      title: note.title,
      plainText: getPlainTextFromJson(note.content),
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
