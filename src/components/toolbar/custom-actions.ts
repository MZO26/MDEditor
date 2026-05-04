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

export { handleTableDelete };
