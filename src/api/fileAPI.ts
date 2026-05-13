import { safeInvoke } from "@/utils/ipc";
import type {
  ExportManyRequest,
  ExportRequest,
  ImportRequest,
} from "@shared/schemas/export-schema";
import type { Result } from "@shared/types";

async function exportNote(
  payload: ExportRequest,
): Promise<Result<ExportRequest>> {
  return safeInvoke(window.fileAPI.noteExport(payload));
}

async function exportManyNotes(
  payload: ExportManyRequest,
): Promise<Result<ExportManyRequest>> {
  return safeInvoke(window.fileAPI.noteExportMany(payload));
}

async function importNote(): Promise<Result<ImportRequest[]>> {
  return safeInvoke(window.fileAPI.noteImport());
}

export { exportManyNotes, exportNote, importNote };
