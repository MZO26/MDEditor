import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    detailsBlock: {
      insertDetailsBlock: (summary?: string, open?: boolean) => ReturnType;
    };
  }
}

export const DetailsBlock = Node.create({
  name: "detailsBlock",

  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      summary: {
        default: "Details",
        parseHTML: (el) =>
          el.querySelector("summary")?.textContent?.trim() || "Details",
      },
      open: {
        default: false,
        parseHTML: (el) => el.hasAttribute("open"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { summary, open, ...attrs } = HTMLAttributes;

    return [
      "details",
      mergeAttributes(attrs, open ? { open: "" } : {}),
      ["summary", summary || "Details"],
      ["div", { "data-details-content": "" }, 0], // 0 for render all nested children
    ];
  },

  addCommands() {
    return {
      insertDetailsBlock:
        (summary = "Details", open = false) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { summary, open },
            content: [{ type: "paragraph" }],
          }),
    };
  },

  addNodeView() {
    return ({ editor, node, getPos }) => {
      let currentNode: ProseMirrorNode = node;
      const dom = document.createElement("details");
      dom.className = "details-root";
      dom.open = !!currentNode.attrs["open"];
      const summary = document.createElement("summary");
      summary.className = "details-summary";
      summary.contentEditable = "false";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "details-summary-input";
      input.value = currentNode.attrs["summary"] || "Details";
      input.placeholder = "Summary";
      input.contentEditable = "false";
      const content = document.createElement("div");
      content.className = "details-content";
      const updateAttrs = (attrs: Record<string, unknown>) => {
        const pos = getPos();
        if (typeof pos !== "number") return false;
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            ...attrs,
          }),
        );
        return true;
      };

      summary.addEventListener("click", (event) => {
        if (event.target === input) return;
        event.preventDefault();
        updateAttrs({ open: !currentNode.attrs["open"] });
      });

      summary.addEventListener("keydown", (event) => {
        if (event.target === input) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          updateAttrs({ open: !currentNode.attrs["open"] });
        }
      });

      input.addEventListener("blur", () => {
        if (input.value !== currentNode.attrs["summary"]) {
          updateAttrs({ summary: input.value });
        }
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.focus(pos + 2);
          }
        }
      });

      summary.append(input);
      dom.append(summary, content);

      return {
        dom, // details node
        contentDOM: content, // nested content inside the details node

        update(updatedNode) {
          if (updatedNode.type !== currentNode.type) return false;

          currentNode = updatedNode;
          dom.open = !!currentNode.attrs["open"];

          const nextSummary = currentNode.attrs["summary"] || "Details";
          if (input.value !== nextSummary) input.value = nextSummary;
          return true;
        },

        stopEvent(event) {
          return event.target === input;
        },

        ignoreMutation(mutation) {
          return mutation.target === input;
        },
      };
    };
  },

  renderMarkdown(node, helpers) {
    const openAttr = node.attrs?.["open"] ? " open" : "";
    const summary = String(node.attrs?.["summary"] || "Details");
    const content = helpers.renderChildren(node);

    return `<details${openAttr}>\n<summary>${summary}</summary>\n\n${content}\n\n</details>`;
  },
});
