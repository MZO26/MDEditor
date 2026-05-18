import { formatShortcut } from "@/utils/format";
import { findElement } from "./dom";

function createTooltipContent(
  baseText: string,
  shortcut?: string,
): HTMLSpanElement {
  const tooltipContent = document.createElement("span");
  tooltipContent.textContent = baseText;
  if (shortcut) {
    const formatted = formatShortcut(shortcut);
    const kbdElement = document.createElement("kbd");
    kbdElement.className = "tippy-shortcut";
    kbdElement.textContent = formatted;
    tooltipContent.appendChild(kbdElement);
  }
  return tooltipContent;
}

function useDelayedSpinner(delay = 300) {
  const spinner = findElement("#loadingSpinner");
  const overlay = findElement(".overlay");
  if (!spinner || !overlay) return () => {};
  const overlayExisting = overlay.classList.contains("show");
  const spinnerExisting = spinner.classList.contains("show");
  const spinnerTimeout = setTimeout(() => {
    if (!overlayExisting) {
      overlay.classList.add("show");
    }
    if (!spinnerExisting) {
      spinner.classList.add("show");
    }
  }, delay);

  return function cleanup() {
    clearTimeout(spinnerTimeout);
    if (!overlayExisting) {
      overlay.classList.remove("show");
    }
    if (!spinnerExisting) {
      spinner.classList.remove("show");
    }
  };
}

function transition(el: Element, update: () => void) {
  const { left, top } = el.getBoundingClientRect();
  update();
  const after = el.getBoundingClientRect();
  const dx = left - after.left;
  const dy = top - after.top;
  if (dx || dy)
    el.animate(
      [{ transform: `translate(${dx}px,${dy}px)` }, { transform: "" }],
      {
        duration: 300,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    );
}

export { createTooltipContent, transition, useDelayedSpinner };
