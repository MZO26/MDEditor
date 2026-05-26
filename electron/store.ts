import { StoreSchema, type AppSettings } from "@shared/schemas/store-schema";
import Store from "electron-store";

export const store = new Store<AppSettings>();

function validateStore() {
  const data = store.store;
  const validatedData = StoreSchema.safeParse(data);
  if (!validatedData.success) {
    console.error(
      "Validation failed:",
      JSON.stringify(validatedData.error, null, 2),
    );
    console.dir(validatedData.error.issues, { depth: null });
    const safeData = StoreSchema.parse({});
    store.store = safeData;
  }
}

validateStore();
