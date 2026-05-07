import {
  initFocusMode,
  setEditorWidth,
} from "@/components/toolbar/hoverbar-init";
import { getAppItem } from "@/utils/registry";
import type { ActionMap } from "@shared/types";
import { type Editor } from "@tiptap/core";

const topToolbarActions: ActionMap<Editor> = {
  readOnly: {
    type: "action",
    run: (editor: Editor) => editor?.setEditable(!editor.isEditable),
    icon: "glasses",
    shortcut: "MOD+Shift+R",
  },
  focus: {
    type: "action",
    run: () => initFocusMode(),
    icon: "focus",
    shortcut: "F11",
  },
  editorWidth: {
    type: "action",
    run: () => {
      const appContainer = getAppItem("appContainer");
      setEditorWidth(appContainer);
    },
    icon: "ruler-dimension-line",
    shortcut: "MOD+Shift+W",
  },
};

export { topToolbarActions };
