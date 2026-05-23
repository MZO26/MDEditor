import { createToolbarFragment } from "@/components/toolbar/creation-helpers";
import { renderIcons } from "@/utils/icons";
import { getAppItem } from "@/utils/registry";
import type { ActionMap } from "@shared/types";
import type { Editor } from "@tiptap/core";

function updateActiveStates(
  buttonElements: Map<string, HTMLButtonElement>,
  actions: ActionMap,
  editor: Editor,
): void {
  for (const key in actions) {
    const item = actions[key];
    if (item?.type === "divider") continue;
    const btn = buttonElements.get(key);
    if (!btn) continue;
    const isActive = item?.isActive?.(editor) ?? false;
    const isDisabled = item?.isDisabled?.(editor) ?? false;
    if (btn.classList.contains("is-active") !== isActive) {
      btn.classList.toggle("is-active", isActive);
    }
    if (btn.disabled !== isDisabled) {
      btn.disabled = isDisabled;
    }
  }
}

function buildMenu(container: HTMLDivElement, actions: ActionMap) {
  const editor = getAppItem("editor");
  container.replaceChildren();
  const buttonMap = new Map<string, HTMLButtonElement>();
  const fragment = createToolbarFragment(actions, buttonMap);
  container.appendChild(fragment);
  renderIcons(container);
  updateActiveStates(buttonMap, actions, editor);
  editor.on("transaction", ({ transaction }) => {
    if (!transaction.docChanged && !transaction.selectionSet) {
      return;
    }
    updateActiveStates(buttonMap, actions, editor);
  });
}

function setupToolbarListeners(container: HTMLDivElement, actions: ActionMap) {
  const editor = getAppItem("editor");
  container.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>("[data-action]");
    const key = btn?.getAttribute("data-action") as keyof typeof actions;
    const item = actions[key];
    if (item && "run" in item) {
      item.run(editor);
    }
  });
}

export { buildMenu, setupToolbarListeners };
