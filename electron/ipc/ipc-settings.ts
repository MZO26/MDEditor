import { checkRateLimit, safeResponse } from "@electron/ipc/ipc-validation";
import { store } from "@electron/store";
import { nextZoom } from "@electron/win";
import { AppErrorCode, LIMITS } from "@shared/constants";
import { validation } from "@shared/ipc-helpers";
import { StoreSchema, type AppSettings } from "@shared/schemas/store-schema";
import type { ZoomAction } from "@shared/types";
import { BrowserWindow, ipcMain } from "electron";
import { AppBackendError } from "./ipc-error-handler";

function registerSettingsIpc(win: BrowserWindow) {
  ipcMain.handle("zoom", (e, action: ZoomAction) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("zoom", LIMITS.READ_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      const current = win.webContents.getZoomFactor();
      const zoom = nextZoom(current, action);
      if (action !== "get") {
        win.webContents.setZoomFactor(zoom);
      }
      return zoom;
    });
  });

  ipcMain.handle("electron-store:get", (e, key: string) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("electron-store:get", LIMITS.READ_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
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

  ipcMain.handle("electron-store:getAll", (e) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("electron-store:getAll", LIMITS.READ_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      const result = StoreSchema.safeParse(store.store);
      if (!result.success) {
        console.error("Invalid store data:", result.error);
        return null;
      }
      return result.data;
    });
  });

  ipcMain.handle("electron-store:set", async (e, settings: AppSettings) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("electron-store:set", LIMITS.WRITE_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      const validValue = validation(StoreSchema, settings);
      store.set(validValue);
    });
  });
}

export { registerSettingsIpc };
