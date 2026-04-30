import { mergeAttributes } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import { PluginKey } from "@tiptap/pm/state";
import type { Note } from "../../shared/schemas/noteSchema";
import { debounce, getElement } from "../utils/helpers";

const NoteTag = Mention.extend({
  name: "noteTag", // unique name to register extension in the editor schema
}).configure({
  HTMLAttributes: { class: "tag-node" }, // gives a specific class to handle styling

  renderHTML({ options, node }) {
    return [
      "span",
      mergeAttributes(options.HTMLAttributes),
      `#${node.attrs["id"]}`, // json format to describe the html structure of the tag
    ];
  },

  renderText({ node }) {
    return `#${node.attrs["id"]}`; // without this, the mention extension would default back to @
  },

  suggestion: {
    char: "#",
    pluginKey: new PluginKey("noteTagSuggestion"), // unique key to keep it extensible
    items: ({ query }: { query: string }) => (query ? [query] : []),
    render: () => {
      let savedCommand: ((props: any) => void) | null = null;
      let savedQuery = "";
      // always gets called once # is being typed
      return {
        onStart: (props) => {
          savedCommand = props.command;
          savedQuery = props.query;
        },
        onUpdate: (props) => {
          savedCommand = props.command;
          savedQuery = props.query;
        },
        onExit: () => {
          savedCommand = null;
          savedQuery = "";
        },
        onKeyDown: ({ event }) => {
          // when user hits space or enter
          if (
            (event.key === " " || event.key === "Enter") &&
            savedQuery.length > 0
          ) {
            event.preventDefault();
            savedCommand?.({ id: savedQuery }); // replaces the #query text in the document with a noteTag inline node
            return true;
          }
          return false;
        },
      };
    },
  },
});

function updateNoteTags(tags: Note["tags"]) {
  const container = getElement(".tag-container");
  container.innerHTML = "";
  if (!tags || tags.length === 0) return;
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.classList.add("tag", "searchTag");
    span.dataset["tag"] = String(tag);
    span.textContent = `#${tag}`;
    container.append(span);
  });
}

const debouncedTagUpdate = debounce(updateNoteTags, 1000);

export { debouncedTagUpdate, NoteTag };
