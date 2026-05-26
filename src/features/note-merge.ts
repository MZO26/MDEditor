import { mergeNotes } from "@/api/api";
import { debouncedUpdateStats } from "@/components/sidebar/info-sidebar-actions";
import { cleanupDeletedNoteUI, viewNote } from "@/features/note-actions";
import { stopAutoSave } from "@/features/note-auto-save";
import { stateStore } from "@/settings/app-state";
import { findElement, setActiveItem } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import { validateUUID } from "@/utils/validate";

async function handleMergeNotes(idA: string, idB: string) {
  const validatedId = validateUUID(idB);
  if (!validatedId) {
    console.error("[handleMergeNotes]: Invalid Note ID format.");
    return;
  }
  if (idA === validatedId) {
    console.error("[handleMergeNotes]: Cannot merge a note with itself.");
    return;
  }
  stopAutoSave(getAppItem("editor"), "cancel");
  const result = await mergeNotes(idA, validatedId);
  if (!result.success) {
    console.error("[handleMergeNotes]: Failed to merge notes:", result.error);
    return;
  }
  const noteBElement = findElement<HTMLDivElement>(
    `div[data-id="${validatedId}"]`,
    getAppItem("sidebar"),
  );
  if (noteBElement) cleanupDeletedNoteUI(validatedId, noteBElement);
  stateStore.setState({ activeId: result.data.id });
  viewNote(result.data);
  debouncedUpdateStats(result.data);
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${result.data.id}"]`,
    getAppItem("sidebar"),
  );
  if (noteElement) setActiveItem(noteElement, getAppItem("sidebar"));
}

export { handleMergeNotes };
