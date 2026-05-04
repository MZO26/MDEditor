import { setTheme } from "@/api/electronAPI";
import { editor } from "@/components/editor/editor-init";
import { createAsyncHandler, getElement } from "@/utils/helpers";
import type { Theme } from "@shared/schemas/store-schema";

const appContainer = getElement<HTMLDivElement>(".app-container");

async function initFocusMode(appContainer: HTMLDivElement) {
  const newState = !appContainer.classList.contains("focus");
  appContainer.classList.toggle("focus", newState);
  await setTheme(document.body.dataset["theme"] as Theme, newState);
}

function setEditorWidth(editorElement: HTMLDivElement) {
  const widths = ["comfortable", "normal", "wide"];
  const current = editorElement.dataset["width"] || "normal";
  const index = widths.indexOf(current as (typeof widths)[number]);
  const next = widths[(index + 1) % widths.length];
  editorElement.dataset["width"] = next;
}

const handleToggleFocus = createAsyncHandler(async () => {
  initFocusMode(appContainer);
});

function initHoverbar() {
  const focusBtn = getElement(".focus-btn");
  const editorEl = getElement<HTMLDivElement>("#editor");
  const readOnlyBtn = getElement(".readOnly-btn");
  const editorWidthBtn = getElement(".editorWidth-btn");
  const handleReadOnly = () => {
    editor?.setEditable(!editor.isEditable);
  };
  focusBtn.addEventListener("click", handleToggleFocus);
  document.addEventListener("app:toggle-focus-mode", handleToggleFocus);
  document.addEventListener("app:escape", (event) => {
    if (appContainer.classList.contains("focus")) {
      handleToggleFocus(event);
    }
  });
  readOnlyBtn.addEventListener("click", handleReadOnly);
  document.addEventListener("app:toggle-read-only", handleReadOnly);
  editorWidthBtn.addEventListener("click", () => {
    setEditorWidth(editorEl);
  });
  document.addEventListener("app:set-editor-width", () =>
    setEditorWidth(editorEl),
  );
}

export { initFocusMode, initHoverbar, setEditorWidth };
