import { processAndInsertImage } from "@/extensions/image/image";
import { sleep } from "@/utils/async";
import { useDelayedSpinner } from "@/utils/ui";
import { CONTENT_TYPE_MAP } from "@shared/constants";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

function getExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(index + 1).toLowerCase() : "";
}

export const DropHandler = Extension.create({
  name: "dropHandler",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          handleDrop(view, event, _slice, moved) {
            if (moved) return false;
            const files = Array.from(event.dataTransfer?.files ?? []);
            if (files.length === 0) return false;
            const coords = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (!coords) return false;
            const supportedFiles = files.filter((file) => {
              if (file.type.startsWith("image/")) return true;
              const ext = getExtension(file.name);
              return ext === "txt" || ext in CONTENT_TYPE_MAP;
            });
            if (supportedFiles.length === 0) return false;
            event.preventDefault();
            const stopSpinner = useDelayedSpinner();
            void (async () => {
              try {
                editor.chain().focus().setTextSelection(coords.pos).run();
                for (const file of supportedFiles) {
                  try {
                    if (file.type.startsWith("image/")) {
                      await sleep(1000);
                      await processAndInsertImage(file, editor);
                      continue;
                    }
                    const ext = getExtension(file.name);
                    const text = await file.text();
                    const contentType =
                      ext === "txt" ? "txt" : CONTENT_TYPE_MAP[ext];
                    if (contentType === "txt") {
                      editor.commands.command(({ tr, dispatch }) => {
                        if (dispatch) {
                          tr.insertText(text);
                        }
                        return true;
                      });
                    } else if (contentType === "markdown") {
                      editor.commands.insertContent(text, {
                        contentType: "markdown",
                      });
                    } else if (contentType === "html") {
                      editor.commands.insertContent(text, {
                        parseOptions: { preserveWhitespace: "full" },
                      });
                    } else if (contentType === "json") {
                      editor.commands.insertContent(JSON.parse(text));
                    }
                  } catch (error) {
                    console.error(
                      `Failed to process dropped file: ${file.name}`,
                      error,
                    );
                  }
                }
              } finally {
                if (stopSpinner) stopSpinner();
              }
            })();
            return true;
          },
        },
      }),
    ];
  },
});
