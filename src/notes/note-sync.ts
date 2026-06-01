import { sync, syncDelete, syncWrite, updateNote } from "@/api/api";
import { getNoteEditorExtensions } from "@/components/editor/editor-init";
import { getExportContent } from "@/notes/export-actions";
import { noteStore, settingsStore, stateStore } from "@/settings/app-state";
import { initConflictDialog } from "@/settings/dialog-init";
import { getAppItem } from "@/utils/registry";
import { DEBOUNCE_MS, UNTITLED } from "@shared/constants";
import { getMetadata, titleGenerator } from "@shared/generators";
import type {
  DeleteSyncRequest,
  SyncRequest,
} from "@shared/schemas/export-schema";
import { Editor } from "@tiptap/core";

const { conflictDialog } = initConflictDialog();

function isSyncEnabled() {
  return settingsStore.get("sync-mode") ?? false;
}

async function handleSync(id: string, updated_at: string) {
  const now = Date.now();
  const lastSynced = stateStore.get("lastSyncedAt") || 0;
  if (now - lastSynced < DEBOUNCE_MS.slow) return;
  const dbNote = noteStore.get("notes").find((n) => n.id === id);
  if (!dbNote) return;
  const syncPayload: SyncRequest = {
    id,
    fileName:
      dbNote?.title.trim() || titleGenerator(dbNote.plainText) || UNTITLED,
    content: dbNote.markdown,
    extension: "md",
    updated_at,
  };
  stateStore.setState({ lastSyncedAt: now });
  const result = await sync(syncPayload);
  if (!result.success || !result.data) return;
  switch (result.data.type) {
    case "MISSING_RESOLVED":
      break;
    case "IN_SYNC":
      break;
    case "OUT_OF_SYNC": {
      const { localContent } = result.data;
      conflictDialog.returnValue = "";
      const handleConflictClose = async () => {
        const decision = conflictDialog.returnValue;
        const note = noteStore.get("notes").find((n) => n.id === id);
        if (!note) return;
        if (decision === "overwrite") {
          let headlessEditor;
          try {
            headlessEditor = new Editor({
              extensions: getNoteEditorExtensions(),
              content: localContent,
              contentType: "markdown",
            });
            const json = headlessEditor.getJSON();
            const plainText = headlessEditor.getText();
            const newTitle = titleGenerator(plainText);
            const metaData = getMetadata(json, plainText);
            const updatePayload = {
              ...note,
              ...metaData,
              title: newTitle,
              content: json,
              markdown: localContent,
              plainText,
              links: [],
            };
            await updateNote(updatePayload, true);
            if (stateStore.get("activeId") === id) {
              const activeEditor = getAppItem("editor");
              if (activeEditor) {
                activeEditor.commands.setContent(json, { emitUpdate: false });
              }
            }
          } catch (error) {
            console.error(
              "[handleSync]: Headless editor failed to convert markdown",
              error,
            );
          } finally {
            if (headlessEditor) headlessEditor.destroy();
          }
        } else if (decision === "accept") {
          // keep db content
          const newTitle = titleGenerator(note.plainText);
          await handleSyncWrite(note.id, newTitle, note.title);
        }
      };
      conflictDialog.addEventListener("close", handleConflictClose, {
        once: true,
      });
      conflictDialog.showModal();
      break;
    }
  }
}

async function handleSyncWrite(
  id: string,
  newTitle: string,
  oldTitle?: string,
) {
  try {
    const result = getExportContent(id, "md");
    if (!result.success) {
      console.error(result.error);
      return;
    }
    const writePayload = {
      ...result.data,
      previousTitle: oldTitle ?? "",
      fileName: newTitle,
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

export { handleSync, handleSyncDelete, handleSyncWrite, isSyncEnabled };
