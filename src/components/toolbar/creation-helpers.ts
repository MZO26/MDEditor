import type { Action, ActionMap } from "@shared/types";

function createButton(key: string, item: Action) {
  const btn = document.createElement("button");
  btn.classList.add(`${key}-btn`);
  btn.dataset["action"] = key;
  const i = document.createElement("i");
  i.dataset["lucide"] = item.icon;
  btn.appendChild(i);
  btn.type = "button";
  btn.setAttribute("data-tippy-content", key);
  btn.setAttribute("data-shortcut", item.shortcut);
  return btn;
}

function createDivider() {
  const element = document.createElement("div");
  element.className = "divider";
  return element;
}

function createToolbarFragment(
  actions: ActionMap,
  buttonMap: Map<string, HTMLButtonElement>,
) {
  const fragment = document.createDocumentFragment();
  for (const key in actions) {
    const item = actions[key];
    if (item?.type === "divider") {
      fragment.appendChild(createDivider());
    } else {
      if (!item) continue;
      const actionBtn = createButton(key, item);
      fragment.appendChild(actionBtn);
      buttonMap.set(key, actionBtn);
    }
  }
  return fragment;
}

export { createButton, createToolbarFragment };
