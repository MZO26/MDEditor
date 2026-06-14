import db from "@electron/db/database";
import { getFilePath, resolveMirrorPath } from "@electron/fs/fs-mirror";
import { validation } from "@electron/ipc/ipc-validation";
import { store } from "@electron/store";
import { AppErrorCode } from "@shared/errors";
import { IdSchema } from "@shared/schemas/note-schema";
import type { NoteMenuPayload } from "@shared/types";
import { ipcMain, Menu, type BrowserWindow } from "electron";
import fs from "fs";
import { AppBackendError } from "./ipc/ipc-error-handler";

let activeId: string | null = null;

ipcMain.on("note:set-active", (_e, id: string | null) => {
  activeId = id;
});

async function isMirrored(id: string) {
  const validatedData = validation(IdSchema, id);
  const note = db.getById(validatedData);
  const enabled = store.get("mirror-mode") ?? false;
  if (!enabled) return false;
  const targetDir = (enabled && store.get("mirror-path")) ?? null;
  if (!targetDir) return false;
  const mirrorPath = resolveMirrorPath(targetDir);
  const absoluteFilePath = getFilePath(mirrorPath, {
    fileName: note.title,
    id: note.id,
    extension: "md",
  }).absoluteFilePath;
  try {
    if (!!absoluteFilePath && fs.readFileSync(absoluteFilePath)) {
      console.log("[isMirrored]: This note is mirrored.");
      return true;
    }
    console.log("[isMirrored]: This note is not mirrored yet.");
    return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    console.error("[isMirrored]: Failed to detect if note is mirrored:", error);
    throw new AppBackendError(AppErrorCode.UnknownError);
  }
}

async function setUpEditorMenu(win: BrowserWindow) {
  const { default: contextMenu } = await import("electron-context-menu");
  contextMenu({
    window: win,
    shouldShowMenu: (_event, params) =>
      params.isEditable || params.mediaType === "image" || !!params.linkURL,
    menu: (defaultActions) => [
      defaultActions.cut({}),
      defaultActions.copy({}),
      defaultActions.paste({}),
      defaultActions.separator(),
      defaultActions.searchWithGoogle({}),
      defaultActions.lookUpSelection({}),
      defaultActions.separator(),
      defaultActions.selectAll({}),
      defaultActions.separator(),
      defaultActions.copyImage({}),
      defaultActions.copyImageAddress({}),
      defaultActions.copyLink({}),
    ],
  });
}
function setUpTableMenu(win: BrowserWindow) {
  const tableMenu = Menu.buildFromTemplate([
    {
      label: "Add Row Before",
      click: () => win.webContents.send("trigger:table-action", "addRowBefore"),
    },
    {
      label: "Add Row After",
      click: () => win.webContents.send("trigger:table-action", "addRowAfter"),
    },
    { type: "separator" },
    {
      label: "Add Column Before",
      click: () =>
        win.webContents.send("trigger:table-action", "addColumnBefore"),
    },
    {
      label: "Add Column After",
      click: () =>
        win.webContents.send("trigger:table-action", "addColumnAfter"),
    },
    { type: "separator" },
    {
      label: "Delete Row",
      click: () => win.webContents.send("trigger:table-action", "deleteRow"),
    },
    {
      label: "Delete Column",
      click: () => win.webContents.send("trigger:table-action", "deleteColumn"),
    },
    {
      label: "Delete Table",
      click: () => win.webContents.send("trigger:table-action", "deleteTable"),
    },
  ]);
  return tableMenu;
}

function setUpNoteMenu(win: BrowserWindow, payload: NoteMenuPayload) {
  const { id, pinned, bookmarked } = payload;
  const noteItemMenu = Menu.buildFromTemplate([
    {
      label: "Copy...",
      submenu: [
        {
          label: "Copy Note Link",
          click: () => win.webContents.send("note:trigger-id", id),
        },
        {
          label: "Copy Markdown",
          click: () => win.webContents.send("note:trigger-copy-markdown", id),
        },
        {
          label: "Copy File Path",
          enabled: activeId !== null && activeId === id,
          click: async () => {
            const mirrored = (await isMirrored(id)) ? true : false;
            if (!mirrored) {
              console.log("Note is not mirrored.");
            }
            win.webContents.send("note:trigger-copy-path", id);
          },
        },
      ],
    },
    { type: "separator" },
    {
      label: pinned ? "Unpin Note" : "Pin to Top",
      click: () => win.webContents.send("note:trigger-pin", id),
    },
    {
      label: bookmarked ? "Remove Bookmark" : "Add Bookmark",
      click: () => win.webContents.send("note:trigger-bookmark", id),
    },
    {
      label: "Duplicate Note",
      click: () => win.webContents.send("note:trigger-duplicate", id),
    },
    { type: "separator" },
    {
      label: "Export Note as...",
      submenu: [
        {
          label: "Markdown (.md)",
          click: () => win.webContents.send("note:trigger-export", id, "md"),
        },
        {
          label: "HTML (.html)",
          click: () => win.webContents.send("note:trigger-export", id, "html"),
        },
        {
          label: "JSON Document (.json)",
          click: () => win.webContents.send("note:trigger-export", id, "json"),
        },
        {
          label: "Plain Text (.txt)",
          click: () => win.webContents.send("note:trigger-export", id, "txt"),
        },
        {
          label: "PDF (.pdf)",
          click: () => win.webContents.send("note:trigger-export", id, "pdf"),
        },
      ],
    },
    {
      label: "Open File Path",
      enabled: activeId !== null && activeId === id,
      click: async () => {
        const mirrored = (await isMirrored(id)) ? true : false;
        if (!mirrored) {
          console.log("Note is not mirrored.");
        }
        win.webContents.send("note:trigger-path", id);
      },
    },
    {
      label: "View in Editor",
      enabled: activeId !== null && activeId === id,
      click: async () => {
        const mirrored = (await isMirrored(id)) ? true : false;
        if (!mirrored) {
          console.log("Note is not mirrored.");
        }
        win.webContents.send("note:trigger-view", id);
      },
    },
    { type: "separator" },
    {
      label: "Delete Note",
      click: () => win.webContents.send("note:trigger-delete", id),
    },
  ]);
  return noteItemMenu;
}

export { setUpEditorMenu, setUpNoteMenu, setUpTableMenu };
