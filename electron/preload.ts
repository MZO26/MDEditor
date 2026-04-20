import { contextBridge, ipcRenderer } from "electron";
import type {
  CreateNotePayload,
  ImagePayload,
  Theme,
  UpdateNotePayload,
} from "../src/shared/types";
console.log("--- PRELOAD ACTIVE ---");

contextBridge.exposeInMainWorld("electronAPI", {
  setTheme: (theme: Theme) => ipcRenderer.invoke("set:theme", theme),
  saveImage: (payload: ImagePayload) =>
    ipcRenderer.invoke("saveImage", payload),
});
contextBridge.exposeInMainWorld("noteAPI", {
  getAll: () => ipcRenderer.invoke("note:getAll"),
  create: (payload: CreateNotePayload) =>
    ipcRenderer.invoke("note:create", payload),
  update: (payload: UpdateNotePayload) =>
    ipcRenderer.invoke("note:update", payload),
  delete: (id: string) => ipcRenderer.invoke("note:delete", id),
  getById: (id: string) => ipcRenderer.invoke("note:getById", id),
  searchNotes: (searchTerm: string) =>
    ipcRenderer.invoke("note:search", searchTerm),
});
contextBridge.exposeInMainWorld("storeApi", {
  getSettings: (key: string) => ipcRenderer.invoke("electron-store:get", key),
  setSettings: (key: string, value: any) =>
    ipcRenderer.invoke("electron-store:set", key, value),
});
