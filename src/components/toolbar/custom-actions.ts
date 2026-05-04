import { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";

function handleTableDelete(editor: Editor): boolean {
  const { selection } = editor.state;
  if (!(selection instanceof CellSelection)) {
    return false;
  }
  const isRow = selection.isRowSelection();
  const isCol = selection.isColSelection();
  const isWholeTableSelected = isRow && isCol;
  if (isWholeTableSelected) {
    return editor.chain().focus().deleteTable().run();
  }
  if (isRow) {
    return editor.chain().focus().deleteRow().run();
  }
  if (isCol) {
    return editor.chain().focus().deleteColumn().run();
  }
  return false;
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
