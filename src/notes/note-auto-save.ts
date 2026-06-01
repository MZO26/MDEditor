import { handleSaveNote } from "@/notes/note-actions";
import { debounce } from "@/utils/async";
import { CLEANUP, DEBOUNCE_MS } from "@shared/constants";
import type { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

// autosave

// lastSavedDoc and pending save as closures to avoid autosaves overwriting each other and autosaving when nothing has changed (dirtyCheck). handleSaveNote gets assigned to savePromise variable and then to pending save. If savePromise succeeded, pending save gets freed and set to null again

function setupAutoSave(editor: Editor, id: string) {
  let lastSavedDoc: Node = editor.state.doc;
  let pendingSave: Promise<void> | null = null;
  const performSave = async (isFlush: boolean) => {
    if (pendingSave) {
      try {
        await pendingSave;
      } catch (e) {}
    }
    const docToSave = editor.state.doc;
    if (!isFlush && docToSave.eq(lastSavedDoc)) return;
    const savePromise = handleSaveNote(id, isFlush);
    pendingSave = savePromise;
    try {
      await savePromise;
      lastSavedDoc = docToSave;
    } finally {
      if (pendingSave === savePromise) {
        pendingSave = null;
      }
    }
  };
  const debouncedSave = debounce(() => performSave(false), DEBOUNCE_MS.slow);
  const updateHandler = () => debouncedSave();
  editor.on("update", updateHandler);
  return {
    flush: async () => {
      editor.off("update", updateHandler);
      debouncedSave.cancel();
      await performSave(true);
    },
    cancel: () => {
      editor.off("update", updateHandler);
      debouncedSave.cancel();
    },
  };
}

async function stopAutoSave(
  editor: Editor,
  action: "flush" | "cancel" = "flush",
) {
  const existingCleanup = CLEANUP.get(editor);
  if (existingCleanup) {
    await existingCleanup[action]();
    CLEANUP.delete(editor);
  }
}

export { setupAutoSave, stopAutoSave };
