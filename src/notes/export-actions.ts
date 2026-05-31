import { getAll } from "@/api/api";
import { getNoteEditorExtensions } from "@/components/editor/editor-init";
import { noteStore } from "@/settings/app-state";
import { sleep } from "@/utils/async";
import { getAppItem } from "@/utils/registry";
import {
  BATCH_SIZE,
  DOMPURIFY_CONFIG,
  UNTITLED,
  YIELD_INTERVAL,
} from "@shared/constants";
import { AppErrorCode } from "@shared/errors";
import { titleGenerator } from "@shared/generators";
import type { ExportRequest } from "@shared/schemas/export-schema";
import type { ExportedContent, ExportFormat, Result } from "@shared/types";
import { Editor } from "@tiptap/core";
import DOMPurify from "dompurify";

// gets called in frontend because headless editor is needed to convert content to markdown or html

// batch export function triggered by file backup setting

async function getBatchExportContent(
  extension: ExportFormat,
): Promise<Result<ExportedContent[]>> {
  const result = await getAll();
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const notes = result.data;
  const processedPayloads: ExportedContent[] = [];
  if (extension === "json" || extension === "txt") {
    try {
      const isJson = extension === "json";
      for (const note of notes) {
        processedPayloads.push({
          id: note.id,
          fileName: note.title,
          content: isJson
            ? JSON.stringify(note.content, null, 2)
            : (note.plainText ?? ""),
          extension,
        });
      }
      return { success: true, data: processedPayloads };
    } catch (error) {
      console.error(
        "[getBatchExportContent]: Failed converting data for batch export (JSON / TXT): ",
        error,
      );
      return { success: false, error: AppErrorCode.InvalidData };
    }
  }
  const headlessEditor = new Editor({
    extensions: getNoteEditorExtensions(),
  });

  const markdown = extension === "md";
  try {
    let i = 0;
    for (const note of notes) {
      if (i > 0 && i % BATCH_SIZE === 0) {
        await sleep(YIELD_INTERVAL); // prevent ui stuttering
      }
      headlessEditor.commands.setContent(note.content);
      processedPayloads.push({
        id: note.id,
        fileName: note.title,
        content: markdown
          ? headlessEditor.getMarkdown()
          : DOMPurify.sanitize(headlessEditor.getHTML(), DOMPURIFY_CONFIG),
        extension,
      });
      i++;
    }
    return { success: true, data: processedPayloads };
  } catch (error) {
    console.error(
      "[getBatchExportContent]: Failed converting data for batch export (MD / HTML):",
      error,
    );
    return { success: false, error: AppErrorCode.InvalidData };
  } finally {
    headlessEditor.destroy();
  }
}

//------------------------------------------------------------

// single export content function triggered by callback on note menu interaction

function getExportContent(
  id: string,
  extension: string,
): Result<ExportRequest> {
  const editor = getAppItem("editor");
  try {
    let content: string;
    switch (extension) {
      case "json":
        content = JSON.stringify(editor.getJSON());
        break;
      case "html":
      case "pdf":
        content = DOMPurify.sanitize(editor.getHTML(), DOMPURIFY_CONFIG);
        break;
      case "md":
        content = editor.getMarkdown();
        break;
      case "txt":
        content = editor.getText();
        break;
      default:
        console.error(
          "[getExportContent]: Unsupported export format:",
          extension,
        );
        return {
          success: false,
          error: AppErrorCode.InvalidData,
        };
    }
    const payload: ExportRequest = {
      id,
      extension,
      fileName:
        noteStore
          .get("notes")
          .find((n) => n.id === id)
          ?.title.trim() ||
        titleGenerator(editor.getText()) ||
        UNTITLED,
      content,
    };
    return { success: true, data: payload };
  } catch (error) {
    console.error(
      "[getExportContent]: Failed converting data for single export:",
      error,
    );
    return { success: false, error: AppErrorCode.InvalidData };
  }
}

export { getBatchExportContent, getExportContent };
