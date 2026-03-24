import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import * as fs from "fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import db from "./database";
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

let win: BrowserWindow | null = null;
nativeTheme.themeSource = "system";

function getTitleBarOverlay(): TitleBarOverlayOptions {
  let isDark = nativeTheme.shouldUseDarkColors;
  //boolean to check if the system theme is dark or light, used to set the title bar overlay colors accordingly
  return isDark === true
    ? { color: "#00000000", symbolColor: "#a1a1aa", height: 30 }
    : {
        color: "#00000000",
        symbolColor: "#71717a",
        height: 30,
      };
}
// 1. Define the exact path where the settings will be saved
let configPath = "";

// Helper function to read the theme from the hard drive
function getSavedTheme(): string {
  try {
    // Check if the file exists before trying to read it
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      const parsedData = JSON.parse(data);
      return parsedData.theme || "dark";
    }
  } catch (error) {
    console.error("Could not read theme file, defaulting to dark:", error);
  }
  return "dark"; // The default fallback if no file exists
}

// Helper function to write the theme to the hard drive
function saveTheme(theme: string) {
  try {
    const dataToSave = JSON.stringify({ theme: theme });
    fs.writeFileSync(configPath, dataToSave, "utf-8");
  } catch (error) {
    console.error("Failed to save the theme:", error);
  }
}

function setupThemeHandlers() {
  ipcMain.handle("get-theme", () => {
    return getSavedTheme();
  });

  ipcMain.handle("set-theme", (_, theme: string) => {
    const validThemes = [
      "light",
      "dark",
      "dark-glass",
      "light-glass",
      "paper",
      "nord",
      "sepia",
      "lavender",
      "system",
    ];
    if (validThemes.includes(theme)) {
      saveTheme(theme);
    }
    if (theme === "system") {
      nativeTheme.themeSource = "system";
    } else if (
      theme.includes("light") ||
      theme === "paper" ||
      theme === "sepia" ||
      theme === "nord" ||
      theme === "lavender"
    ) {
      nativeTheme.themeSource = "light";
    } else if (theme.includes("dark")) {
      nativeTheme.themeSource = "dark";
    }
  });
}
function createWindow() {
  const preloadPath = path.join(__dirname, "../preload/preload.js");
  console.log("__dirname:", __dirname);
  console.log("preload path:", preloadPath);

  win = new BrowserWindow({
    minHeight: 600,
    minWidth: 725,
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: getTitleBarOverlay(),
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
  configPath = path.join(app.getPath("userData"), "theme-settings.json");
  setupThemeHandlers();
  nativeTheme.themeSource = getSavedTheme() === "light" ? "light" : "dark";
  try {
    const db = await import("./database");
    console.log("Database loaded successfully:", db);
  } catch (error) {
    console.error("Failed to load database:", error);
  }
  ipcMain.handle("get-system-info", () => {
    return `Node.js Version: ${process.versions.node}, Electron: ${process.versions.electron}`;
  });

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
