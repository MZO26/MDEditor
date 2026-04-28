export {};
import {
  IpcResponse,
  type CreateNotePayload,
  type ImagePayload,
  type UpdateNotePayload,
} from "../shared/types";
import type { Note } from "./schemas/noteSchema";
import type { AppSettings, Theme } from "./schemas/storeSchema";

declare module "*.css";
declare module "*?raw" {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    electronAPI: {
      setTheme: (theme: Theme, focus?: boolean) => Promise<IpcResponse<Theme>>;
      saveImage: (
        payload: ImagePayload,
      ) => Promise<IpcResponse<{ imageSrc: string }>>;
      onThemeChanged: (callback: (theme: Theme) => void) => () => void;
    };
    noteAPI: {
      getAll: () => Promise<IpcResponse<Note[]>>;
      getById: (id: string) => Promise<IpcResponse<Note>>;
      create: (payload: CreateNotePayload) => Promise<IpcResponse<Note>>;
      update: (
        payload: UpdateNotePayload,
        flush: boolean,
      ) => Promise<IpcResponse<Note>>;
      delete: (id: string) => Promise<IpcResponse<void>>;
      searchNotes: (
        searchTerm: string,
        limit: number,
      ) => Promise<IpcResponse<Note[]>>;
      getViews: (view) => Promise<IpcResponse<Note[]>>;
    };
    storeApi: {
      getSettings: <K extends keyof AppSettings>(
        key: K,
      ) => Promise<IpcResponse<AppSettings[K]>>;
      setSettings: (
        settings: Partial<AppSettings>,
      ) => Promise<IpcResponse<AppSettings>>;
    };
  }
}
