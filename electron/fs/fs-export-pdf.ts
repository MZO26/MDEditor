import { exportPdfNote } from "@electron/fs/fs-pdf";
import { getPath } from "@electron/fs/fs-sync";
import { loadPDFAssets } from "@electron/handler/pdf-handler";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { createHiddenPdfWindow } from "@electron/win";
import { AppErrorCode } from "@shared/errors";
import { processWithLimit } from "@shared/limiter";
import type { ExportedContent, ExportResult } from "@shared/types";
import fs from "fs/promises";
import path from "path";

async function singlePDFExport(filePath: string, data: string) {
  const hiddenWin = createHiddenPdfWindow();
  const assets = loadPDFAssets();
  try {
    await exportPdfNote({ win: hiddenWin, filePath, html: data, assets });
    return filePath;
  } finally {
    if (hiddenWin && !hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
}

async function batchPDFExport(
  folder: string,
  payload: ExportedContent[],
): Promise<ExportResult[]> {
  await fs.mkdir(folder, { recursive: true });
  const absoluteTargetFolder = path.resolve(folder);
  const assets = loadPDFAssets();
  let hiddenWin = createHiddenPdfWindow();
  try {
    const exported = await processWithLimit(payload, 1, async (item) => {
      const { absoluteFilePath } = getPath(absoluteTargetFolder, item);
      const filePath = await exportPdfNote({
        win: hiddenWin,
        filePath: absoluteFilePath,
        html: item.content,
        assets,
      });
      return {
        id: item.id,
        filePath,
      };
    });
    return exported.filter((item): item is ExportResult => item !== null);
  } catch (error) {
    console.error("[batchPDFExport]: Error while exporting:", error);
    throw new AppBackendError(AppErrorCode.ExportError);
  } finally {
    if (hiddenWin && !hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
}

export { batchPDFExport, singlePDFExport };
