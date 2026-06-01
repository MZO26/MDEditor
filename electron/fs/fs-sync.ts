import { sanitizeExportString } from "@electron/fs/fs-assets";
import { writeAtomic } from "@electron/fs/fs-atomic-write";
import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { validation } from "@electron/ipc/ipc-validation";
import { AppErrorCode } from "@shared/errors";
import {
  FileNameSchema,
  type DeleteSyncRequest,
  type SyncRequest,
  type WriteSyncRequest,
} from "@shared/schemas/export-schema";
import type { ExportedContent, FileContent, SyncResult } from "@shared/types";
import { app } from "electron";
import { mkdir, readFile, rename, unlink } from "fs/promises";
import path from "path";

function getPath(
  targetDirectory: string,
  payload: ExportedContent | FileContent | DeleteSyncRequest,
) {
  const idSuffix = `_${payload.id}.${payload.extension}`;
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

function normalizeMarkdown(content: string) {
  return content.replace(/\r\n/g, "\n");
}

const activeSyncLocks = new Set<string>();

async function checkSyncState(
  targetDir: string,
  payload: SyncRequest,
): Promise<SyncResult> {
  const syncPath = resolveSyncPath(targetDir);
  const { absoluteFilePath } = getPath(syncPath, {
    fileName: payload.fileName,
    id: payload.id,
    extension: "md",
  });
  if (activeSyncLocks.has(absoluteFilePath)) {
    throw new AppBackendError(AppErrorCode.CancelledOperation);
  }
  activeSyncLocks.add(absoluteFilePath);
  try {
    let localContent: string | null = null;
    try {
      localContent = await readFile(absoluteFilePath, "utf-8");
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("[checkSyncState]: Error checking file:", error);
        throw new AppBackendError(AppErrorCode.InvalidData);
      }
      return { type: "MISSING_RESOLVED", content: null };
    }
    const normalizedLocal = normalizeMarkdown(localContent).trimEnd();
    const normalizedDB = normalizeMarkdown(payload.content).trimEnd();
    if (normalizedLocal === normalizedDB) {
      return { type: "IN_SYNC", content: localContent };
    }
    if (normalizedLocal !== normalizedDB) {
      return { type: "OUT_OF_SYNC", localContent, dbContent: payload.content };
    }
    return { type: "OUT_OF_SYNC", localContent, dbContent: payload.content };
  } finally {
    activeSyncLocks.delete(absoluteFilePath);
  }
}

async function writeSyncedNote(targetDir: string, payload: WriteSyncRequest) {
  const syncPath = resolveSyncPath(targetDir);
  await mkdir(syncPath, { recursive: true }).catch(() => {
    throw new AppBackendError(AppErrorCode.FileWriteError);
  });
  const { absoluteFilePath } = getPath(syncPath, payload);
  if (payload.previousTitle && payload.previousTitle !== payload.fileName) {
    const { absoluteFilePath: absoluteOldPath } = getPath(syncPath, {
      ...payload,
      fileName: payload.previousTitle,
    });
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
    await writeAtomic(absoluteFilePath, portableContent).catch((error) => {
      console.error("[writeSyncedNote]: Error writing to file:", error);
      throw new AppBackendError(AppErrorCode.FileWriteError);
    });
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

export { checkSyncState, deleteSyncedNote, getPath, writeSyncedNote };
