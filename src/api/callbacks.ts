import {
  bookmark,
  exportNote,
  getNoteById,
  getSyncPath,
  openSyncFolder,
  openSyncPath,
  pin,
  showNotification,
} from "@/api/api";
import { getExportContent } from "@/notes/export-actions";
import {
  debouncedSaveNote,
  handleDeleteNote,
  handleSaveNote,
} from "@/notes/note-actions";
import { handleConflict, isMirrorEnabled } from "@/notes/note-conflict";
import { handleDuplicateNote } from "@/notes/note-duplicate";
import { noteStore, settingsStore, stateStore } from "@/settings/app-state";
import { initDeleteDialog } from "@/settings/dialog-init";
import { findElement } from "@/utils/dom";
import { getAppItem } from "@/utils/registry";
import { ERROR_MESSAGES } from "@shared/errors";
import type { NoteMenuPayload } from "@shared/types";

//----------------------------------------------------------

// helper functions for callbacks

const { deleteDialog } = initDeleteDialog();

async function ensureNoteSaved(id: string) {
  const note = noteStore.get("notes").find((n) => n.id === id);
  const activeId = stateStore.get("activeId");
  if (!note || activeId !== note.id) return;
  const editor = getAppItem("editor");
  const syncPayload = {
    id: note.id,
    fileName: note.title,
    extension: "md" as const,
    updated_at: note.updated_at,
  };
  debouncedSaveNote.cancel();
  await handleSaveNote(note.id, editor.getJSON(), editor.getMarkdown());
  return syncPayload;
}

//----------------------------------------------------------

