import { tinykeys } from "tinykeys";

function isTypingEvent(
  event: KeyboardEvent,
  allowInEditor: boolean = false,
): boolean {
  const target = event.target as HTMLElement;
  const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
  const isEditor = target.isContentEditable;
  if (allowInEditor) {
    return isInput;
  } else {
    return isInput || isEditor;
  }
}

function initGlobalShortcuts() {
  tinykeys(window, {
    "$mod+o": (event) => {
      if (isTypingEvent(event, true)) return;
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("app:toggle-sidebar"));
    },
    "$mod+Shift+R": (e) => {
      if (isTypingEvent(e, true)) return;
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:toggle-read-only"));
    },
    "$mod+Shift+W": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:set-editor-width"));
    },
    "$mod+f": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:open-global-search"));
    },
    "$mod+Shift+V": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:toggle-view-filter"));
    },
    "$mod+Alt+O": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:toggle-info-sidebar"));
    },
    "$mod+,": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:open-settings"));
    },
    "$mod+n": (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("app:create-new-note"));
    },
    F11: (event) => {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("app:toggle-focus-mode"));
    },
    Escape: (event) => {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("app:escape"));
    },
  });
}

export { initGlobalShortcuts };
