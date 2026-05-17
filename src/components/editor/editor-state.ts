import { stateStore } from "@/settings/app-state";
import { requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";

function handleEditorEmptyState() {
  const editorContainer = requireElement(".editor-container");
  const editorView = requireElement(".editor-view");
  const emptyState = editorContainer.querySelector(".editor-empty-state");
  const { activeId } = stateStore.getState();
  if (!activeId) {
    editorView.classList.add("hidden");
    if (!emptyState) {
      editorContainer.appendChild(editorEmptyState);
    }
  } else {
    editorView.classList.remove("hidden");
    if (emptyState) {
      emptyState.remove();
    }
  }
}

const template = requireElement<HTMLTemplateElement>(
  "#editor-empty-state-template",
);

const editorEmptyState = template.content.firstElementChild as HTMLDivElement;

function createEditorEmptyState() {
  const emptyState = editorEmptyState.cloneNode(true) as HTMLDivElement;
  renderIcons(emptyState);
  return emptyState;
}

export { createEditorEmptyState, handleEditorEmptyState };
