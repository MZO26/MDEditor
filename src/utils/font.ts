async function getSelectedFont(event: Event) {
  try {
    const selectedFont = event.target as HTMLSelectElement;
    const font = selectedFont.value;
    document.documentElement.setAttribute("data-font", font);
    console.log("Selected font:", font);
  } catch (error) {
    console.error("Failed to set font:", error);
    return;
  }
}

export { getSelectedFont };
