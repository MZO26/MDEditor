import { initEditor } from "./editor";
import { getElement } from "./helpers";
import { createNote } from "./renderNotes";

document.addEventListener("DOMContentLoaded", async () => {
  let aktuellerPfad: string | null = null;
  const editor = document.getElementById("editor") as HTMLTextAreaElement;

  document.getElementById("save-btn")?.addEventListener("click", async () => {
    const inhalt = editor.value;
    const ergebnis = await window.api.saveFile({ pfad: aktuellerPfad, inhalt });

    if (typeof ergebnis === "string") {
      aktuellerPfad = ergebnis;
      alert("Gespeichert unter: " + ergebnis);
    } else if (ergebnis === true) {
      console.log("Änderungen gespeichert");
    }
  });
  const settingsBtn = getElement<HTMLButtonElement>(".settings-btn");
  settingsBtn.addEventListener("click", () => {
    openModal();
  });
  const darkModeBtn = getElement<HTMLButtonElement>(".dark-mode-btn");
  const closeModalBtn = getElement<HTMLButtonElement>(".closeModal-btn");
  closeModalBtn.addEventListener("click", () => {
    const overlay = getElement<HTMLDivElement>(".overlay");
    const modal = getElement<HTMLDivElement>(".modal");
    overlay.classList.remove("show");
    modal.classList.remove("show");
  });

  darkModeBtn?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (currentTheme === "dark") {
      document.documentElement.removeAttribute("data-theme");
      window.electronAPI.setTheme("light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      window.electronAPI.setTheme("dark");
    }
  });
  initEditor("#editor");
  function updateDateTime() {
    const displayElement = document.getElementById("datetime-display");

    if (displayElement) {
      const now = new Date();

      const dateOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const dateString = now.toLocaleDateString("de-DE", dateOptions);
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
      };
      const timeString = now.toLocaleTimeString("de-DE", timeOptions);
      displayElement.textContent = `${dateString} - ${timeString}`;
    }
  }
  updateDateTime();

  document
    .querySelector(".add-note-btn")
    ?.addEventListener("click", async () => {
      await createNote();
    });
  const settingItems =
    document.querySelectorAll<HTMLButtonElement>(".settings-nav-item");
  const panels = document.querySelectorAll<HTMLDivElement>(".settings-panel");

  settingItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset["section"];

      settingItems.forEach((i) => i.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(target!)?.classList.add("active");
    });
  });
  const openModal = (): void => {
    const overlay = getElement<HTMLDivElement>(".overlay");
    const modal = getElement<HTMLDivElement>(".modal");
    const items: HTMLCollection | undefined =
      getElement<HTMLDivElement>(".notes-container").children;
    overlay.classList.add("show");
    modal.classList.add("show");
    if (items) {
      Array.from(items).forEach((element) => {
        if (element.classList.contains("active"))
          element.classList.remove("active");
      });
    }
  };
  document.querySelectorAll(".categoryItem")?.forEach((item) => {
    item.addEventListener("click", () => {
      const sidebar = getElement<HTMLDivElement>(".sidebar-notes");
      const appContainer = getElement<HTMLDivElement>(".app-container");
      sidebar.classList.toggle("collapsed");
      appContainer.classList.toggle("collapsed");
    });
  });

  setInterval(updateDateTime, 60000);
});
