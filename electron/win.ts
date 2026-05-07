import { win } from "@electron/main";
import { store } from "@electron/store";
import { StoreSchema } from "@shared/schemas/store-schema";
import type { ZoomAction } from "@shared/types";

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

export { nextZoom, saveWindowBounds };
