import type { NoteListItem, NoteSearchDoc } from "@shared/schemas/note-schema";
import MiniSearch, { type Options } from "minisearch";

const MINI_SEARCH_OPTIONS: Options<NoteSearchDoc> = {
  fields: ["title", "plainText", "snippet", "tags"],
  storeFields: ["id"],
  autoVacuum: true,
  extractField: (document, fieldName) => {
    const value = document[fieldName as keyof NoteSearchDoc];
    return Array.isArray(value) ? value.join(" ") : (value as string);
  },
  searchOptions: {
    boost: { title: 4, tags: 2, snippet: 1.5, plainText: 1 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
};

export interface SearchMatchResult {
  item: NoteListItem;
  score: number;
  queryTerms: readonly string[];
}

export class NoteSearch {
  private miniSearch: MiniSearch<NoteSearchDoc>;
  private notesById = new Map<string, NoteListItem>();
  private docsById = new Map<string, NoteSearchDoc>();

  constructor(initialNotes: NoteListItem[] = []) {
    this.miniSearch = this.createIndex();
    this.bulkLoad(initialNotes);
  }

  private createIndex() {
    return new MiniSearch<NoteSearchDoc>(MINI_SEARCH_OPTIONS);
  }

  private toDoc(note: NoteListItem): NoteSearchDoc {
    return {
      id: note.id,
      title: note.title,
      snippet: note.snippet,
      plainText: note.plainText,
      tags: note.tags,
    };
  }

  public bulkLoad(notes: NoteListItem[]) {
    const nextMiniSearch = this.createIndex();
    const nextNotesById = new Map<string, NoteListItem>();
    const nextDocsById = new Map<string, NoteSearchDoc>();
    const docs: NoteSearchDoc[] = [];
    for (const note of notes) {
      const doc = this.toDoc(note);
      nextNotesById.set(note.id, note);
      nextDocsById.set(note.id, doc);
      docs.push(doc);
    }
    nextMiniSearch.addAll(docs);
    this.miniSearch = nextMiniSearch;
    this.notesById = nextNotesById;
    this.docsById = nextDocsById;
  }

  public addMany(notes: NoteListItem[]) {
    for (const note of notes) {
      this.upsertNote(note);
    }
  }

  public upsertNote(note: NoteListItem) {
    const doc = this.toDoc(note);
    const existingDoc = this.docsById.get(note.id);
    if (existingDoc) {
      this.miniSearch.replace(doc);
    } else {
      this.miniSearch.add(doc);
    }
    this.notesById.set(note.id, note);
    this.docsById.set(note.id, doc);
  }

  public removeNote(id: string) {
    if (!this.docsById.has(id)) return;
    this.miniSearch.discard(id);
    this.docsById.delete(id);
    this.notesById.delete(id);
  }

  public removeMany(ids: string[]) {
    for (const id of ids) {
      if (!this.docsById.has(id)) continue;
      this.miniSearch.discard(id);
      this.docsById.delete(id);
      this.notesById.delete(id);
    }
  }

  public search(query: string): SearchMatchResult[] {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const results = this.miniSearch.search(trimmed).slice(0, 50);
    const mapped: SearchMatchResult[] = [];
    for (const result of results) {
      const item = this.notesById.get(String(result.id));
      if (!item) continue;
      mapped.push({
        item,
        score: result.score,
        queryTerms: (result.queryTerms ?? result.terms ?? []) as string[],
      });
    }

    return mapped;
  }

  public searchTags(query: string): SearchMatchResult[] {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const results = this.miniSearch
      .search(trimmed, {
        fields: ["tags"],
      })
      .slice(0, 50);
    const mapped: SearchMatchResult[] = [];
    for (const result of results) {
      const item = this.notesById.get(String(result.id));
      if (!item) continue;
      mapped.push({
        item,
        score: result.score,
        queryTerms: (result.queryTerms ?? result.terms ?? []) as string[],
      });
    }

    return mapped;
  }
}
