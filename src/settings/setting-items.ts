import { selectBuilder } from "@/settings/setting-factory";

function buildSelects() {
  selectBuilder(
    "theme",
    [
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "light-warm", label: "Light · Warm" },
      { value: "dark", label: "Dark" },
      { value: "dark-warm", label: "Dark · Warm" },
    ],
    "Appearance",
  );
  selectBuilder(
    "code-theme",
    [
      { value: "focus", label: "Focus" },
      { value: "balanced", label: "Balanced" },
      { value: "colorless", label: "Colorless" },
    ],
    "Appearance",
  );
  selectBuilder(
    "highlight-theme",
    [
      { value: "info", label: "Info" },
      { value: "idea", label: "Idea" },
      { value: "focus", label: "Focus" },
    ],
    "Appearance",
  );
  selectBuilder(
    "note-item-display",
    [
      {
        value: "tags",
        label: "Tags",
      },
      {
        value: "snippet",
        label: "Snippet",
      },
      {
        value: "minimal",
        label: "Minimal",
      },
    ],
    "Appearance",
  );
  selectBuilder(
    "font-family",
    [
      { value: "system", label: "System" },
      { value: "arial", label: "Arial" },
      { value: "georgia", label: "Georgia" },
      { value: "garamond", label: "Garamond" },
    ],
    "Editor",
  );
  selectBuilder(
    "font-size",
    [
      { value: "16", label: "Small" },
      { value: "18", label: "Medium" },
      { value: "20", label: "Large" },
    ],
    "Editor",
  );
  selectBuilder(
    "line-height",
    [
      { value: "1.4", label: "Small" },
      { value: "1.5", label: "Medium" },
      { value: "1.6", label: "Large" },
    ],
    "Editor",
  );
  selectBuilder(
    "editor-focus",
    [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ],
    "Editor",
  );
  (selectBuilder(
    "spellcheck",
    [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ],
    "App",
  ),
    selectBuilder(
      "file-backup",
      [
        { value: "json", label: "JSON" },
        { value: "md", label: "Markdown" },
        { value: "txt", label: "Plain Text" },
        { value: "html", label: "HTML" },
        { value: "pdf", label: "PDF" },
      ],
      "App",
      "Backup Format",
    ),
    selectBuilder(
      "db-optimization",
      [
        { value: "optimize-db", label: "Optimize database" },
        { value: "vacuum-db", label: "Free up disk space" },
        { value: "backup-db", label: "Backup database" },
      ],
      "App",
      "Database Settings",
    ));
  selectBuilder(
    "delete-confirmation",
    [
      { value: "true", label: "Enable" },
      { value: "false", label: "Disable" },
    ],
    "App",
  );
}

export { buildSelects };
