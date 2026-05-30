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
import { app } from "electron";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
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

async function syncNote(targetDir: string, payload: SyncRequest) {
  if (activeSyncs.has(payload.id)) return null;
  activeSyncs.add(payload.id);
  const syncPath = path.join(targetDir, "MZO Notes");
  await mkdir(syncPath, { recursive: true }).catch(() => {});
  const { absoluteFilePath } = getPath(syncPath, {
    fileName: payload.fileName,
    id: payload.id,
    extension: "md",
  });
  const updatedAt = new Date(payload.updated_at).getTime();
  let fsStat: Awaited<ReturnType<typeof stat>> | null = null;
  try {
    fsStat = await stat(absoluteFilePath);
    if (fsStat.mtimeMs > updatedAt + SYNC_DRIFT_BUFFER_MS) {
      const externalContent = await readFile(absoluteFilePath, "utf-8");
      if (externalContent === payload.content) return null;
      return externalContent;
    }
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code !== "ENOENT") throw err;
  } finally {
    activeSyncs.delete(payload.id);
  }
  return null;
}

async function writeSyncedNote(targetDir: string, payload: WriteSyncRequest) {
  // new file path
  const syncPath = path.join(targetDir, "MZO Notes");
  await mkdir(syncPath, { recursive: true }).catch(() => {});
  const { absoluteFilePath, idSuffix } = getPath(syncPath, payload);
  // prepare content
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  const portableContent = sanitizeExportString(
    payload.content,
    syncPath,
    imagesFolder,
  );
  // no write atomic for clean modify events for external editors and no delete event in between
  const existing = await readFile(absoluteFilePath, "utf8").catch(() => null);
  if (existing !== portableContent) {
    await writeFile(absoluteFilePath, portableContent, "utf8");
  }
  // cleanup
  if (payload.previousTitle && payload.previousTitle !== payload.fileName) {
    const safeOldTitle = validation(FileNameSchema, payload.previousTitle);
    const oldFileName = `${safeOldTitle}${idSuffix}`;
    const absoluteOldPath = path.resolve(syncPath, oldFileName);
    unlink(absoluteOldPath).catch(() => {});
  }
  return payload.fileName;
}

async function deleteSyncedNote(targetDir: string, payload: DeleteSyncRequest) {
  const syncPath = path.join(targetDir, "MZO Notes");
  await mkdir(syncPath, { recursive: true }).catch(() => {});
  const { absoluteFilePath } = getPath(syncPath, payload);
  try {
    await unlink(absoluteFilePath);
  } catch (error) {
    console.error(
      "[deleteSyncedNote]: Error while deleting synced note:",
      error,
    );
    throw new AppBackendError(AppErrorCode.FileWriteError);
  }
}

export { deleteSyncedNote, getPath, syncNote, writeSyncedNote };
