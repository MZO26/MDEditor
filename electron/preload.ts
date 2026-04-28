import { contextBridge, ipcRenderer } from "electron";
import type { ImagePayload } from "../shared/schemas/imageSchema";
import type {
  CreateNotePayload,
  UpdateNotePayload,
} from "../shared/schemas/noteSchema";
import type { AppSettings, Theme } from "../shared/schemas/storeSchema";

console.log("--- PRELOAD ACTIVE ---");

contextBridge.exposeInMainWorld("electronAPI", {
  setTheme: (theme: Theme, focus?: boolean) =>
    ipcRenderer.invoke("set:theme", theme, focus),
  onThemeChanged: (callback: (theme: Theme) => void) => {
    ipcRenderer.on("theme-changed", (_event, theme) => callback(theme));
  },
  saveImage: (payload: ImagePayload) =>
    ipcRenderer.invoke("saveImage", payload),
});
contextBridge.exposeInMainWorld("noteAPI", {
  getAll: () => ipcRenderer.invoke("note:getAll"),
  create: (payload: CreateNotePayload) =>
    ipcRenderer.invoke("note:create", payload),
  update: (payload: UpdateNotePayload, flush: boolean) =>
    ipcRenderer.invoke("note:update", payload, flush),
  delete: (id: string) => ipcRenderer.invoke("note:delete", id),
  getById: (id: string) => ipcRenderer.invoke("note:getById", id),
  searchNotes: (searchTerm: string) =>
    ipcRenderer.invoke("note:search", searchTerm),
  getViews: (view: string) => ipcRenderer.invoke("views:get", view),
});
contextBridge.exposeInMainWorld("storeApi", {
  getSettings: (key: string) => ipcRenderer.invoke("electron-store:get", key),
  setSettings: (settings: AppSettings) =>
    ipcRenderer.invoke("electron-store:set", settings),
});
