import { initEditor } from "./components/editor";
import { updateDateTime } from "./components/editorFooter";
import { openModal } from "./handlers/settings";
import { createNote } from "./notes/renderNotes";
import { getSelectedFont } from "./utils/font";
import { getElement, getElementOrNull } from "./utils/helpers";
import { renderIcons } from "./utils/icons";
import { applyAppTheme, setAppTheme } from "./utils/theme";

document.addEventListener("DOMContentLoaded", async () => {
  renderIcons();
  const themeDropdown = getElement("#theme-dropdown") as HTMLSelectElement;
  const fontSelect = getElementOrNull("#font-dropdown") as HTMLSelectElement;

  if (themeDropdown) {
    themeDropdown.addEventListener("change", setAppTheme);
    applyAppTheme(themeDropdown);
  }
  if (fontSelect) {
    fontSelect.addEventListener("change", getSelectedFont);
  }
  const settingsBtn = getElement<HTMLButtonElement>(".settings-btn");
  settingsBtn.addEventListener("click", () => {
    openModal();
  });

  const closeModalBtn = getElement<HTMLButtonElement>(".closeModal-btn");
  closeModalBtn.addEventListener("click", () => {
    const overlay = getElement<HTMLDivElement>(".overlay");
    const modal = getElement<HTMLDivElement>(".modal");
    overlay.classList.remove("show");
    modal.classList.remove("show");
  });
  initEditor("#editor");

  updateDateTime();

  document
    .querySelector(".add-note-btn")
    ?.addEventListener("click", async () => {
      await createNote();
    });

  document.querySelectorAll(".categoryItem")?.forEach((item) => {
    item.addEventListener("click", () => {
      const sidebar = getElement<HTMLDivElement>(".sidebar-notes");
      const appContainer = getElement<HTMLDivElement>(".app-container");
      const editor = getElement<HTMLDivElement>("#editor");
      sidebar.classList.toggle("collapsed");
      appContainer.classList.toggle("collapsed");
      editor.classList.toggle("collapsed");
    });
  });

  setInterval(updateDateTime, 60000);
});
