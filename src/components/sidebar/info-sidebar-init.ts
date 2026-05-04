import { getSettings } from "@/api/settingsAPI";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { getElement, registerAppEvents } from "@/utils/helpers";
import tippy from "tippy.js";

async function initInfoSidebar() {
  const response = await getSettings("info-sidebar-state");
  const collapsed = response.success ? response.data === true : false;
  const infoSidebar = getElement<HTMLDivElement>(".info-sidebar");
  const infoSidebarToggle = getElement<HTMLButtonElement>(
    ".info-sidebar-toggle",
  );
  const editorEl = getElement<HTMLElement>("#editor");
  tippy(infoSidebarToggle, {
    placement: "top",
    theme: "app-theme",
    content: "toggleInfobar",
  });
  const collapseInfoSidebar = () => {
    const collapsed = infoSidebar.classList.contains("collapsed");
    setSidebarState(infoSidebar, "info-sidebar-state", !collapsed);
  };
  setSidebarState(infoSidebar, "info-sidebar-state", collapsed);
  infoSidebarToggle.addEventListener("click", collapseInfoSidebar);
  editorEl.addEventListener("mousedown", () => {
    if (!infoSidebar.classList.contains("collapsed")) {
      setSidebarState(infoSidebar, "info-sidebar-state", true);
    }
  });
  registerAppEvents(document, {
    "app:toggle-info-sidebar": () => collapseInfoSidebar(),
  });
}

export { initInfoSidebar };
