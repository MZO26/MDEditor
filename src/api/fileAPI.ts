import { safeInvoke } from "@/utils/ipc";
import type {
  ExportRequest,
  ImportRequest,
} from "@shared/schemas/export-schema";
import type { ExportItem, Result } from "@shared/types";

async function exportNote(
  payload: ExportRequest,
): Promise<Result<ExportRequest>> {
  return safeInvoke(window.fileAPI.noteExport(payload));
}

async function exportManyNotes(
  payload: ExportItem[],
): Promise<Result<ExportItem[]>> {
  return safeInvoke(window.fileAPI.noteExportMany(payload));
}

async function importNote(): Promise<Result<ImportRequest[]>> {
  return safeInvoke(window.fileAPI.noteImport());
}

export { exportManyNotes, exportNote, importNote };
