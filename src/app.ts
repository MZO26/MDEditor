import { initListeners } from "@/api/listeners";
import { initEditor } from "@/components/editor/editor-init";
import { initInfoSidebar } from "@/components/sidebar/info-sidebar-init";
import { reloadNoteList } from "@/components/sidebar/sidebar-actions";
import { initSearchHandlers } from "@/components/sidebar/sidebar-filter-init";
import { initNotesSidebar } from "@/components/sidebar/sidebar-init";
import { initHoverbar } from "@/components/toolbar/hoverbar-builder";
import {
  buildMenu,
  setupToolbarListeners,
} from "@/components/toolbar/menu-builder";
import { setGlobalEditor } from "@/services/state";
import { initAppSettings } from "@/settings/setting-init";
import { updateDateTime } from "@/utils/date";
import { getElement } from "@/utils/helpers";
import { renderIcons } from "@/utils/icons";
import tippy, { delegate } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { topToolbarActions } from "./components/toolbar/hoverbar-actions";
import { ToolbarActions } from "./components/toolbar/toolbar-actions";
import { initGlobalShortcuts } from "./settings/shortcuts";

document.addEventListener("DOMContentLoaded", async () => {
  const editor = initEditor("#editor");
  initGlobalShortcuts();
  setGlobalEditor(editor);
  initAppSettings();
  initListeners();
  renderIcons();
  await reloadNoteList();
  initInfoSidebar();
  updateDateTime();
  const toolbarContainer = getElement("#toolbar");
  buildMenu(toolbarContainer, editor, "toolbar", ToolbarActions);
  setupToolbarListeners(toolbarContainer, ToolbarActions, editor);
  initNotesSidebar();
  const hoverbar = getElement(".top-toolbar");
  buildMenu(hoverbar, editor, "toolbar", topToolbarActions);
  setupToolbarListeners(hoverbar, topToolbarActions, editor);
  initHoverbar();
  initSearchHandlers();
  tippy("[data-tippy-content]", {
    placement: "top",
    theme: "app-theme",
  });

  delegate(".notes-container", {
    target: "[tippy-content]",
    theme: "app-theme",
    content: (reference) =>
      reference.getAttribute("tippy-content") || "options",
  });
});

setInterval(updateDateTime, 60000);
