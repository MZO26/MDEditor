import { app, BrowserWindow, ipcMain } from "electron";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StoreSchema, type AppTheme } from "../src/shared/schemas/storeSchema";
import {
  validateCreate,
  validateId,
  validateImage,
  validateSearch,
  validateStore,
  validateTheme,
  validateUpdate,
} from "../src/shared/validation";
import db from "./database";
import { handleIpc } from "./ipcValidation";
import { store, taskQueue } from "./store";
import { getTitleBarOverlay, initTheme } from "./titlebar";

const storeQueue = taskQueue();

function registerIpcHandlers() {
  ipcMain.handle("note:getAll", (event) => {
    return handleIpc(event, async () => {
      const result = db.getAll();
      return result;
    });
  });

  ipcMain.handle("note:create", (event, payload: unknown) => {
    return handleIpc(event, async () => {
      const validatedData = validateCreate(payload);
      const result = db.create(validatedData);
      return result;
    });
  });

  ipcMain.handle("note:update", (event, payload: unknown) => {
    return handleIpc(event, async () => {
      const validatedData = validateUpdate(payload);
      const result = db.update(validatedData);
      return result;
    });
  });

  ipcMain.handle("note:delete", (event, id: unknown) => {
    return handleIpc(event, async () => {
      const validatedData = validateId(id);
      const result = db.delete(validatedData);
      return result;
    });
  });

  ipcMain.handle("note:getById", (event, id: unknown) => {
    return handleIpc(event, async () => {
      const validatedData = validateId(id);
      const result = db.getById(validatedData);
      return result;
    });
  });

  ipcMain.handle(
    "note:search",
    (event, searchTerm: unknown, limit: unknown) => {
      return handleIpc(event, async () => {
        const validatedData = validateSearch(searchTerm, limit);
        const { searchTerm: validSearchTerm, limit: validSearchLimit } =
          validatedData;
        const result = db.search.searchNotes(validSearchTerm, validSearchLimit);
        return result;
      });
    },
  );

  ipcMain.handle("set:theme", (event, theme: AppTheme) => {
    return handleIpc(event, async () => {
      const validatedData = validateTheme(theme);
      const activeTheme = initTheme(validatedData);
      const overlayOptions = getTitleBarOverlay(activeTheme);
      BrowserWindow.getAllWindows().forEach((win) => {
        if (typeof win.setTitleBarOverlay === "function") {
          win.setTitleBarOverlay(overlayOptions);
        }
      });
      return theme;
    });
  });

  ipcMain.handle("saveImage", (event, payload: unknown) => {
    return handleIpc(event, async () => {
      const validatedData = validateImage(payload);
      const userDataPath = app.getPath("userData");
      const imagesFolder = path.join(userDataPath, "editor-images");
      // Create the folder if it doesn't exist yet
      if (!fs.existsSync(imagesFolder)) {
        fs.mkdirSync(imagesFolder, { recursive: true }); // to guarantee folder exists
      }
      const imageBuffer = Buffer.from(validatedData.imageData);
      const hash = createHash("sha256").update(imageBuffer).digest("hex");
      // converts frontend ArrayBuffer to NodeJS Buffer Format so file system can understand it. Hashes image name but finds duplicates compared to uuid which always creates new id's
      const fileName = `${hash}.${validatedData.extension}`;
      const filePath = path.join(imagesFolder, fileName);
      if (fs.existsSync(filePath)) {
        console.log("Image already existing. Skipping saving process");
        return { imageSrc: `appimg:///${fileName}` };
      }
      // 4. Save the file to the hard drive
      fs.writeFileSync(filePath, imageBuffer);
      // 5. Return the local file path to Tiptap
      return {
        imageSrc: `appimg:///${fileName}`,
      };
    });
  });

  ipcMain.handle("electron-store:get", (event, key: string) => {
    return handleIpc(event, async () => {
      const keyValidation = StoreSchema.keyof().safeParse(key);
      if (!keyValidation.success) {
        console.error(`Invalid store key requested: ${key}`);
        return null;
      }
      const safeKey = keyValidation.data;
      const value = store.get(safeKey);
      const keySchema = StoreSchema.shape[safeKey];
      const result = keySchema.safeParse(value);
      return result.data;
    });
  });

  ipcMain.handle(
    "electron-store:set",
    async (event, key: string, val: unknown) => {
      return handleIpc(event, async () => {
        return await storeQueue(async () => {
          const validValue = validateStore(key, val);
          store.set(key, validValue);
        });
      });
    },
  );
}

export { registerIpcHandlers };
