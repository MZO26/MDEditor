import { setUpNoteMenu, setUpTableMenu } from "@electron/context-menu";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { checkRateLimit, safeResponse } from "@electron/ipc/ipc-validation";
import { getTitleBarOverlay, initTheme } from "@electron/titlebar";
import { AppErrorCode, LIMITS } from "@shared/constants";
import { validation } from "@shared/ipc-helpers";
import { ImagePayloadSchema } from "@shared/schemas/image-schema";
import { StoreSchema, type Theme } from "@shared/schemas/store-schema";
import type { MenuType, NoteMenuPayload } from "@shared/types";
import { createHash } from "crypto";
import { app, BrowserWindow, ipcMain, Menu, Notification } from "electron";
import fs from "node:fs";
import path from "path";

function registerElectronIpc(win: BrowserWindow) {
  ipcMain.on(
    "show-context-menu",
    (e, menuType: MenuType, payload: NoteMenuPayload) => {
      return safeResponse(e, async () => {
        if (!checkRateLimit("show-context-menu", LIMITS.READ_LIGHT))
          throw new AppBackendError(AppErrorCode.RateLimitError);
        if (!win) return;
        let menu: Menu;
        if (menuType === "table") {
          menu = setUpTableMenu(win);
        } else if (menuType === "note") {
          menu = setUpNoteMenu(win, payload);
        } else {
          return;
        }
        menu.popup({ window: win });
      });
    },
  );
  ipcMain.handle("set:theme", (e, theme: Theme, focus?: boolean) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("set:theme", LIMITS.WRITE_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      const validatedTheme = validation(StoreSchema.shape.theme, theme);
      const resolvedTheme = initTheme(validatedTheme);
      const windowTheme = getTitleBarOverlay(resolvedTheme, focus ?? false);
      for (const window of BrowserWindow.getAllWindows()) {
        window.setBackgroundColor(windowTheme.backgroundColor);
        window.setTitleBarOverlay?.(windowTheme.overlayOptions);
      }
      return resolvedTheme;
    });
  });

  ipcMain.handle("show-notification", (e, title: string, body: string) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("show-notification", LIMITS.WRITE_LIGHT))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      if (Notification.isSupported()) {
        const notif = new Notification({
          title,
          body,
        });
        notif.show();
      }
    });
  });

  ipcMain.handle("save:image", (e, payload: unknown) => {
    return safeResponse(e, async () => {
      if (!checkRateLimit("save:image", LIMITS.WRITE_HEAVY))
        throw new AppBackendError(AppErrorCode.RateLimitError);
      const validatedData = validation(ImagePayloadSchema, payload);
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
        return { imageSrc: `appimg:///${fileName}` };
      }
      try {
        fs.writeFileSync(filePath, imageBuffer, { flag: "wx" });
      } catch (error) {
        if (
          error instanceof Error &&
          (error as NodeJS.ErrnoException).code === "EEXIST"
        ) {
          return {
            imageSrc: `appimg:///${fileName}`,
          };
        } else {
          throw new AppBackendError(AppErrorCode.FILE_WRITE_ERROR);
        }
      }
      return { imageSrc: `appimg:///${fileName}` };
    });
  });
}

export { registerElectronIpc };
