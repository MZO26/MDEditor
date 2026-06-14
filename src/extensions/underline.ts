import { markInputRule, markPasteRule } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";

const CustomUnderline = Underline.extend({
  addInputRules() {
    return [
      markInputRule({
        find: /(?:\+\+)((?:[^+\n]+))(?:\+\+)$/,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:\+\+)((?:[^+\n]+))(?:\+\+)/g,
        type: this.type,
      }),
    ];
  },
});

export { CustomUnderline };
