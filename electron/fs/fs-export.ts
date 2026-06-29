import { writeAtomic } from "@electron/fs/fs-atomic-write";
import { getFilePath } from "@electron/fs/fs-auto-export";
import { sanitizeExportString } from "@electron/fs/fs-helpers";
import { loadPDFAssets, renderPDFCanvas } from "@electron/handler/pdf-handler";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { createHiddenPdfWindow } from "@electron/win";
import { AppErrorCode } from "@shared/errors";
import { processWithLimit } from "@shared/limiter";
import type { ExportedContent } from "@shared/types";
import type { BrowserWindow, PrintToPDFOptions } from "electron";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";

async function singleExport(filePath: string, data: string) {
  const absoluteTargetFolder = path.dirname(filePath);
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const portableContent = await sanitizeExportString(
    data,
    absoluteTargetFolder,
    imagesFolder,
  );
  await writeAtomic(filePath, portableContent).catch((error) => {
    console.error("[singleExport]: Error writing file:", error);
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
}

async function batchExport(folder: string, payload: ExportedContent[]) {
  await fs.mkdir(folder, { recursive: true }).catch((error) => {
    console.error("[batchExport]: Failed to create directory:", error);
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const absoluteTargetFolder = path.resolve(folder);
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const exported = await processWithLimit(
    payload,
    10,
    async (item: ExportedContent) => {
      try {
        const absoluteFilePath = getFilePath(absoluteTargetFolder, item);
        const portableContent = await sanitizeExportString(
          item.content,
          absoluteTargetFolder,
          imagesFolder,
        );
        await writeAtomic(absoluteFilePath, portableContent);
        return absoluteFilePath;
      } catch (error) {
        console.error("[batchExport]: Error while exporting:", error);
        throw new AppBackendError(AppErrorCode.FileWriteError);
      }
    },
  );
  return exported.filter((item) => item !== null);
}

async function exportPDFNote(params: {
  win: BrowserWindow;
  filePath: string;
  html: string;
  assets: ReturnType<typeof loadPDFAssets>;
}) {
  const { win, filePath, html, assets } = params;
  const pdfOptions: PrintToPDFOptions = {
    pageSize: "A4",
    printBackground: true,
    landscape: false,
  };
  const htmlString = renderPDFCanvas(html, assets);
  const encoded = Buffer.from(htmlString, "utf8").toString("base64");
  // converts htmlString into bytes using utf8 encoding (Buffer is Node.js's raw byte array). toString(base64) then takes those bytes and encodes them as base64 which only allows A-Z a-z 0-9 + / = chars.
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed())
    await win.loadURL(`data:text/html;base64,${encoded}`);
  // data:text/html tells chrome parse as html and base64 tells chrome to decode before parsing with the exact html bytes. Base64 is required to load the css correctly because chrome expects URL's to have URL-encoded content.
  const pdfBuffer = await win.webContents.printToPDF(pdfOptions);
  await writeAtomic(filePath, pdfBuffer).catch((error) => {
    console.error("[exportPDFNote]: Error writing PDF file:", error);
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  return filePath;
}

async function singlePDFExport(filePath: string, data: string) {
  const hiddenWin = createHiddenPdfWindow();
  const assets = loadPDFAssets();
  try {
    await exportPDFNote({ win: hiddenWin, filePath, html: data, assets });
  } catch (error) {
    console.error("[singlePDFExport]: Error writing PDF file:", error);
    throw new AppBackendError(AppErrorCode.FileWriteError);
  } finally {
    if (hiddenWin && !hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
}

async function batchPDFExport(folder: string, payload: ExportedContent[]) {
  await fs.mkdir(folder, { recursive: true }).catch((error) => {
    console.error("[batchPDFExport]: Failed to create directory:", error);
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const absoluteTargetFolder = path.resolve(folder);
  const assets = loadPDFAssets();
  let hiddenWin = createHiddenPdfWindow();
  try {
    const exported = await processWithLimit(payload, 1, async (item) => {
      const absoluteFilePath = getFilePath(absoluteTargetFolder, item);
      const filePath = await exportPDFNote({
        win: hiddenWin,
        filePath: absoluteFilePath,
        html: item.content,
        assets,
      });
      return filePath;
    });
    return exported.filter((item) => item !== null);
  } catch (error) {
    console.error("[batchPDFExport]: Error while exporting:", error);
    throw new AppBackendError(AppErrorCode.ExportError);
  } finally {
    if (hiddenWin && !hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
}

export { batchExport, batchPDFExport, singleExport, singlePDFExport };
