import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import db from "../src/database";
import { registerFileSystemHandlers } from "./fileSystem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env["DIST"] = path.join(__dirname, "../dist");
process.env["VITE_PUBLIC"] = app.isPackaged
  ? process.env["DIST"]
  : path.join(process.env["DIST"], "../public");

type TitleBarOverlayOptions = {
  color: string;
  symbolColor: string;
  height: number;
};

type Theme = "light" | "dark" | "system";

let win: BrowserWindow | null = null;
nativeTheme.themeSource = "system";

function getTitleBarOverlay(isDark: boolean): TitleBarOverlayOptions {
  return isDark
    ? { color: "#18181b", symbolColor: "#d4d4d8", height: 30 }
    : {
        color: "#f3f3f3",
        symbolColor: "#202020",
        height: 30,
      };
}

function createWindow() {
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  console.log("__dirname:", __dirname);
  console.log("preload path:", preloadPath);
  console.log("nativeTheme:", nativeTheme.shouldUseDarkColors);

  win = new BrowserWindow({
    minHeight: 600,
    minWidth: 725,
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: getTitleBarOverlay(nativeTheme.shouldUseDarkColors),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.openDevTools();
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  try {
    const db = await import("../src/database");
    console.log("Database loaded successfully:", db);
  } catch (error) {
    console.error("Failed to load database:", error);
  }
  nativeTheme.on("updated", () => {
    if (win) {
      win.setTitleBarOverlay(
        getTitleBarOverlay(nativeTheme.shouldUseDarkColors),
      );
    }
  });
  ipcMain.handle("get-system-info", () => {
    return `Node.js Version: ${process.versions.node}, Electron: ${process.versions.electron}`;
  });

  ipcMain.handle("get-theme", () => {
    return nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });

  ipcMain.handle(
    "set-theme",
    async (_event, theme: Theme): Promise<boolean> => {
      nativeTheme.themeSource = theme;
      if (win) {
        const isDark =
          theme === "system"
            ? nativeTheme.shouldUseDarkColors
            : theme === "dark";

        win.setTitleBarOverlay(getTitleBarOverlay(isDark));
        return true;
      }
      return false;
    },
  );

  ipcMain.handle("notes:getAll", () => {
    const notes = db.getAll();
    return notes;
  });

  ipcMain.handle("notes:create", (_event, title: string, content: string) => {
    const id = db.create(title, content);
    return id;
  });

  ipcMain.handle(
    "notes:update",
    (_event, id: string, title: string, content: string) => {
      const success = db.update(id, title, content);
      return success;
    },
  );

  ipcMain.handle("notes:delete", (_event, id: string) => {
    const success = db.delete(id);
    return success;
  });

  ipcMain.handle("notes:getById", (_event, id: string) => {
    const note = db.getById(id);
    return note;
  });

  registerFileSystemHandlers(win!);
  createWindow();
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
