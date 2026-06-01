import { requireElement } from "@/utils/dom";
import { initTippyDelegate } from "@/utils/ui";

function initDeleteDialog() {
  const deleteDialog = requireElement<HTMLDialogElement>("#delete-dialog");
  initTippyDelegate(deleteDialog, deleteDialog);
  return { deleteDialog };
}

function initConflictDialog() {
  const conflictDialog = requireElement<HTMLDialogElement>("#conflict-dialog");
  initTippyDelegate(conflictDialog, conflictDialog);
  return { conflictDialog };
}

function initSettingsDialog() {
  const settingsDialog = requireElement<HTMLDialogElement>(".settings-modal");
  const settingsContainer = requireElement<HTMLDivElement>(".settings-content");
  initTippyDelegate(settingsDialog, settingsDialog);
  return { settingsDialog, settingsContainer };
}

export { initConflictDialog, initDeleteDialog, initSettingsDialog };
