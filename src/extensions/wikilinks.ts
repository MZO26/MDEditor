import { noteStore } from "@/settings/app-state";
import { Node, nodeInputRule, nodePasteRule } from "@tiptap/core";
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
    },
  }),
  renderHTML({ node }) {
    const id = String(node.attrs?.["id"] ?? "").trim();
    const note = noteStore.get("notes").find((n) => n.id === id);
    return [
      "span",
      { class: "wikilink" },
      note ? `[[${note.title}]]` : id ? `[[${id}]]` : "",
    ];
  },
  renderText({ node }) {
    const id = String(node.attrs?.["id"] ?? "").trim();
    const note = noteStore.get("notes").find((n) => n.id === id);
    return note ? `[[${note.title}]]` : id ? `[[${id}]]` : "";
  },
  renderMarkdown(node) {
    const id = String(node.attrs?.["id"] ?? "").trim();
    const note = noteStore.get("notes").find((n) => n.id === id);
    return note ? `[[${note.title}]]` : id ? `[[${id}]]` : "";
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
