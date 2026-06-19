import { InputRule, Node, mergeAttributes, nodePasteRule } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      setFootnote: (note?: string) => ReturnType;
    };
  }
}

export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      note: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-tippy-content") ?? "",
        renderHTML: (attributes) => ({
          "data-tippy-content": attributes["note"],
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-footnote"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-type": "inline-footnote",
          class: "footnote-anchor",
        },
        HTMLAttributes,
      ),
    ];
  },

  renderText({ node }) {
    return `^[${node.attrs["note"]}]`;
  },

  markdownTokenName: "footnote",

  markdownTokenizer: {
    name: "footnote",
    level: "inline" as const,
    start: (src: string) => src.indexOf("^["),

    tokenize(src: string) {
      const match = src.match(/^\^\[([^\]\n]+)\]/);
      const note = match?.[1]?.trim();
      if (!match || !note) {
        return undefined;
      }
      return {
        type: "footnote",
        raw: match[0],
        note,
      };
    },
  },

  parseMarkdown(token, helpers) {
    const note = String(token["note"] ?? "").trim();
    if (!note) {
      return helpers.createTextNode(token.raw || "");
    }
    return helpers.createNode("footnote", { note });
  },

  renderMarkdown(node) {
    const note = String(node.attrs?.["note"] ?? "").trim();
    return note ? `^[${note}]` : "";
  },

  addCommands() {
    return {
      setFootnote:
        (note = "") =>
        ({ commands, state }) => {
          const selectedText = state.doc.textBetween(
            state.selection.from,
            state.selection.to,
            " ",
          );
          return commands.insertContent({
            type: this.name,
            attrs: {
              note: note || selectedText || "",
            },
          });
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\^\[([^\]\n]+)\]$/,
        handler: ({ state, range, match }) => {
          const note = match[1];
          const node = this.type.create({ note });
          state.tr.replaceWith(range.from, range.to, node);
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: /\^\[([^\]\n]+)\]/g,
        type: this.type,
        getAttributes: (match) => ({ note: match[1] }),
      }),
    ];
  },
});
