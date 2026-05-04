import {
  initFocusMode,
  setEditorWidth,
} from "@/components/toolbar/hoverbar-builder";
import type { ActionMap } from "@shared/types";
import { type Editor } from "@tiptap/core";

const topToolbarActions: ActionMap<any> = {
  readOnly: {
    type: "action",
    run: (editor: Editor) => editor?.setEditable(!editor.isEditable),
    icon: "glasses",
    shortcut: "MOD+Shift+R",
  },
  focus: {
    type: "action",
    run: (appContainer: HTMLDivElement) => initFocusMode(appContainer),
    icon: "focus",
    shortcut: "F11",
  },
  editorWidth: {
    type: "action",
    run: (editorEl: HTMLDivElement) => setEditorWidth(editorEl),
    icon: "ruler-dimension-line",
    shortcut: "MOD+Shift+W",
  },
};

export { topToolbarActions };
