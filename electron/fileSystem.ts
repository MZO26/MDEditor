import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";

function registerFileSystemHandlers(win: BrowserWindow) {
  ipcMain.handle("file-open", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Markdown", extensions: ["md", "txt"] }],
    });

    if (!canceled && filePaths.length > 0) {
      const inhalt = fs.readFileSync(filePaths[0]!, "utf-8");
      return { inhalt, pfad: filePaths[0]! };
    }
    return null;
  });

  ipcMain.handle("file-save", async (_event, { pfad, inhalt }) => {
    if (pfad) {
      fs.writeFileSync(pfad, inhalt, "utf-8");
      return true;
    } else {
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (!canceled && filePath) {
        fs.writeFileSync(filePath, inhalt, "utf-8");
        return filePath;
      }
    }
    return false;
  });
}

export { registerFileSystemHandlers };
