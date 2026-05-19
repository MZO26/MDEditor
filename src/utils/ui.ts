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

function animateTextChange(
  el: HTMLElement | null,
  text: string,
  duration = 200,
) {
  if (!el || el.textContent === text) return;
  const half = duration / 2;
  el.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: half,
    easing: "linear",
    fill: "forwards",
  }).finished.then(() => {
    el.textContent = text;
    el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: half,
      easing: "linear",
      fill: "forwards",
    });
  });
}

export { animateTextChange, createTooltipContent, useDelayedSpinner };
