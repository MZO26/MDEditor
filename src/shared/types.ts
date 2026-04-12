import type { Editor } from "@tiptap/core";

interface Note {
  id: string;
  title: string;
  content: string;
  snippet: string;
  plainText: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface IpcResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AutoSaveConfig {
  editor: Editor;
  signal: AbortSignal;
  noteID?: string;
}

type CreateNotePayload = Omit<Note, "id" | "created_at" | "updated_at">;
type UpdateNotePayload = Omit<Note, "created_at" | "updated_at">;
type FTSRows = Omit<Note, "tags"> & { tags: string };
type SavedPosition = number | { from: number; to: number };
type NoteItemElements = {
  containers: {
    tagContainer: HTMLDivElement | null;
    snippetContainer: HTMLDivElement | null;
    dateContainer: HTMLDivElement | null;
    titleContainer: HTMLDivElement | null;
  };
  tags: string[];
};

type Theme =
  | "light"
  | "dark"
  | "dark-glass"
  | "light-glass"
  | "paper"
  | "nord"
  | "sepia"
  | "lavender"
  | "system";

type Font =
  | "system"
  | "arial"
  | "verdana"
  | "trebuchet"
  | "georgia"
  | "courier"
  | "times"
  | "palpatino"
  | "garamond"
  | "tahoma"
  | "century"
  | "consolas";

export type {
  AutoSaveConfig,
  CreateNotePayload,
  Font,
  FTSRows,
  IpcResponse,
  Note,
  NoteItemElements,
  SavedPosition,
  Theme,
  UpdateNotePayload,
};
