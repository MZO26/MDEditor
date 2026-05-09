import { win } from "@electron/main";
import { store } from "@electron/store";
import { StoreSchema } from "@shared/schemas/store-schema";
import type { ZoomAction } from "@shared/types";
import { BrowserWindow } from "electron";

const ZOOMS = [1, 1.1, 1.25] as const;

function nextZoom(current: number, action: ZoomAction): number {
  if (action === "get") return current;
  if (action === "reset") return 1;
  let targetIndex: number;
  const index = ZOOMS.findIndex((z) => z >= current);
  const safeIndex = index === -1 ? ZOOMS.length - 1 : index;

  if (action === "in") {
    targetIndex = Math.min(safeIndex + 1, ZOOMS.length - 1);
  } else {
    targetIndex = Math.max(safeIndex - 1, 0);
  }
  return ZOOMS[targetIndex] ?? 1;
}

function saveWindowBounds() {
  if (win && !win.isMaximized() && !win.isMinimized()) {
    const currentBounds = win.getBounds();
    try {
      const validBounds =
        StoreSchema.shape["window-bounds"].parse(currentBounds);
      store.set("window-bounds", validBounds);
    } catch (error) {
      console.error("Error saving window bounds: ", error);
    }
  }
}

const createHiddenPdfWindow = () => {
  const hiddenWin = new BrowserWindow({
    show: false,
    skipTaskbar: true,
    focusable: false,
    width: 1100,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false,
    },
  });
  return hiddenWin;
};

export { createHiddenPdfWindow, nextZoom, saveWindowBounds };
