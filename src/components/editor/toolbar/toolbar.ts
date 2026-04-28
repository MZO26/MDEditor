import type { Editor } from "@tiptap/core";
import { renderIcons } from "../../../utils/icons";
import { actions, type ToolbarMap } from "./actions";

export function updateActiveStates(
  buttonElements: Map<string, HTMLButtonElement>,
  config: ToolbarMap,
  editor: Editor,
): void {
  Object.entries(config).forEach(([id, item]) => {
    if (item.type === "divider") return;
    const btn = buttonElements.get(id);
    if (!btn) return;
    btn.classList.toggle("is-active", item.isActive?.(editor) ?? false);
    btn.disabled = item.isDisabled?.(editor) ?? false;
  });
}

export function buildToolbar(container: HTMLElement, editor: Editor): void {
  const buttonElements = new Map<string, HTMLButtonElement>();
  Object.entries(actions).forEach(([id, item]) => {
    if (item.type === "divider") {
      const divider = document.createElement("div");
      divider.className = "divider";
      container.appendChild(divider);
      return;
    }
    const btn = document.createElement("button");
    btn.dataset["action"] = id;
    const i = document.createElement("i");
    i.dataset["lucide"] = item.icon;
    btn.appendChild(i);
    container.appendChild(btn);
    buttonElements.set(id, btn);
  });
  renderIcons(container);
  container.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "[data-action]",
    );
    if (!btn) return;
    const actionKey = btn.dataset["action"];
    if (!actionKey) return;
    const action = actions[actionKey];
    if (action && action.type !== "divider") action.run(editor);
  });

  editor.on("transaction", () => {
    updateActiveStates(buttonElements, actions, editor);
  });
  updateActiveStates(buttonElements, actions, editor);
}
