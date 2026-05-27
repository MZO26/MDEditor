import { mergeNotes } from "@/api/api";
import { handleViewNote } from "@/notes/note-actions";
import { stopAutoSave } from "@/notes/note-auto-save";
import { noteStore, stateStore } from "@/settings/app-state";
import { findElement, setActiveItem } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";

function validateUUID(value: string) {
  const cleanedValue = value.replace(/[\[\]]/g, "").trim();
  const UUID_REGEX =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (UUID_REGEX.test(cleanedValue)) {
    return cleanedValue;
  }
  return undefined;
}

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
  const sidebar = getAppItem("sidebar");
  noteStore.setState((state) => ({
    notes: state.notes
      .filter((note) => note.id !== idA)
      .map((note) => (note.id === idB ? result.data : note)),
  }));
  const noteBElement = findElement<HTMLDivElement>(
    `div[data-id="${validatedId}"]`,
    sidebar,
  );
  if (noteBElement) noteBElement.remove();
  const noteElement = findElement<HTMLDivElement>(
    `.note-item[data-id="${result.data.id}"]`,
    sidebar,
  );
  if (noteElement) setActiveItem(noteElement, sidebar);
  stateStore.setState({ activeId: result.data.id });
  handleViewNote(result.data);
}

export { handleMergeNotes };
