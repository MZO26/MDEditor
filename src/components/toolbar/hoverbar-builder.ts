import { setTheme } from "@/api/electronAPI";
import { editor } from "@/components/editor/editor-init";
import {
  createAsyncHandler,
  getElement,
  registerAppEvents,
} from "@/utils/helpers";
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
  focusBtn.addEventListener("click", handleToggleFocus);
  readOnlyBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    editor?.setEditable(!editor.isEditable);
  });
  editorWidthBtn.addEventListener("click", () => setEditorWidth(editorEl));
  registerAppEvents(document, {
    "app:set-editor-width": () => setEditorWidth(editorEl),
    "app:toggle-read-only": () => editor?.setEditable(!editor.isEditable),
    "app:toggle-focus-mode": (event) => handleToggleFocus(event),
    "app:escape": (event) => {
      if (appContainer.classList.contains("focus")) {
        handleToggleFocus(event);
      }
    },
  });
}

export { initFocusMode, initHoverbar, setEditorWidth };
