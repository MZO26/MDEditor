import { sync, updateNote } from "@/api/api";
import { getNoteEditorExtensions } from "@/components/editor/editor-init";
import {
  noteStore,
  searchEngine,
  settingsStore,
  stateStore,
} from "@/settings/app-state";
import { initConflictDialog } from "@/settings/dialog-init";
import { toNoteListItem } from "@/utils/note";
import { getAppItem } from "@/utils/registry";
import { DEBOUNCE_MS } from "@shared/constants";
import { getMetadata, titleGenerator } from "@shared/generators";
import type { SyncRequest } from "@shared/schemas/export-schema";
import type { Note } from "@shared/schemas/note-schema";
import { Editor } from "@tiptap/core";

const { conflictDialog } = initConflictDialog();

function isMirrorEnabled() {
  return settingsStore.get("mirror-mode") ?? false;
}

async function handleConflict(note: Note, markdown: string) {
  const now = Date.now();
  const lastSynced = stateStore.get("lastSyncedAt") || 0;
  if (now - lastSynced < DEBOUNCE_MS.slow) return;
  const syncPayload: SyncRequest = {
    id: note.id,
    fileName: titleGenerator(note.content),
    content: markdown,
    extension: "md",
    updated_at: note.updated_at,
  };
  stateStore.setState({ lastSyncedAt: now });
  const result = await sync(syncPayload);
  if (!result.success || !result.data) return;
  switch (result.data.type) {
    case "MISSING_RESOLVED":
      return result.data.type;
    case "IN_SYNC":
      return result.data.type;
    case "OUT_OF_SYNC": {
      const { localContent } = result.data;
      conflictDialog.returnValue = "";
      const handleConflictClose = async () => {
        const decision = conflictDialog.returnValue;
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
            const newTitle = titleGenerator(json);
            const metaData = getMetadata(json);
            const updatePayload = {
              ...note,
              ...metaData,
              title: newTitle,
              content: json,
              markdown: localContent,
            };
            const result = await updateNote(updatePayload, true);
            if (!result.success) {
              console.error(
                "[handleConflict -> updateNote]: Update failed.",
                result.error,
              );
              return;
            }
            if (stateStore.get("activeId") === note.id) {
              const activeEditor = getAppItem("editor");
              if (activeEditor) {
                activeEditor.commands.setContent(json, { emitUpdate: false });
              }
              const updatedListItem = toNoteListItem(result.data);
              noteStore.setState((state) => ({
                activeNote:
                  state.activeNote?.id === result.data.id
                    ? result.data
                    : state.activeNote,
                notes: state.notes.map((n) =>
                  n.id === updatedListItem.id ? updatedListItem : n,
                ),
                sidebarChange: { type: "update", noteId: result.data.id },
              }));
              searchEngine.upsertNote(updatedListItem);
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
              ...note,
              ...(markdown !== undefined ? { markdown } : {}),
              ...getMetadata(note.content),
            },
            true,
          );
          if (!updateResult.success) {
            console.error(
              "[handleConflict -> updateNote]: Update failed.",
              updateResult.error,
            );
            return;
          }
          const updatedListItem = toNoteListItem(updateResult.data);
          noteStore.setState((state) => ({
            activeNote:
              state.activeNote?.id === updateResult.data.id
                ? updateResult.data
                : state.activeNote,
            notes: state.notes.map((n) =>
              n.id === updatedListItem.id ? updatedListItem : n,
            ),
            sidebarChange: { type: "update", noteId: updateResult.data.id },
          }));
          searchEngine.upsertNote(updatedListItem);
        }
      };
      conflictDialog.addEventListener("close", handleConflictClose, {
        once: true,
      });
      conflictDialog.showModal();
      return result.data.type;
    }
  }
}

export { handleConflict, isMirrorEnabled };
