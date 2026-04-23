import type { IpcResponse, Note } from "../../../shared/types";
import { safeIpcCall } from "../../utils/helpers";

async function searchNotes(
  searchInput: string,
  limit: number,
): Promise<IpcResponse<Note[]>> {
  return safeIpcCall(window.noteAPI.searchNotes(searchInput, limit));
}

export { searchNotes };
