import { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";

function handleTableDelete(editor: Editor) {
  const { selection } = editor.state;
  if (selection instanceof CellSelection) {
    const isWholeTableSelected =
      selection.isRowSelection?.() && selection.isColSelection?.();
    if (!isWholeTableSelected) {
      if (selection.isRowSelection?.()) {
        return editor.chain().focus().deleteRow().run();
      }
      if (selection.isColSelection?.()) {
        return editor.chain().focus().deleteColumn().run();
      }
    }
  }
  if (editor.isActive("table")) {
    return editor.chain().focus().deleteTable().run();
  } else return;
}

function duplicateCodeBlock(editor: Editor) {
  const { state, view } = editor;
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "codeBlock") {
      const insertPos = $from.after(depth);
      const clonedNode = node.copy(node.content);
      const tr = state.tr.insert(insertPos, clonedNode);
      view.dispatch(tr);
      return true;
    }
  }
  return false;
}

export { duplicateCodeBlock, handleTableDelete };
