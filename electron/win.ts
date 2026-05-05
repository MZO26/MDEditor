import { win } from "@electron/main";
import { store } from "@electron/store";
import { StoreSchema } from "@shared/schemas/store-schema";

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

export { saveWindowBounds };
