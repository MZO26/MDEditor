import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    conceal: {
      setConceal: () => ReturnType;
      toggleConceal: () => ReturnType;
      unsetConceal: () => ReturnType;
    };
  }
}

export const Conceal = Mark.create({
  name: "conceal",

  parseHTML() {
    return [{ tag: "span[data-conceal]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        {
          "data-conceal": "",
          class: "conceal",
        },
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setConceal:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),

      toggleConceal:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),

      unsetConceal:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:\|\|)([^|\n][^|\n]*?)(?:\|\|)$/,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:\|\|)([^|\n][^|\n]*?)(?:\|\|)/g,
        type: this.type,
      }),
    ];
  },

  markdownTokenName: "conceal",

  markdownTokenizer: {
    name: "conceal",
    level: "inline" as const,
    start: (src: string) => src.indexOf("||"),
    tokenize(src: string) {
      const match = src.match(/^\|\|([^|\n][^|\n]*?)\|\|/);
      const text = match?.[1] ?? "";
      if (!match || !text) {
        return undefined;
      }
      return {
        type: "conceal",
        raw: match[0],
        text,
      };
    },
  },

  parseMarkdown(token, helpers) {
    const text = String(token.text ?? "");
    if (!text) {
      return helpers.createTextNode(token.raw || "");
    }
    return helpers.applyMark("conceal", [helpers.createTextNode(text)]);
  },

  renderMarkdown(node, helpers) {
    const content = helpers.renderChildren(node);
    return content ? `||${content}||` : "";
  },
});
