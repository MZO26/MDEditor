import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customSearchHighlight: {
      setSearchTerm: (searchTerm: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

const searchKey = new PluginKey("customSearch");

const CustomSearchHighlight = Extension.create({
  name: "customSearchHighlight",

  addCommands() {
    return {
      // put searchTerm as metadata to the transaction
      setSearchTerm:
        (term: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchKey, term);
          return true;
        },
      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchKey, "");
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchKey,
        state: {
          init: () => ({ term: "", decos: DecorationSet.empty }),
          apply(tr, oldState) {
            const term = tr.getMeta(searchKey) ?? oldState.term;
            // if document text didn't change and search term didn't change, old term gets returned. If search term is empty or only 1 letter long no highlights are shown
            if (!tr.docChanged && term === oldState.term) return oldState;
            if (!term || term.length < 2)
              return { term, decos: DecorationSet.empty };
            if (tr.docChanged && term === oldState.term) {
              return { term, decos: oldState.decos.map(tr.mapping, tr.doc) };
            }
            // tr.mapping shifts all decorations if char gets added instead of re-reading all words

            // if search term actually changed, decorations array gets created, input gets sanitized and nodes that match the regex get pushed into the array. position gets calculated: pos + match.index (start) / from + match[0].length is the end. Decorations inline wraps it into a span which then gets pushed to decos arr.
            const decos: Decoration[] = [];
            const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(safeTerm, "gi");
            tr.doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                for (const match of node.text.matchAll(regex)) {
                  const from = pos + match.index!;
                  decos.push(
                    Decoration.inline(from, from + match[0].length, {
                      class: "search-highlight",
                    }),
                  );
                }
              }
            });

            return { term, decos: DecorationSet.create(tr.doc, decos) };
          },
        },
        props: {
          // reads the decos array and applies highlights
          decorations: (state) => searchKey.getState(state).decos,
        },
      }),
    ];
  },
});

export { CustomSearchHighlight };
