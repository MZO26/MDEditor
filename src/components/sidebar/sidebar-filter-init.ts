import {
  handleSearchInput,
  handleViews,
} from "@/components/sidebar/sidebar-filter";
import { createAsyncHandler, debounce } from "@/utils/async";
import type { View } from "@shared/types";

const debouncedSearch = debounce((e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = target.value.trim();
  void handleSearchInput(value);
}, 500);

function applyFilterListeners(
  searchInput: HTMLInputElement,
  viewSelect: HTMLSelectElement,
) {
  searchInput.addEventListener("input", debouncedSearch);
  viewSelect.addEventListener(
    "change",
    createAsyncHandler(async (e) => {
      const target = e.target as HTMLSelectElement;
      const view = target.value as View;
      handleViews(view);
    }),
  );
}

export { applyFilterListeners };