// electron callbacks that only get registered once at startup. Thus no need for assignment of cleanups
function initListeners() {
  window.storeAPI.onSettingsChanged((settings) => {
    settingsStore.setState(settings);
  });

  window.electronAPI.onTriggerTableAction((action) => {
    const editor = getAppItem("editor");
    const chain = editor.chain().focus();
    switch (action) {
      case "addRowBefore":
        chain.addRowBefore().run();
        break;
      case "addRowAfter":
        chain.addRowAfter().run();
        break;
      case "addColumnBefore":
        chain.addColumnBefore().run();
        break;
      case "addColumnAfter":
        chain.addColumnAfter().run();
        break;
      case "deleteRow":
        chain.deleteRow().run();
        break;
      case "deleteColumn":
        chain.deleteColumn().run();
        break;
      case "deleteTable":
        chain.deleteTable().run();
        break;
    }
  });

  window.electronAPI.onTriggerNoteAction((payload: NoteMenuPayload) => {
    const noteElement = findElement<HTMLDivElement>(
      `.note-item[data-id="${payload.id}"]`,
      getAppItem("sidebar"),
    );
    if (!noteElement) return;
    if (payload.pinned !== undefined) {
      noteElement.dataset["pinned"] = String(payload.pinned);
    }
    if (payload.bookmarked !== undefined) {
      noteElement.dataset["bookmarked"] = String(payload.bookmarked);
    }
  });

  window.noteAPI.onTriggerExport(async (id: string, extension: string) => {
    const result = await getExportContent(id, extension);
    if (!result.success) {
      console.error(
        "[exportTrigger]: Failed to fetch note data:",
        result.error,
      );
      await showNotification("Export Failed.", ERROR_MESSAGES.EXPORT_ERROR);
      return;
    }
    const exported = await exportNote(result.data);
    if (!exported.success) {
      console.error("[exportTrigger]: Failed to write file:", exported.error);
      await showNotification(
        exported.error === "CANCELLED_OPERATION"
          ? "Cancelled Export"
          : "Export Failed.",
        "",
      );
      return;
    }
    await showNotification(
      "Export Successful.",
      `Successfully exported as .${extension.toUpperCase()}`,
    );
  });

  window.noteAPI.onTriggerView(async (id: string) => {
    const syncPayload = await ensureNoteSaved(id);
    if (!syncPayload) return;
    const result = await openSyncPath(syncPayload);
    if (!result.success || result.data === false) {
      await showNotification(
        "Could not open note in editor.",
        "Start editing the note to initialize file mirror.",
      );
      return;
    }
  });

  window.noteAPI.onTriggerPath(async (id: string) => {
    const syncPayload = await ensureNoteSaved(id);
    if (!syncPayload) return;
    const result = await openSyncFolder(syncPayload);
    if (!result.success || result.data === false) {
      await showNotification(
        "Could not open note path.",
        "Start editing the note to initialize file mirror.",
      );
      return;
    }
  });

  window.noteAPI.onTriggerCopyPath(async (id: string) => {
    const syncPayload = await ensureNoteSaved(id);
    if (!syncPayload) return;
    const result = await getSyncPath(syncPayload);
    if (!result.success) {
      console.error(
        "[onTriggerCopyPath]: Failed to retrieve file path:",
        result.error,
      );
      await showNotification("Failed to retrieve file path.", "");
      return;
    }
    if (!result.data) {
      console.warn("[onTriggerCopyPath]: File path was empty.");
      await showNotification("No file path to copy.", "");
      return;
    }
    try {
      await navigator.clipboard.writeText(result.data);
      await showNotification("Copied to clipboard.", "");
    } catch (error) {
      await showNotification("Failed to copy to clipboard.", "");
      console.error("[onTriggerCopyPath]: Failed to copy file path:", error);
    }
  });

  window.noteAPI.onTriggerCopyMarkdown(async (id: string) => {
    const result = await getExportContent(id, "md");
    if (!result.success) {
      console.error(
        "[onTriggerCopyMarkdown]: Failed to fetch note data:",
        result.error,
      );
      await showNotification("Failed to get Markdown.", "");
      return;
    }
    const markdown = result.data.content;
    try {
      await navigator.clipboard.writeText(markdown);
      await showNotification("Copied to clipboard.", "");
    } catch (error) {
      await showNotification("Failed to copy to clipboard.", "");
      console.error("[onTriggerCopyMarkdown]: Failed to copy markdown:", error);
    }
  });

  window.noteAPI.onTriggerDelete(async (id: string) => {
    const confirmationEnabled =
      settingsStore.get("delete-confirmation") === true;
    const executeDelete = async () => {
      const noteElement = findElement<HTMLDivElement>(
        `.note-item[data-id="${id}"]`,
        getAppItem("sidebar"),
      );
      if (!noteElement) return;
      await handleDeleteNote(id);
    };
    if (!confirmationEnabled) {
      await executeDelete();
      return;
    }
    const handleClose = async () => {
      if (deleteDialog.returnValue !== "confirm") return;
      await executeDelete();
    };
    deleteDialog.addEventListener("close", handleClose, { once: true });
    deleteDialog.returnValue = "";
    deleteDialog.showModal();
  });

  window.noteAPI.onTriggerId(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      await showNotification("Copied to clipboard.", "");
    } catch (error) {
      await showNotification("Failed to copy to clipboard.", "");
      console.error("[onTriggerId]: Failed to copy text: ", error);
    }
  });

  window.noteAPI.onTriggerPin(async (id: string) => {
    const result = await pin(id);
    if (!result.success) {
      console.error("[onTriggerPin]: Failed to toggle pin:", result.error);
      return;
    }
    noteStore.setState((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, pinned: result.data } : note,
      ),
      sidebarChange: { type: "reload" },
    }));
  });

  window.noteAPI.onTriggerBookmark(async (id: string) => {
    const result = await bookmark(id);
    if (!result.success) {
      console.error(
        "[onTriggerBookmark]: Failed to toggle bookmark:",
        result.error,
      );
      return;
    }
    noteStore.setState((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, bookmarked: result.data } : note,
      ),
      sidebarChange: { type: "reload" },
    }));
  });

  window.noteAPI.onTriggerDuplicate(async (id: string) => {
    const result = await getNoteById(id);
    if (!result.success) {
      console.error(
        "[onTriggerDuplicate]: Failed to fetch note for duplication:",
        result.error,
      );
      return;
    }
    await handleDuplicateNote(result.data).catch((error: Error) =>
      console.error(
        "[onTriggerDuplicate -> handleDuplicateNote]: Error duplicating Note",
        error,
      ),
    );
  });

  window.electronAPI.onThemeChanged(async (resolvedTheme) => {
    document.documentElement.dataset["theme"] = resolvedTheme;
  });

  window.electronAPI.onRequestFlush(async () => {
    debouncedSaveNote.flush();
    window.electronAPI.confirmFlush();
  });

  window.electronAPI.onFocus(async () => {
    const activeId = stateStore.get("activeId");
    const note = noteStore.get("activeNote");
    if (!activeId || !note) return;
    const editor = getAppItem("editor");
    stateStore.setState({ lastSyncedAt: 0 });
    if (isMirrorEnabled() && activeId && note) {
      console.log("[onFocus]: Forcing JIT Sync...");
      const markdown = editor.getMarkdown();
      await handleConflict(note, markdown).catch((error: Error) => {
        console.error("[onFocus]: Sync failed", error);
      });
    }
  });

  window.electronAPI.onSystemResume(async () => {
    const activeId = stateStore.get("activeId");
    const note = noteStore.get("activeNote");
    if (!activeId || !note) return;
    const editor = getAppItem("editor");
    stateStore.setState({ lastSyncedAt: 0 });
    if (isMirrorEnabled() && activeId && note) {
      console.log("[onSystemResume]: Forcing JIT Sync...");
      const markdown = editor.getMarkdown();
      await handleConflict(note, markdown).catch((error: Error) => {
        console.error("[onSystemResume]: Sync failed", error);
      });
    }
  });
}

export { initListeners };
