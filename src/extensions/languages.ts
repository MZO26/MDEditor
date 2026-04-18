import { Editor } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { debounce } from "../utils/helpers";
import { lowlight } from "./lowlight";

const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      showLanguage: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute("data-language") === "true",
        renderHTML: (attributes) => ({
          "data-language": attributes["showLanguage"],
        }),
      },
    };
  },
});

function detectCodeBlockLanguage(editor: Editor): string | null {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);

    if (node.type.name === "codeBlock") {
      const code = node.textContent;
      if (!code.trim()) return null;

      const result = lowlight.highlightAuto(code, {
        subset: [
          "css",
          "javascript",
          "typescript",
          "html",
          "python",
          "csharp",
          "java",
          "cpp",
          "sql",
          "shell",
          "rust",
          "powershell",
          "json",
        ],
      });
      return result?.data?.language ?? null;
    }
  }

  return null;
}

const updateDetectCodeLanguage = debounce((editor: Editor) => {
  if (!editor.isActive("codeBlock")) return;
  const attrs = editor.getAttributes("codeBlock");
  if (!attrs["showLanguage"]) return;

  const detectedLanguage = detectCodeBlockLanguage(editor);

  if (attrs["language"] !== detectedLanguage) {
    editor.commands.updateAttributes("codeBlock", {
      language: detectedLanguage,
    });
  }
}, 1000);

export {
  CustomCodeBlockLowlight,
  detectCodeBlockLanguage,
  updateDetectCodeLanguage,
};
