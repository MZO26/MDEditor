import {
  duplicateCodeBlock,
  handleTableDelete,
} from "@/components/toolbar/custom-actions";
import type { ActionMap } from "@shared/types";
import type { Editor } from "@tiptap/core";

const BubbleMenuActions: ActionMap<Editor> = {
  // text actions
  bold: {
    run: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
    icon: "bold",
    group: "text",
    shortcut: "Mod+B",
  },
  italic: {
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
    icon: "italic",
    group: "text",
    shortcut: "MOD+I",
  },
  strike: {
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive("strike"),
    icon: "strikethrough",
    group: "text",
    shortcut: "MOD+Shift+X",
  },
  highlight: {
    run: (editor) => editor.chain().focus().toggleHighlight().run(),
    isActive: (editor) => editor.isActive("highlight"),
    icon: "highlighter",
    group: "text",
    shortcut: "MOD+Shift+H",
  },
  divider1: { type: "divider" },
  h1: {
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    icon: "heading-1",
    group: "text",
    shortcut: "MOD+Alt+1",
  },
  h2: {
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    icon: "heading-2",
    group: "text",
    shortcut: "MOD+Alt+2",
  },
  h3: {
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    icon: "heading-3",
    group: "text",
    shortcut: "MOD+Alt+3",
  },
  divider2: { type: "divider" },
  link: {
    run: (editor) => editor.chain().focus().toggleLink().run(),
    icon: "link",
    group: "text",
    shortcut: "MOD+K",
  },
  // table actions
  addRowAfter: {
    run: (editor) => editor.chain().focus().addRowAfter().run(),
    icon: "between-vertical-end",
    group: "table",
    shortcut: "Mod-Alt-ArrowDown",
  },
  addColumnAfter: {
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
    icon: "between-horizontal-end",
    group: "table",
    shortcut: "Mod-Alt-ArrowRight",
  },
  addRowBefore: {
    run: (editor) => editor.chain().focus().addRowBefore().run(),
    icon: "between-vertical-start",
    group: "table",
    shortcut: "Mod-Alt-ArrowUp",
  },
  addColumnBefore: {
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
    icon: "between-horizontal-start",
    group: "table",
    shortcut: "Mod-Alt-ArrowLeft",
  },
  divider3: { type: "divider" },
  deleteSelection: {
    run: (editor) => handleTableDelete(editor),
    icon: "trash-2",
    group: "table",
    shortcut: "Mod-Alt-Backspace",
  },
  duplicate: {
    run: (editor) => duplicateCodeBlock(editor),
    icon: "repeat",
    group: "codeBlock",
    shortcut: "Shift+Alt+ArrowDown",
  },
};

export { BubbleMenuActions };
