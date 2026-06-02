import { sync, updateNote } from "@/api/api";
import { getNoteEditorExtensions } from "@/components/editor/editor-init";
import { noteStore, settingsStore, stateStore } from "@/settings/app-state";
import { initConflictDialog } from "@/settings/dialog-init";
import { getAppItem } from "@/utils/registry";
import { DEBOUNCE_MS } from "@shared/constants";
import { getMetadata, titleGenerator } from "@shared/generators";
import type { SyncRequest } from "@shared/schemas/export-schema";
import { Editor } from "@tiptap/core";

const { conflictDialog } = initConflictDialog();

function isMirrorEnabled() {
  return settingsStore.get("mirror-mode") ?? false;
}

async function handleConflict(id: string, updated_at: string) {
  const now = Date.now();
  const lastSynced = stateStore.get("lastSyncedAt") || 0;
  if (now - lastSynced < DEBOUNCE_MS.slow) return;
  const dbNote = noteStore.get("notes").find((n) => n.id === id);
  if (!dbNote) return;
  const syncPayload: SyncRequest = {
    id,
    fileName: titleGenerator(dbNote.content),
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
            const newTitle = titleGenerator(json);
            const metaData = getMetadata(json);
            const updatePayload = {
              ...note,
              ...metaData,
              title: newTitle,
              content: json,
              markdown: localContent,
              plainText,
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
              "[handleConflict]: Headless editor failed to convert markdown",
              error,
            );
          } finally {
            if (headlessEditor) headlessEditor.destroy();
          }
        } else if (decision === "accept") {
          // keep db content and overwrite local file
          const updateResult = await updateNote(
            {
              ...dbNote,
              ...getMetadata(dbNote.content),
            },
            true,
          );
          if (!updateResult.success) return;
          noteStore.setState((state) => ({
            notes: state.notes.map((n) =>
              n.id === updateResult.data.id ? updateResult.data : n,
            ),
            sidebarChange: { type: "update", noteId: updateResult.data.id },
          }));
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

export { handleConflict, isMirrorEnabled };
