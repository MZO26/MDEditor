import { findElement } from "@/utils/dom";

let container: HTMLDivElement | null = null;

function showToast(value: string, duration = 2000): void {
  if (!container?.isConnected) {
    container = findElement<HTMLDivElement>(".toast-container");
  }
  if (!container) return;
  if (!container.matches(":popover-open")) {
    container.showPopover();
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = value.length > 50 ? `${value.slice(0, 50)}...` : value;
  container.append(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");

    toast.addEventListener(
      "animationend",
      () => {
        toast.remove();

        if (
          container?.isConnected &&
          container.childElementCount === 0 &&
          container.matches(":popover-open")
        ) {
          container.hidePopover();
        }
      },
      { once: true },
    );
  }, duration);
}
export { showToast };
