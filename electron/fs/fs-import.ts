import { validation } from "@shared/ipc-helpers";
import { ImportRequestSchema } from "@shared/schemas/export-schema";
import fs from "fs/promises";
import path from "path";
import { processWithLimit } from "./fs-limiter";

async function batchImport(filePaths: string[]) {
  const imported = await processWithLimit(filePaths, 100, async (file) => {
    try {
      const content = await fs.readFile(file, "utf8");
      const extension = path.extname(file).slice(1).toLowerCase();
      const fileName = path.basename(file, path.extname(file));
      return validation(ImportRequestSchema, {
        extension,
        fileName,
        content,
      });
    } catch (error) {
      console.error(`Failed to read/validate file: ${file}`, error);
      return null;
    }
  });
  return imported.filter((note) => note !== null);
}

export { batchImport };
