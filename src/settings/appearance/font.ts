import type { AppFont } from "../../shared/schemas/storeSchema";
import { showToast } from "../../utils/toast";

async function setSelectedFont(event: Event) {
  try {
    const selectedFont = event.target as HTMLSelectElement;
    const font = selectedFont.value;
    document.documentElement.setAttribute("data-font", font);
    await window.storeApi.setSettings("font", font);
    showToast(`Selected font: ${font}`);
  } catch (error) {
    console.error("Failed to set font: ", error);
  }
}

async function getSelectedFont(selectElement: HTMLSelectElement | undefined) {
  try {
    let font: AppFont;
    const response = await window.storeApi.getSettings("font");
    if (!response.success) return;
    font = response.data;
    document.documentElement.setAttribute("data-font", font);
    if (selectElement) {
      selectElement.value = font;
    }
  } catch (error) {
    console.error("Failed to load font: ", error);
  }
}

export { getSelectedFont, setSelectedFont };
