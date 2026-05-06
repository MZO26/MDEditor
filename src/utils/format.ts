function formatNoteDate(isoString: string) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortcut(shortcut?: string): string {
  if (!shortcut) return "";

  const isMac =
    typeof window !== "undefined"
      ? navigator.userAgent.toUpperCase().indexOf("MAC") >= 0
      : false;

  const modifier = isMac ? "⌘" : "Ctrl+";
  let formatted = shortcut.replace(/mod[-+]?/gi, modifier);

  if (isMac) {
    formatted = formatted.replace(/shift[-+]?/gi, "⇧");
    formatted = formatted.replace(/alt[-+]?/gi, "⌥");
  } else {
    formatted = formatted.replace(/shift[-+]?/gi, "Shift+");
    formatted = formatted.replace(/alt[-+]?/gi, "Alt+");
  }
  return formatted.toUpperCase();
}

export { formatNoteDate, formatShortcut };
