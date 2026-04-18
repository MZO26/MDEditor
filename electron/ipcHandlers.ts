import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import fs from "node:fs";
import path from "node:path";
import { THEME_DATA } from "../src/constants/themes";
import type { Theme, ThemeConfig } from "../src/shared/types";
import {
  validateCreate,
  validateId,
  validateSearch,
  validateUpdate,
} from "../src/shared/validation";
import db from "./database";
import { store } from "./store";
import { getTitleBarOverlay } from "./titlebar";

function registerIpcHandlers() {
  ipcMain.handle("get:system-info", () => {
    return `Node.js Version: ${process.versions.node}, Electron: ${process.versions.electron}`;
  });

  ipcMain.handle("note:getAll", () => {
    try {
      const data = db.getAll();
      return { success: true, data };
    } catch (error) {
      console.error("[IPC] Failed to get all notes: ", error);
      return { success: false, message: "[IPC] Failed to get all notes" };
    }
  });

  ipcMain.handle("note:create", (_event, payload: unknown) => {
    const result = validateCreate(payload);
    if (!result.success) {
      return result;
    }
    try {
      const data = db.create(result.data);
      return { success: true, data };
    } catch (error) {
      console.error("[IPC] Failed to create note: ", error);
      return { success: false, message: "[IPC] Failed to create note" };
    }
  });

  ipcMain.handle("note:update", (_event, payload: unknown) => {
    const result = validateUpdate(payload);
    if (!result.success) {
      return result;
    }
    try {
      const data = db.update(result.data);
      return { success: true, data };
    } catch (error) {
      console.error("[IPC] Failed to update note: ", error);
      return { success: false, message: "[IPC] Failed to update note" };
    }
  });

  ipcMain.handle("note:delete", (_event, id: unknown) => {
    const result = validateId(id);
    if (!result.success) {
      return result;
    }
    try {
      const success = db.delete(result.data);
      if (!success) {
        return { success: false, message: "[IPC] Note not found" };
      }
      return { success: success };
    } catch (error) {
      console.error("[IPC] Failed to delete note: ", error);
      return { success: false, message: "[IPC] Failed to delete note" };
    }
  });

  ipcMain.handle("note:getById", (_event, id: unknown) => {
    const result = validateId(id);
    if (!result.success) {
      return result;
    }
    try {
      const data = db.getById(result.data);
      if (!data) {
        return { success: false, message: "[IPC] Note not found" };
      }
      return { success: true, data };
    } catch (error) {
      console.error("[IPC] Failed to get note by ID: ", error);
      return { success: false, message: "[IPC] Failed to get note by ID" };
    }
  });

  ipcMain.handle(
    "note:search",
    async (_event, searchTerm: unknown, limit: unknown) => {
      const result = validateSearch(searchTerm, limit);

      if (!result.success) {
        return result;
      }
      const { searchTerm: validSearchTerm, limit: validLimit } = result.data;
      try {
        const data = db.search.searchNotes(validSearchTerm, validLimit);
        return { success: true, data };
      } catch (error) {
        console.error("[IPC] Failed to search note: ", error);
        return { success: false, message: "[IPC] Failed to search note" };
      }
    },
  );

  ipcMain.handle("set:theme", (_event, theme: Theme) => {
    if (theme !== "system" && !(theme in THEME_DATA)) {
      return { success: false, message: "Invalid theme" };
    }
    if (theme === "system") {
      nativeTheme.themeSource = "system";
      const activeTheme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
      BrowserWindow.getAllWindows().forEach((win) => {
        win.setTitleBarOverlay(getTitleBarOverlay(activeTheme));
      });
      return { success: true };
    }
    if (theme in THEME_DATA) {
      const validTheme = theme as keyof typeof THEME_DATA;
      const selectedTheme = THEME_DATA[validTheme] as ThemeConfig;
      nativeTheme.themeSource = selectedTheme.isDark ? "dark" : "light";
      const overlayOptions = getTitleBarOverlay(validTheme);
      BrowserWindow.getAllWindows().forEach((win) => {
        win.setTitleBarOverlay(overlayOptions);
      });
      return { success: true };
    }
    return { success: false, message: "[IPC] Invalid theme" };
  });

  ipcMain.handle("saveImage", async (_event, imageData, extension) => {
    try {
      const userDataPath = app.getPath("userData");
      const imagesFolder = path.join(userDataPath, "editor-images");
      // Create the folder if it doesn't exist yet
      if (!fs.existsSync(imagesFolder)) {
        fs.mkdirSync(imagesFolder, { recursive: true }); // to guarantee folder exists
      }
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = path.join(imagesFolder, fileName);
      const buffer = Buffer.from(imageData); // converts frontend ArrayBuffer to NodeJS Buffer Format so file system can understand it
      // 4. Save the file to the hard drive
      fs.writeFileSync(filePath, buffer);
      // 5. Return the local file path to Tiptap
      return { success: true, imageSrc: `appimg:///${fileName}` };
    } catch (error) {
      console.error("Failed to save image:", error);
      return { success: false, error };
    }
  });

  ipcMain.handle("electron-store:get", async (_event, key: string) => {
    try {
      const value = store.get(key);
      return { success: true, data: value };
    } catch (error) {
      console.error(`[IPC] Error while getting key ${key}: `, error);
      return {
        success: false,
        message: `[IPC] Error while getting key: ${key}`,
      };
    }
  });

  ipcMain.handle(
    "electron-store:set",
    async (_event, key: string, val: any) => {
      try {
        store.set(key, val);
        return { success: true };
      } catch (error) {
        console.error(`[IPC] Error while saving key ${key}: `, error);
        return {
          success: false,
          message: `[IPC] Error while saving key ${key}`,
        };
      }
    },
  );
}

export { registerIpcHandlers };
