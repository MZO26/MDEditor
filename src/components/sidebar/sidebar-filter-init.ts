import {
  handleSearchInput,
  handleViews,
  searchByTag,
} from "@/components/sidebar/sidebar-filter";
import {
  createAsyncHandler,
  debounce,
  getElement,
  registerAppEvents,
} from "@/utils/helpers";
import { delegate } from "tippy.js";

function initSearchHandlers() {
  const searchInput = getElement<HTMLInputElement>("#searchInput");
  const notesContainer = getElement<HTMLDivElement>(".notes-container");
  const smartViewContainer = getElement(".smart-view-list");
  const tagContainer = getElement<HTMLDivElement>(".tag-container");
  const tippyInstance = delegate(tagContainer, {
    target: "[tippy-content]",
    placement: "top",
    theme: "app-theme",
    content: (reference) =>
      reference.getAttribute("tippy-content") || "filter notes by tag",
  });
  const debouncedSearch = debounce(() => {
    const value = searchInput.value.trim();
    void handleSearchInput(value, notesContainer);
  }, 500);
  searchInput.addEventListener("input", debouncedSearch);
  smartViewContainer.addEventListener(
    "click",
    createAsyncHandler(async (event) => {
      const target = event.target as HTMLElement;
      if (target === smartViewContainer) return;
      const button = target.closest(
        "button[data-view]",
      ) as HTMLButtonElement | null;
      if (!button) return;
      const view = button.dataset["view"];
      if (!view) return;
      handleViews(view);
    }),
  );
  tagContainer.addEventListener(
    "click",
    createAsyncHandler(async (e: Event) => {
      const target = e.target as HTMLElement;
      if (target === tagContainer) return;
      const spanEl = target.closest(".tag") as HTMLSpanElement | null;
      if (!spanEl) return;
      const tag = spanEl.dataset["tag"];
      if (!tag) return;
      tippyInstance.show();
      searchByTag(tag);
    }),
  );
  registerAppEvents(document, {
    "app:toggle-view-filter": () => smartViewContainer.togglePopover(),
    "app:open-global-search": () => searchInput.focus(),
  });
}

export { initSearchHandlers };
