import { sanitizeExportString } from "@electron/fs/fs-assets";
import { writeAtomic } from "@electron/fs/fs-atomic-write";
import { getPath } from "@electron/fs/fs-sync";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { AppErrorCode } from "@shared/errors";
import { processWithLimit } from "@shared/limiter";
import type { ExportedContent, ExportResult } from "@shared/types";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";

async function singleExport(filePath: string, data: string) {
  const absoluteTargetFolder = path.dirname(filePath);
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const portableContent = sanitizeExportString(
    data,
    absoluteTargetFolder,
    imagesFolder,
  );
  await writeAtomic(filePath, portableContent);
}

async function batchExport(
  folder: string,
  payload: ExportedContent[],
): Promise<ExportResult[]> {
  await fs.mkdir(folder, { recursive: true }).catch(() => {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const absoluteTargetFolder = path.resolve(folder);
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const exported = await processWithLimit(
    payload,
    50,
    async (item: ExportedContent) => {
      try {
        const { absoluteFilePath } = getPath(absoluteTargetFolder, item);
        const portableContent = sanitizeExportString(
          item.content,
          absoluteTargetFolder,
          imagesFolder,
        );
        await writeAtomic(absoluteFilePath, portableContent);
        return {
          id: item.id,
          filePath: absoluteFilePath,
        };
      } catch (error) {
        console.error("[batchExport]: Error while exporting:", error);
        return null;
      }
    },
  );
  return exported.filter((item): item is ExportResult => item !== null);
}

export { batchExport, singleExport };
