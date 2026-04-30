import { getElement } from "@/utils/helpers";

function updateDateTime() {
  const displayElement = getElement<HTMLDivElement>("#datetime-display");

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

function formatNoteDate(isoString: string) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export { formatNoteDate, updateDateTime };
