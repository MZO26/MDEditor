import { initEditor } from "./editor";
import { updateDateTime } from "./editorFooter";
import { getElement } from "./helpers";
import { createNote } from "./renderNotes";
import { openModal } from "./settings";
import { applyAppTheme, toggleAppTheme } from "./utils/theme";

document.addEventListener("DOMContentLoaded", async () => {
  const darkModeBtn = getElement<HTMLButtonElement>(".dark-mode-btn");
  applyAppTheme(darkModeBtn);
  darkModeBtn.addEventListener("click", async () => {
    await toggleAppTheme(darkModeBtn);
  });
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
