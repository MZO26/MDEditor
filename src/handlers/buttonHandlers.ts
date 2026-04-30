import { bookmark, createNote, deleteNote, pin } from "@/api/noteAPI";
import { editor } from "@/components/editor/editor";
import { handleEditorEmptyState } from "@/components/editor/editorEmptyState";
import {
  addOneNoteToList,
  handleSidebarEmptyState,
  reloadNoteList,
} from "@/components/sidebar/sidebarNotes";
import { viewNote } from "@/handlers/noteHandlers";
import { getValue, removeValue, StorageKeys } from "@/services/cache";
import { createNotePayload } from "@/utils/factory";
import { getElement, setActiveItem } from "@/utils/helpers";
import { showToast } from "@/utils/toast";

async function addNoteBtnHandler() {
  const container = getElement<HTMLDivElement>(".notes-container");
  const activeID = getValue(StorageKeys.NOTE_ID);
  if (activeID) removeValue(StorageKeys.NOTE_ID);
  const payload = createNotePayload();
  const response = await createNote(payload);
  showToast("New note created!");
  if (!response.success) {
    showToast(response.message);
    return;
  }
  if (editor) {
    const noteElement = addOneNoteToList(response.data, container);
    handleEditorEmptyState(response.data.id);
    if (noteElement) setActiveItem(noteElement, container);
    viewNote(response.data, editor);
  }
}

async function executeNoteDeletion(id: string, noteElement: HTMLDivElement) {
  const response = await deleteNote(id);
  if (!response.success) {
    showToast(response.message);
    return;
  }
  noteElement.remove();
  const noteID = getValue(StorageKeys.NOTE_ID);
  if (noteID === id) {
    removeValue(StorageKeys.NOTE_ID);
    editor?.commands.clearContent();
  }
}

const unsubscribeDelete = window.noteAPI.onTriggerDelete(async (id: string) => {
  const noteElement = document.querySelector<HTMLDivElement>(
    `.noteItem[data-id="${id}"]`,
  );
  console.log("Found DOM Element:", noteElement);
  if (!noteElement) return;
  await executeNoteDeletion(id, noteElement);
});

const unsubscribePin = window.noteAPI.onTriggerPin(async (id: string) => {
  const response = await pin(id);
  if (!response.success) {
    showToast(response.message);
    return;
  }
  response.data === true
    ? showToast("Pinned note")
    : showToast("Unpinned note");
  await reloadNoteList();
});

const unsubscribeBookmark = window.noteAPI.onTriggerBookmark(
  async (id: string) => {
    const response = await bookmark(id);
    if (!response.success) {
      showToast(response.message);
      return;
    }
    response.data === true
      ? showToast("Bookmarked note")
      : showToast("Removed bookmark");
    await reloadNoteList();
  },
);

window.addEventListener("beforeunload", () => {
  unsubscribePin();
  unsubscribeDelete();
  unsubscribeBookmark();
});

async function deleteBtnHandler(
  deleteBtn: HTMLButtonElement,
  container: HTMLDivElement,
) {
  const noteElement = deleteBtn.closest<HTMLDivElement>(".noteItem");
  const id = noteElement?.dataset["id"];
  if (!id) return;
  await executeNoteDeletion(id, noteElement);
  handleSidebarEmptyState(container);
  handleEditorEmptyState();
}

function closeModal() {
  const overlay = getElement<HTMLDivElement>(".overlay");
  const modal = getElement<HTMLDivElement>(".modal");
  overlay.classList.remove("show");
  modal.classList.remove("show");
}

// function openModal(): void {
//   const overlay = getElement<HTMLDivElement>(".overlay");
//   const modal = getElement<HTMLDivElement>(".modal");
//   const items: HTMLCollection | undefined =
//     getElement<HTMLDivElement>(".notes-container").children;
//   overlay.classList.add("show");
//   modal.classList.add("show");
//   if (items) {
//     Array.from(items).forEach((element) => {
//       if (element.classList.contains("active"))
//         element.classList.remove("active");
//     });
//   }
// }

export { addNoteBtnHandler, closeModal, deleteBtnHandler };
