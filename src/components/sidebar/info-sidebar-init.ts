import { searchByTag } from "@/components/sidebar/sidebar-filter";
import { setSidebarState } from "@/components/sidebar/sidebar-state";
import { createAsyncHandler } from "@/utils/async";
import { findElement } from "@/utils/dom";
import { getAppItem, registerAppEvents } from "@/utils/registry";
import { delegate } from "tippy.js";
import "tippy.js/dist/tippy.css";

const collapseInfoSidebar = (infoSidebar: HTMLDivElement) => {
  const collapsed = infoSidebar.classList.contains("collapsed");
  setSidebarState(infoSidebar, "info-sidebar-state", !collapsed);
};

async function initInfoSidebar(collapsed: boolean = true) {
  const editorWrapper = getAppItem("editorWrapper");
  const toggleBtn = findElement<HTMLButtonElement>(".info-sidebar-toggle");
  const infoSidebar = findElement<HTMLDivElement>(".info-sidebar");
  const tagContainer = findElement<HTMLDivElement>(".tag-container");
  if (!toggleBtn || !infoSidebar || !tagContainer) return;
  delegate(tagContainer, {
    target: "[data-tippy-content]",
    placement: "top",
    theme: "app-theme",
    trigger: "mouseenter",
    touch: false,
    hideOnClick: true,
  });
  setSidebarState(infoSidebar, "info-sidebar-state", collapsed);
  applyInfoSidebarListeners(
    tagContainer,
    toggleBtn,
    infoSidebar,
    editorWrapper,
  );
  registerAppEvents(document, {
    "app:toggle-info-sidebar": () => collapseInfoSidebar(infoSidebar),
  });
}

function applyInfoSidebarListeners(
  tagContainer: HTMLDivElement,
  toggleBtn: HTMLButtonElement,
  infoSidebar: HTMLDivElement,
  editorWrapper: HTMLDivElement,
) {
  tagContainer.addEventListener(
    "click",
    createAsyncHandler(async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === tagContainer) return;
      const spanEl = target.closest(".tag") as HTMLSpanElement | null;
      if (!spanEl) return;
      const tag = spanEl.dataset["tag"];
      if (!tag) return;
      searchByTag(tag);
    }),
  );
  toggleBtn.addEventListener("click", () => collapseInfoSidebar(infoSidebar));
  editorWrapper.addEventListener("mousedown", () => {
    if (!infoSidebar.classList.contains("collapsed")) {
      setSidebarState(infoSidebar, "info-sidebar-state", true);
    }
  });
}

export { initInfoSidebar };
