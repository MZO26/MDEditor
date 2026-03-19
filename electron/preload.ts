import { contextBridge, ipcRenderer } from "electron";
console.log("--- PRELOAD AKTIV ---");

contextBridge.exposeInMainWorld("api", {
  windowControl: (action: string) => ipcRenderer.send("window-control", action),

  openFile: () => ipcRenderer.invoke("file-open"),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveFile: (daten: any) => ipcRenderer.invoke("file-save", daten),
});
contextBridge.exposeInMainWorld("electronAPI", {
  setTheme: (theme: "light" | "dark") => ipcRenderer.send("set-theme", theme),
});
