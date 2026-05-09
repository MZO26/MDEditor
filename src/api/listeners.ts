import { exportNote } from "@/api/exportAPI";
import { bookmark, pin } from "@/api/noteAPI";
import { editor } from "@/components/editor/editor-init";
import { reloadNoteList } from "@/components/sidebar/sidebar-actions";
import { handleDeleteNote } from "@/features/note-actions";
import { cleanup } from "@/features/note-ui";
import { applyAppTheme } from "@/settings/theme-actions";
import { findElement } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import { showToast } from "@/utils/toast";
import { titleGenerator } from "@shared/generators/generators";
import type { EditorDoc } from "@shared/schemas/editor-schema";

function initListeners() {
  let lastAppliedTheme: string | null = null;

  window.exportAPI.onTriggerExport(async (extension) => {
    const editor = getAppItem("editor");
    const fileName = titleGenerator(editor.getText());
    let exportContent: string | EditorDoc;
    try {
      switch (extension) {
        case "json":
          exportContent = editor.getJSON();
          break;

        case "html":
          exportContent = editor.getHTML();
          break;

        case "md":
          exportContent = editor.getMarkdown();
          break;

        case "txt":
          exportContent = editor.getText();
          break;

        case "pdf":
          exportContent = editor.getHTML();
          break;

        default:
          showToast(`Unsupported export format: ${extension}`);
          return;
      }
    } catch (error) {
      showToast(`Export conversion failed ${error}`);
      return;
    }
    const response = await exportNote({
      content: exportContent,
      extension,
      fileName,
    });
    if (!response.success) {
      showToast(response.message);
      return;
    }
    showToast(`Exported Note as ${extension}-file`);
  });

  window.noteAPI.onTriggerDelete(async (id: string) => {
    const noteElement = findElement<HTMLDivElement>(
      `.noteItem[data-id="${id}"]`,
    );
    if (!noteElement) return;
    await handleDeleteNote(id, noteElement);
  });

  window.noteAPI.onTriggerPin(async (id: string) => {
    const response = await pin(id);
    if (!response.success) {
      showToast(response.message);
      return;
    }
    response.data === true
      ? showToast("Pinned note")
      : showToast("Unpinned note");
    await reloadNoteList();
  });

  window.noteAPI.onTriggerBookmark(async (id: string) => {
    const response = await bookmark(id);
    if (!response.success) {
      showToast(response.message);
      return;
    }
    response.data === true
      ? showToast("Bookmarked note")
      : showToast("Removed bookmark");
    await reloadNoteList();
  });

  window.electronAPI.onThemeChanged(async (newTheme) => {
    if (lastAppliedTheme === newTheme) return;
    lastAppliedTheme = newTheme;
    await applyAppTheme(newTheme, true);
  });

  window.electronAPI.onRequestFlush(async () => {
    if (editor) {
      const controller = cleanup.get(editor);
      if (controller) {
        await controller.flush();
      }
    }
    window.electronAPI.confirmFlush();
  });
}

export { initListeners };
