import { Editor } from "@tiptap/core";
import BubbleMenu from "@tiptap/extension-bubble-menu";

class BubbleMenuManager {
  public element: HTMLElement;

  constructor() {
    // 1. Create the container
    this.element = document.createElement("div");
    this.element.className = "bubble-menu";

    // 2. Inject the HTML for the buttons
    this.element.innerHTML = `
      <button data-action="bold" class="menu-btn">B</button>
      <button data-action="italic" class="menu-btn">I</button>
      <button data-action="strike" class="menu-btn">S</button>
    `;
  }

  getExtension() {
    return BubbleMenu.configure({
      element: this.element,
    });
  }
  attach(editor: Editor) {
    this.element
      .querySelector('[data-action="bold"]')
      ?.addEventListener("click", () => {
        editor.chain().focus().toggleBold().run();
      });

    this.element
      .querySelector('[data-action="italic"]')
      ?.addEventListener("click", () => {
        editor.chain().focus().toggleItalic().run();
      });

    this.element
      .querySelector('[data-action="strike"]')
      ?.addEventListener("click", () => {
        editor.chain().focus().toggleStrike().run();
      });

    editor.on("selectionUpdate", () => {
      this.element
        .querySelector('[data-action="bold"]')
        ?.classList.toggle("is-active", editor.isActive("bold"));
      this.element
        .querySelector('[data-action="italic"]')
        ?.classList.toggle("is-active", editor.isActive("italic"));
      this.element
        .querySelector('[data-action="strike"]')
        ?.classList.toggle("is-active", editor.isActive("strike"));
    });
  }
}

export default BubbleMenuManager;
