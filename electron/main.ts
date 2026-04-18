import { app, BrowserWindow, Menu, nativeTheme } from "electron";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { THEME_DATA } from "../src/constants/themes";
import type { Theme } from "../src/shared/types";
import { registerIpcHandlers } from "./ipcHandlers";
import {
  registerProtocolPrivileges,
  setupLocalImageProtocol,
} from "./protocol";
import { store } from "./store";
import { getTitleBarOverlay, resolveThemeForOverlay } from "./titlebar";
import { navigationInterceptor } from "./windowPolicies";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env["DIST"] = path.join(__dirname, "../dist");
process.env["VITE_PUBLIC"] = app.isPackaged
  ? process.env["DIST"]
  : path.join(process.env["DIST"], "../public");

registerProtocolPrivileges();

let win: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  console.log("__dirname:", __dirname);
  console.log("preload path:", preloadPath);
  const storedTheme = store.get("theme");

  if (storedTheme === "system") {
    nativeTheme.themeSource = "system";
  } else {
    const cfg = THEME_DATA[storedTheme as keyof typeof THEME_DATA];
    nativeTheme.themeSource = cfg.isDark ? "dark" : "light";
  }

  win = new BrowserWindow({
    minHeight: 600,
    minWidth: 1100,
    width: 1100,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: getTitleBarOverlay(
      resolveThemeForOverlay(storedTheme as Theme),
    ),
    transparent: false,
    backgroundMaterial: "acrylic",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  navigationInterceptor(win);
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
    const db = await import("./database");
    console.log("Database loaded successfully:", db);
  } catch (error) {
    console.error("Failed to load database:", error);
  }
  setupLocalImageProtocol();
  registerIpcHandlers();
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
