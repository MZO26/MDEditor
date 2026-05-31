import { sanitizeExportString } from "@electron/fs/fs-assets";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { validation } from "@electron/ipc/ipc-validation";
import { SYNC_DRIFT_BUFFER_MS } from "@shared/constants";
import { AppErrorCode } from "@shared/errors";
import {
  FileNameSchema,
  type DeleteSyncRequest,
  type SyncRequest,
  type WriteSyncRequest,
} from "@shared/schemas/export-schema";
import type { ExportedContent, FileContent } from "@shared/types";
import { createHash } from "crypto";
import { app } from "electron";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "fs/promises";
import path from "path";

const activeSyncs = new Set<string>();

function getPath(
  targetDirectory: string,
  payload: ExportedContent | FileContent | DeleteSyncRequest,
) {
  const idSuffix = `_${payload.id.slice(0, 6)}.${payload.extension}`;
  const safeTitle = validation(FileNameSchema, payload.fileName);
  const newFileName = `${safeTitle}${idSuffix}`;
  const absoluteFilePath = path.resolve(targetDirectory, newFileName);
  // security check
  const relative = path.relative(targetDirectory, absoluteFilePath);
  const isOutside = relative.startsWith("..") || path.isAbsolute(relative);
  if (isOutside) {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  }
  return { absoluteFilePath, idSuffix };
}

function resolveSyncPath(targetDir: string) {
  const normalized = path.resolve(targetDir);
  const baseName = path.basename(normalized).toLowerCase();

  return baseName === "mzo notes"
    ? normalized
    : path.join(normalized, "MZO Notes");
}

async function syncNote(
  targetDir: string,
  payload: SyncRequest,
): Promise<string | null> {
  if (activeSyncs.has(payload.id)) return null;
  activeSyncs.add(payload.id);
  try {
    const syncPath = resolveSyncPath(targetDir);
    await mkdir(syncPath, { recursive: true }).catch(() => {
      throw new AppBackendError(AppErrorCode.FileWriteError);
    });
    const { absoluteFilePath } = getPath(syncPath, {
      fileName: payload.fileName,
      id: payload.id,
      extension: "md",
    });
    const updatedAt = new Date(payload.updated_at).getTime();
    if (isNaN(updatedAt))
      throw new AppBackendError(AppErrorCode.FileWriteError);
    let fsStat: Awaited<ReturnType<typeof stat>>;
    let externalContent = "";
    try {
      fsStat = await stat(absoluteFilePath);
      externalContent = await readFile(absoluteFilePath, "utf-8");
    } catch (error: unknown) {
      const nodeErr = error as NodeJS.ErrnoException;
      if (nodeErr.code === "ENOENT") {
        // file is missing
        await writeFile(absoluteFilePath, payload.content, "utf-8");
        return null;
      }
      throw error;
    }
    const dbHash = createHash("sha256").update(payload.content).digest("hex");
    const fsHash = createHash("sha256").update(externalContent).digest("hex");
    if (fsHash === dbHash) return null;
    if (fsStat.mtimeMs > updatedAt + SYNC_DRIFT_BUFFER_MS) {
      return externalContent;
    } else {
      await writeFile(absoluteFilePath, payload.content, "utf-8");
      return null;
    }
  } finally {
    activeSyncs.delete(payload.id);
  }
}

async function writeSyncedNote(targetDir: string, payload: WriteSyncRequest) {
  const syncPath = resolveSyncPath(targetDir);
  await mkdir(syncPath, { recursive: true }).catch(() => {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const { absoluteFilePath, idSuffix } = getPath(syncPath, payload);
  if (payload.previousTitle && payload.previousTitle !== payload.fileName) {
    const safeOldTitle = validation(FileNameSchema, payload.previousTitle);
    const oldFileName = `${safeOldTitle}${idSuffix}`;
    const absoluteOldPath = path.resolve(syncPath, oldFileName);
    const relative = path.relative(syncPath, absoluteOldPath);
    const isOutside = relative.startsWith("..") || path.isAbsolute(relative);
    if (isOutside) {
      throw new AppBackendError(AppErrorCode.FileWriteError);
    }
    if (absoluteOldPath !== absoluteFilePath) {
      await rename(absoluteOldPath, absoluteFilePath).catch(
        (error: unknown) => {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw new AppBackendError(AppErrorCode.FileWriteError);
          }
        },
      );
    }
  }
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const portableContent = sanitizeExportString(
    payload.content,
    syncPath,
    imagesFolder,
  );
  const existing = await readFile(absoluteFilePath, "utf8").catch(() => null);
  if (existing !== portableContent) {
    await writeFile(absoluteFilePath, portableContent, "utf8").catch(
      (error) => {
        console.error("[writeSyncedNote]: Error writing to file:", error);
        throw new AppBackendError(AppErrorCode.FileWriteError);
      },
    );
  }
  return payload.fileName;
}

async function deleteSyncedNote(targetDir: string, payload: DeleteSyncRequest) {
  const syncPath = resolveSyncPath(targetDir);
  await mkdir(syncPath, { recursive: true }).catch(() => {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const { absoluteFilePath } = getPath(syncPath, payload);
  await unlink(absoluteFilePath).catch((error) => {
    console.error(
      "[deleteSyncedNote]: Error while deleting synced note:",
      error,
    );
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
}

export { deleteSyncedNote, getPath, syncNote, writeSyncedNote };
