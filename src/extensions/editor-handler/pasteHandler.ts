import { processAndInsertImages } from "@/extensions/image/image";
import { ALLOWED_TYPES } from "@shared/constants";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export const PasteHandler = Extension.create({
  name: "pasteHandler",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            if (!editor || !event.clipboardData) return false;
            const files = Array.from(event.clipboardData.files ?? []);
            const images = files.filter((f) => ALLOWED_TYPES.includes(f.type));
            if (images.length > 0) {
              event.preventDefault();
              const safeImages = images.slice(0, 20);
              if (images.length > 20) return;
              void processAndInsertImages(safeImages, editor).catch((error) => {
                console.error(
                  "[PasteHandler]: Failed to process pasted images:",
                  error,
                );
              });
              return true;
            }
            const text = event.clipboardData.getData("text/plain");
            if (!text || !editor.markdown) {
              return false;
            }
            try {
              const normalized = text.replace(/\r\n?/g, "\n");
              return editor.commands.insertContent(normalized, {
                contentType: "markdown",
              });
            } catch {
              return false;
            }
          },
        },
      }),
    ];
  },
});
