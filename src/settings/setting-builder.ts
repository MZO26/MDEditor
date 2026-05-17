import "tippy.js/dist/tippy.css";

type SelectOption = { value: string; label: string };

// blueprint for select items and their options for specified categories
function selectBuilder(
  container: HTMLDivElement,
  id: string,
  options: SelectOption[],
  category: "appearance" | "typography" | "app" | "storage",
) {
  const optionNodes = options.map((opt) => new Option(opt.label, opt.value));
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = id;
  const select = document.createElement("select");
  select.className = "theme-select";
  select.id = id;
  select.append(...optionNodes);
  const row = document.createElement("div");
  row.className = "settings-row";
  row.append(label, select);
  select.setAttribute("data-tippy-content", `select ${id}`);
  row.dataset["category"] = category;
  container.append(row);
}

// builds the button palette and wraps it into the button container
function createSettingsMenu(): HTMLDivElement {
  const createSettingsButton = (category: string, lucideIcon: string) => {
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", lucideIcon);
    const btn = document.createElement("button");
    btn.className = "selection-btn";
    btn.appendChild(icon);
    btn.setAttribute("data-category", category);
    btn.setAttribute("data-tippy-content", category);
    return btn;
  };
  const container = document.createElement("div");
  container.className = "settings-buttons";
  container.append(
    createSettingsButton("appearance", "palette"),
    createSettingsButton("typography", "pen-line"),
    createSettingsButton("app", "app-window"),
    createSettingsButton("storage", "database-backup"),
  );

  return container;
}

export { createSettingsMenu, selectBuilder };
