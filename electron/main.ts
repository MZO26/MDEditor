import { setUpEditorMenu, setUpNoteMenu } from "@electron/context-menu";
import { registerIpcHandlers } from "@electron/ipc/ipc-handlers";
import { wrapResult } from "@electron/ipc/ipc-validation";
import {
  navigationHandler,
  registerCustomProtocol,
  setupLocalImageProtocol,
} from "@electron/navigation-handler";
import { setPermissions } from "@electron/permissions";
import { store } from "@electron/store";
import {
  getTitleBarOverlay,
  initTheme,
  onOSThemeChange,
} from "@electron/titlebar";
import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from "electron";
import console from "node:console";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { setupGlobalErrorHandling } from "./error-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env["DIST"] = path.join(__dirname, "../dist");
process.env["VITE_PUBLIC"] = app.isPackaged
  ? process.env["DIST"]
  : path.join(process.env["DIST"], "../public");

let win: BrowserWindow | null = null;

registerCustomProtocol();
setupGlobalErrorHandling({
  ignore: ["DownloadItem", "net::ERR_ABORTED", "net::ERR_CONNECTION_REFUSED"],
});

function createWindow() {
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  const activeTheme = initTheme(store.get("theme"));
  const windowTheme = getTitleBarOverlay(activeTheme);

  win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 600,
    minWidth: 1000,
    minHeight: 500,
    titleBarStyle: "hidden",
    titleBarOverlay: windowTheme.overlayOptions,
    autoHideMenuBar: true,
    transparent: false,
    backgroundColor: windowTheme.backgroundColor,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      navigateOnDragDrop: false,
      allowRunningInsecureContent: false,
      safeDialogs: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      spellcheck: false,
    },
  });
  navigationHandler(win);
  win.webContents.openDevTools();
  win.setMenuBarVisibility(false);
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
  win.once("ready-to-show", () => {
    win?.show();
  });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  createWindow();
  setupLocalImageProtocol();
  setPermissions();
  registerIpcHandlers();
  setUpEditorMenu();
  ipcMain.on(
    "show-note-menu",
    (event, id: string, pinned: boolean, bookmarked: boolean) => {
      return wrapResult(event, async () => {
        console.log("show menu for", id);
        if (win) {
          const contextMenu = setUpNoteMenu(win, id, pinned, bookmarked);
          contextMenu.popup({ window: win });
        }
      });
    },
  );
  let isReadyToClose = false;
  win?.on("close", (e) => {
    if (isReadyToClose) return;
    e.preventDefault();
    win?.webContents.send("request-flush");
  });
  ipcMain.on("flush-confirmed", () => {
    isReadyToClose = true;
    win?.close();
  });
  nativeTheme.on("updated", () => {
    if (win) onOSThemeChange(win, store.get("theme"));
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
