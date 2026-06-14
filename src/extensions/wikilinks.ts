import {
  mergeAttributes,
  Node,
  nodeInputRule,
  nodePasteRule,
} from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const UUID_PATTERN = "([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})";
const INPUT_REGEX = new RegExp(`\\[\\[\\s*${UUID_PATTERN}\\s*\\]\\]$`, "i");
const PASTE_REGEX = new RegExp(
  `(?:\\[\\[)?\\s*${UUID_PATTERN}\\s*(?:\\]\\])?`,
  "gi",
);

export interface WikiLinkOptions {
  onClick: (id: string) => void | Promise<void>;
  getLabel: (id: string) => string;
}

const WikiLink = Node.create<WikiLinkOptions>({
  name: "wikilink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addOptions: () => ({
    onClick: () => {},
    getLabel: (id) => id, // Fallback to id if no name is provided
  }),

  addAttributes: () => ({
    id: {
      default: null,
      parseHTML: (el) =>
        el
          .getAttribute("data-id")
          ?.replace(/[\[\]]/g, "")
          .trim() || "",
    },
  }),
  parseHTML: () => [{ tag: "span[data-wikilink]" }],
  renderHTML({ node, HTMLAttributes }) {
    const id = node.attrs["id"];
    const label = this.options.getLabel(id); // Note title
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-wikilink": "",
        "data-id": id,
        class: "wikilink",
      }),
      label, // Renders the title
    ];
  },
  renderText({ node }) {
    const id = String(node.attrs?.["id"] ?? "").trim();
    return id ? `[[${this.options.getLabel(id)}]]` : "";
  },
  renderMarkdown(node) {
    const id = String(node.attrs?.["id"] ?? "").trim();
    return id ? `[[${id}]]` : "";
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => ({ id: match[1] }),
      }),
    ];
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: PASTE_REGEX,
        type: this.type,
        getAttributes: (match) => ({ id: match[1] }),
      }),
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("wikilinkClickHandler"),
        props: {
          handleClickOn: (_view, _pos, node, _nodePos, event) => {
            if (node.type.name !== this.name || !node.attrs["id"]) return false;
            event.preventDefault();
            event.stopPropagation();
            void this.options.onClick(node.attrs["id"]);
            return true;
          },
        },
      }),
    ];
  },
});

export { WikiLink };
