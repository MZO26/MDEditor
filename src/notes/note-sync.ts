import { sync, syncDelete, syncWrite } from "@/api/api";
import { getExportContent } from "@/notes/export-actions";
import { noteStore, settingsStore, stateStore } from "@/settings/app-state";
import { debounce } from "@/utils/async";
import { DEBOUNCE_MS } from "@shared/constants";
import type {
  DeleteSyncRequest,
  SyncRequest,
} from "@shared/schemas/export-schema";
import { handleViewNote } from "./note-actions";

function isSyncEnabled() {
  return settingsStore.get("sync-mode") ?? false;
}

async function handleSync(
  id: string,
  updated_at: string,
): Promise<string | null> {
  const now = Date.now();
  const syncContent = getExportContent(id, "md");
  if (!syncContent.success) {
    console.error(syncContent.error);
    return null;
  }
  if (syncContent.data.extension !== "md") return null;
  const requestContent = syncContent.data;
  const syncPayload: SyncRequest = {
    ...requestContent,
    updated_at,
  };
  stateStore.setState({ lastSyncedAt: now });
  try {
    const result = await sync(syncPayload);
    if (!result.success) {
      console.error(
        "[handleSync -> sync]: Failed to sync fs note.",
        result.error,
      );
      return null;
    }
    if (typeof result.data === "string") {
      console.log("[handleSync]: File has been edited");
      return result.data;
    } else console.log("[handleSync]: Note App has current state.");
    return null;
  } catch (error) {
    console.error("[handleSync]: Unknown syncing error.", error);
    return null;
  }
}

const debouncedFocusSync = debounce(async () => {
  if (!isSyncEnabled()) return;
  const id = stateStore.get("activeId");
  const note = noteStore.get("notes").find((n) => n.id === id);
  if (!note) return;
  const syncedContent = await handleSync(note.id, note.updated_at);
  if (syncedContent) {
    handleViewNote(note, { content: syncedContent, extension: "markdown" });
  }
}, DEBOUNCE_MS.fast);

async function handleSyncWrite(id: string, oldTitle?: string) {
  try {
    const result = getExportContent(id, "md");
    if (!result.success) {
      console.error(result.error);
      return;
    }
    const writePayload = {
      ...result.data,
      previousTitle: oldTitle ?? "",
      extension: "md" as const,
    };
    await syncWrite(writePayload);
  } catch (err) {
    console.error("[handleSyncWrite]: Background sync failed:", err);
  }
}

async function handleSyncDelete(request: DeleteSyncRequest) {
  const result = await syncDelete(request);
  if (!result.success) {
    console.error(
      "[handleSyncDelete]: Error synchronizing deletion of synced note.",
      result.error,
    );
    return;
  }
}

export {
  debouncedFocusSync,
  handleSync,
  handleSyncDelete,
  handleSyncWrite,
  isSyncEnabled,
};
