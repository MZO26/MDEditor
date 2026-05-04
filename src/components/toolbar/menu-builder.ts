import {
  createBubbleMenuFragment,
  createToolbarFragment,
} from "@/components/toolbar/creation-helpers";
import { renderIcons } from "@/utils/icons";
import type { ActionMap } from "@shared/types";
import type { Editor } from "@tiptap/core";

function getActiveMenu(editor: Editor): string {
  if (editor.isActive("table")) return "table";
  if (editor.isActive("codeBlock")) return "codeBlock";
  return "text";
}

function updateActiveStates<T>(
  buttonElements: Map<string, HTMLButtonElement>,
  actions: ActionMap<T>,
  editor: Editor,
): void {
  Object.entries(actions).forEach(([key, item]) => {
    if (item.type === "divider") return;
    const btn = buttonElements.get(key);
    if (!btn) return;
    btn.classList.toggle("is-active", item.isActive?.(editor as T) ?? false);
    btn.disabled = item.isDisabled?.(editor as T) ?? false;
  });
}

function buildMenu<T>(
  container: HTMLElement,
  editor: Editor,
  type: "toolbar" | "bubble-menu",
  actions: ActionMap<T>,
): void {
  container.innerHTML = "";
  const buttonMap = new Map<string, HTMLButtonElement>();
  const fragment =
    type === "toolbar"
      ? createToolbarFragment(actions, buttonMap)
      : createBubbleMenuFragment(actions, buttonMap);
  container.appendChild(fragment);
  renderIcons(container);
  if (type === "bubble-menu") {
    editor.on("selectionUpdate", () => {
      const activeMenu = getActiveMenu(editor);
      container.dataset["activeMenu"] = activeMenu || "text";
    });
  }
  editor.on("transaction", () => {
    updateActiveStates(buttonMap, actions, editor);
  });
  updateActiveStates(buttonMap, actions, editor);
}

function setupToolbarListeners<T>(
  container: HTMLElement,
  actions: ActionMap<T>,
  context: T,
) {
  container.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>(
      "[data-action]",
    );
    const key = btn?.dataset["action"] as keyof typeof actions;
    const item = actions[key];
    if (item && "run" in item) {
      item.run(context);
    }
  });
}

export { buildMenu, setupToolbarListeners };
