import { initListeners } from "@/api/callbacks";
import { setupEditorListeners } from "@/components/editor/editor-init";
import { initInfoSidebar } from "@/components/sidebar/info-sidebar-init";
import { reloadNoteList } from "@/components/sidebar/sidebar-actions";
import { initNotesSidebar } from "@/components/sidebar/sidebar-init";
import { topToolbarActions } from "@/components/toolbar/hoverbar-actions";
import { initHoverbar } from "@/components/toolbar/hoverbar-init";
import {
  buildMenu,
  setupToolbarListeners,
} from "@/components/toolbar/menu-builder";
import { ToolbarActions } from "@/components/toolbar/toolbar-actions";
import { loadSettings } from "@/settings/app-state";
import { initAppSettings } from "@/settings/setting-init";
import { initGlobalShortcuts } from "@/settings/shortcuts";
import { startAppClock } from "@/utils/date";
import { requireElement } from "@/utils/dom";
import { renderIcons } from "@/utils/icons";
import {
  getAppItem,
  initializeCoreRegistry,
  initializeTemplateRegistry,
} from "@/utils/registry";
import { initTippyDelegate } from "@/utils/ui";
import { handleEditorEmptyState } from "./components/editor/editor-state";
import { handleSidebarEmptyState } from "./components/sidebar/sidebar-state";

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await loadSettings();
  initializeCoreRegistry(settings);
  initializeTemplateRegistry();
  setupEditorListeners(getAppItem("editorWrapper"), getAppItem("editor"));
  initGlobalShortcuts();
  initAppSettings(settings);
  initListeners();
  initNotesSidebar();
  initInfoSidebar();
  await reloadNoteList();
  handleSidebarEmptyState();
  handleEditorEmptyState();
  const toolbarContainer = requireElement<HTMLDivElement>(
    "#toolbar",
    getAppItem("editorContainer"),
  );
  buildMenu(toolbarContainer, ToolbarActions);
  setupToolbarListeners(toolbarContainer, ToolbarActions);
  const hoverbar = requireElement<HTMLDivElement>(".top-toolbar");
  buildMenu(hoverbar, topToolbarActions);
  setupToolbarListeners(hoverbar, topToolbarActions);
  initHoverbar();
  renderIcons();
  startAppClock();
  initTippyDelegate(hoverbar);
  initTippyDelegate(getAppItem("editorContainer"));
  requestAnimationFrame(() => {
    window.electronAPI.startupReady();
  });
});
