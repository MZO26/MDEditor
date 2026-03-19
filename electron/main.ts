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
import { registerFileSystemHandlers } from "./fileSystem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env["DIST"] = path.join(__dirname, "../dist");
process.env["VITE_PUBLIC"] = app.isPackaged
  ? process.env["DIST"]
  : path.join(process.env["DIST"], "../public");

let win: BrowserWindow | null;

function getTitleBarOverlay() {
  return nativeTheme.shouldUseDarkColors
    ? { color: "#18181b", symbolColor: "#d4d4d8", height: 20 }
    : {
        color: "rgba(243, 243, 243, 1)",
        symbolColor: "rgba(0, 0, 0, 0.8)",
        height: 20,
      };
}

function createWindow() {
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  console.log("__dirname:", __dirname);
  console.log("preload path:", preloadPath);

  win = new BrowserWindow({
    minHeight: 500,
    minWidth: 700,
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: getTitleBarOverlay(),
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

  nativeTheme.on("updated", () => {
    win!.setTitleBarOverlay(getTitleBarOverlay());
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  ipcMain.handle("get-system-info", () => {
    return `Node.js Version: ${process.versions.node}, Electron: ${process.versions.electron}`;
  });
  ipcMain.on("set-theme", (_event, theme: "light" | "dark") => {
    win!.setTitleBarOverlay(
      theme === "dark"
        ? { color: "#18181b", symbolColor: "#d4d4d8", height: 20 }
        : {
            color: "rgba(243, 243, 243, 1)",
            symbolColor: "rgba(0, 0, 0, 0.8)",
            height: 20,
          },
    );
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
