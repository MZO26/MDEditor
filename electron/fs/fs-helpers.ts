import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { validation } from "@electron/ipc/ipc-validation";
import { AppErrorCode } from "@shared/errors";
import { FileNameSchema } from "@shared/schemas/export-schema";
import fs from "fs";
import path from "path";

function sanitizeExportString(
  content: string,
  exportDir: string,
  internalImgDir: string,
) {
  const assetsDir = path.join(exportDir, "assets");
  const regex = /appimg:\/\/\/([^"' )>\s]+)/g;
  const portableContent = content.replace(regex, (_fullMatch, fileName) => {
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const internalPath = path.join(internalImgDir, fileName);
    const exportPath = path.join(assetsDir, fileName);
    if (fs.existsSync(internalPath)) {
      fs.copyFileSync(internalPath, exportPath);
    }
    return `assets/${fileName}`;
  });
  return portableContent;
}

function sanitizeImportString(
  importedContent: string,
  importedFileDir: string,
  internalImgDir: string,
) {
  const regex = /(?:\.\/)?assets\/([^"' )>\s]+)/g;
  const internalContent = importedContent.replace(
    regex,
    (_fullMatch, fileName) => {
      const sourceImagePath = path.join(importedFileDir, "assets", fileName);
      const destImagePath = path.join(internalImgDir, fileName);
      if (!fs.existsSync(internalImgDir)) {
        fs.mkdirSync(internalImgDir, { recursive: true });
      }
      if (fs.existsSync(sourceImagePath)) {
        fs.copyFileSync(sourceImagePath, destImagePath);
      }
      return `appimg:///${fileName}`;
    },
  );
  return internalContent;
}

function getSafeLocalDateString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}`;
}

function getFilePath(
  targetDirectory: string,
  payload: { fileName: string; created_at: string; extension: string },
) {
  const extension = payload.extension ?? "md";
  const creationDate = new Date(payload.created_at);
  const safeDate = getSafeLocalDateString(creationDate);
  const safeTitle = validation(FileNameSchema, payload.fileName);
  const newFileName = `${safeTitle}_${safeDate}.${extension}`;
  const absoluteFilePath = path.resolve(targetDirectory, newFileName);
  // security check
  ensureInsideDirectory(targetDirectory, absoluteFilePath);
  return absoluteFilePath;
}

function ensureInsideDirectory(baseDir: string, absoluteFilePath: string) {
  const relative = path.relative(baseDir, absoluteFilePath);
  const isOutside = relative.startsWith("..") || path.isAbsolute(relative);
  if (isOutside) {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  }
}

export {
  ensureInsideDirectory,
  getFilePath,
  getSafeLocalDateString,
  sanitizeExportString,
  sanitizeImportString,
};
