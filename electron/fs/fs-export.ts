import { sanitizeExportString } from "@electron/fs/fs-assets";
import { writeAtomic } from "@electron/fs/fs-atomic-write";
import { processWithLimit } from "@electron/fs/fs-limiter";
import { validation } from "@shared/ipc-helpers";
import { FileNameSchema } from "@shared/schemas/export-schema";
import type { ExportItem } from "@shared/types";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";

async function batchExport(folder: string, payload: ExportItem[]) {
  await fs.mkdir(folder, { recursive: true });
  const absoluteTargetFolder = path.resolve(folder);
  const exported = await processWithLimit(payload, 100, async (note) => {
    const fileName = `${validation(FileNameSchema, note.fileName)}_${note.id.slice(0, 6)}.${note.extension}`;
    const absoluteFilePath = path.resolve(absoluteTargetFolder, fileName);
    const relative = path.relative(absoluteTargetFolder, absoluteFilePath);
    const isOutside = relative.startsWith("..") || path.isAbsolute(relative);
    if (isOutside) {
      return null;
    }
    const rawContent = note.content;
    const userDataPath = app.getPath("userData");
    const imagesFolder = path.join(userDataPath, "editor-images");
    const portableContent = sanitizeExportString(
      rawContent,
      absoluteTargetFolder,
      imagesFolder,
    );
    await writeAtomic(absoluteFilePath, portableContent);
    return {
      id: note.id,
      filePath: absoluteFilePath,
    };
  });
  return exported.filter((note) => note !== null);
}

export { batchExport };
