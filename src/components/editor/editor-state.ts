import { stateStore } from "@/settings/app-state";
import { findElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import { getAppItem, getTemplateItem } from "@/utils/registry";

function handleEditorEmptyState() {
  const editorContainer = getAppItem("editorContainer");
  const editorView = getTemplateItem("editorView");
  const { activeId } = stateStore.getState();
  const showEmptyState = !activeId;
  editorView.classList.toggle("hidden", showEmptyState);
  const existingEmptyState = findElement<HTMLDivElement>(
    ".editor-empty-state",
    editorContainer,
  );
  if (showEmptyState) {
    if (!existingEmptyState) {
      const newEmptyState = createEditorEmptyState();
      editorContainer.appendChild(newEmptyState);
    }
  } else {
    if (existingEmptyState) {
      existingEmptyState.remove();
    }
  }
}

function createEditorEmptyState() {
  const template = getTemplateItem("editorEmptyStateTemplate");
  const emptyState = template.content.firstElementChild?.cloneNode(
    true,
  ) as HTMLDivElement;
  renderIcons(emptyState);
  return emptyState;
}

export { createEditorEmptyState, handleEditorEmptyState };
