import { handleCreateNote } from "@/features/note-actions";
import { stateStore } from "@/settings/app-state";
import { createAsyncHandler } from "@/utils/async";
import { findElement, requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { getAppItem } from "@/utils/registry";

function handleEditorEmptyState() {
  const editorContainer = getAppItem("editorContainer");
  const editorView = requireElement<HTMLDivElement>(
    ".editor-view",
    editorContainer,
  );
  let emptyState = findElement<HTMLDivElement>(
    ".editor-empty-state",
    editorContainer,
  );
  if (!emptyState) {
    emptyState = createEditorEmptyState();
    editorContainer.appendChild(emptyState);
  }
  const { activeId } = stateStore.getState();
  const showEmptyState = !activeId;
  editorView.classList.toggle("hidden", showEmptyState);
  emptyState.classList.toggle("hidden", !showEmptyState);
  emptyState.inert = !showEmptyState;
}

const template = requireElement<HTMLTemplateElement>(
  "#editor-empty-state-template",
);

const editorEmptyState = template.content.firstElementChild as HTMLDivElement;

function createEditorEmptyState() {
  const emptyState = editorEmptyState.cloneNode(true) as HTMLDivElement;
  renderIcons(emptyState);
  const handleClick = createAsyncHandler(async (e: Event) => {
    const target = e.target as HTMLElement;
    const addNoteBtn = target.closest<HTMLButtonElement>(
      ".empty-state-add-note-btn",
    );
    if (addNoteBtn) {
      await handleCreateNote();
    }
  });
  emptyState.addEventListener("click", handleClick);
  return emptyState;
}

export { createEditorEmptyState, handleEditorEmptyState };
