function formatNoteDate(isoString: string) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortcut(shortcut?: string): string {
  if (!shortcut) return "";

  const isMac = typeof process !== "undefined" && process.platform === "darwin";

  return shortcut
    .replace(/mod[-+]?/gi, isMac ? "⌘" : "Ctrl+")
    .replace(/shift[-+]?/gi, isMac ? "⇧" : "Shift+")
    .replace(/alt[-+]?/gi, isMac ? "⌥" : "Alt+")
    .replace(/meta[-+]?/gi, isMac ? "⌘" : "Meta+");
}

export { formatNoteDate, formatShortcut };
