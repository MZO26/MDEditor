import { processAndInsertImage } from "@/extensions/image/image";
import { sleep } from "@/utils/async";
import { useDelayedSpinner } from "@/utils/ui";
import { processWithLimit } from "@shared/limiter";
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
            const images = files.filter((f) => f.type.startsWith("image/"));
            if (images.length > 0) {
              event.preventDefault();
              const stopSpinner = useDelayedSpinner();
              void processWithLimit(images, 1, async (file) => {
                await sleep(1000);
                await processAndInsertImage(file, editor);
              }).finally(() => {
                stopSpinner?.();
              });
              return true;
            }
            const text = event.clipboardData.getData("text/plain");
            if (!text || !editor.markdown) {
              return false;
            }
            try {
              const normalized = text.replace(/\r\n?/g, "\n");
              const handled = editor.commands.insertContent(normalized, {
                contentType: "markdown",
              });
              return handled;
            } catch {
              return false;
            }
          },
        },
      }),
    ];
  },
});
