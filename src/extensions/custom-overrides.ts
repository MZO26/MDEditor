import { TableCell, TableHeader } from "@tiptap/extension-table";

const CustomTableCell = TableCell.extend({
  content: "inline*",
});

const CustomTableHeader = TableHeader.extend({
  content: "inline*",
});

export { CustomTableCell, CustomTableHeader };
