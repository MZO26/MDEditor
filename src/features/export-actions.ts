import { getAll } from "@/api/api";
import { getNoteEditorExtensions } from "@/components/editor/editor-init";
import { AppErrorCode } from "@shared/constants";
import type { ExportedContent, ExportFormat, Result } from "@shared/types";
import { Editor } from "@tiptap/core";

async function getExportContent(
  extension: ExportFormat,
): Promise<Result<ExportedContent[]>> {
  try {
    const result = await getAll();
    if (!result.success) {
      return { success: false, error: result.error };
    }
    const notes = result.data;
    const data: ExportedContent[] = [];
    if (extension === "json" || extension === "txt") {
      const isJson = extension === "json";
      for (const note of notes) {
        data.push({
          id: note.id,
          fileName: note.title,
          content: isJson
            ? JSON.stringify(note.content, null, 2)
            : (note.plainText ?? ""),
          extension,
        });
      }
      return { success: true, data };
    }
    const headlessEditor = new Editor({
      extensions: getNoteEditorExtensions(),
    });
    try {
      const markdown = extension === "md";
      for (const note of notes) {
        headlessEditor.commands.setContent(note.content);
        data.push({
          id: note.id,
          fileName: note.title,
          content: markdown
            ? headlessEditor.getMarkdown()
            : headlessEditor.getHTML(),
          extension,
        });
      }
      return { success: true, data };
    } finally {
      headlessEditor.destroy();
    }
  } catch (error) {
    return {
      success: false,
      error: AppErrorCode.UnknownError,
    };
  }
}

export { getExportContent };
