import { createTooltipContent } from "@/utils/helpers";
import type { Action, ActionMap, BubbleMenuGroup } from "@shared/types";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const BUBBLE_MENU_GROUPS: BubbleMenuGroup[] = [
  "text",
  "inlineCode",
  "codeBlock",
  "table",
];

function createButton<T>(key: string, item: Action<T>): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.classList.add(`${key}-btn`);
  btn.dataset["action"] = key;
  const i = document.createElement("i");
  i.dataset["lucide"] = item.icon;
  btn.appendChild(i);
  const tooltipContent = createTooltipContent(key, item.shortcut);
  tippy(btn, {
    content: tooltipContent,
    placement: "top",
    arrow: true,
    theme: "app-theme",
  });
  return btn;
}

function createDivider(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "divider";
  return el;
}

function createToolbarFragment<T>(
  actions: ActionMap<T>,
  buttonMap: Map<string, HTMLButtonElement>,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const [key, item] of Object.entries(actions)) {
    if (item.type === "divider") {
      fragment.appendChild(createDivider());
    } else {
      const actionBtn = createButton(key, item);
      fragment.appendChild(actionBtn);
      buttonMap.set(key, actionBtn);
    }
  }
  return fragment;
}

function createBubbleMenuFragment<T>(
  actions: ActionMap<T>,
  buttonMap: Map<string, HTMLButtonElement>,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const menuMap = new Map<BubbleMenuGroup, HTMLDivElement>();
  for (const menu of BUBBLE_MENU_GROUPS) {
    const div = document.createElement("div");
    div.className = `tool-group ${menu}-tools`;
    fragment.appendChild(div);
    menuMap.set(menu, div);
  }
  let currentGroup: BubbleMenuGroup = "text";
  for (const [key, item] of Object.entries(actions)) {
    if (item.type !== "divider" && item.group) {
      currentGroup = item.group;
    }
    const targetDiv = menuMap.get(currentGroup);
    if (!targetDiv) continue;
    if (item.type === "divider") {
      targetDiv.appendChild(createDivider());
    } else {
      const actionBtn = createButton(key, item);
      targetDiv.appendChild(actionBtn);
      buttonMap.set(key, actionBtn);
    }
  }
  return fragment;
}

export { createBubbleMenuFragment, createButton, createToolbarFragment };
