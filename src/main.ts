import { initEditor } from "./editor";
import { getElement } from "./helpers";

document.addEventListener("DOMContentLoaded", async () => {
  const settingsBtn = getElement<HTMLButtonElement>(".settings-btn");
  settingsBtn.addEventListener("click", () => {
    openModal();
  });
  const darkModeBtn = getElement<HTMLButtonElement>(".dark-mode-btn");

  darkModeBtn?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (currentTheme === "dark") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  });
  try {
    await initEditor();
    console.log("Editor initialized successfully");
  } catch (error) {
    console.error("Error initializing editor:", error);
  }
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
  setInterval(updateDateTime, 60000);
});
