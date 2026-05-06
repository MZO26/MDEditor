function requireElement<T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document,
): T {
  const el = parent.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Element not found: "${selector}"`);
  }
  return el;
}

function findElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function setActiveItem(element: HTMLElement, parent: HTMLElement) {
  if (!element) return;
  const currentlyActive = parent.querySelector(".is-active");
  if (currentlyActive) {
    currentlyActive.classList.remove("is-active");
  }
  element.classList.add("is-active");
}

export { findElement, requireElement, setActiveItem };
