import type { JSONContent } from "@tiptap/core";
import { generateSnippet } from "../src/shared/generationHelpers.ts/snippet";
import { generateTags } from "../src/shared/generationHelpers.ts/tags";
import { generateTitle } from "../src/shared/generationHelpers.ts/title";

interface NoteData {
  title: string;
  snippet: string;
  tags: string[];
  stringifiedContent: string;
  now: string;
}

function getNoteData(
  content: {
    type: "doc";
    content: JSONContent[];
    attrs?: Record<string, unknown> | undefined;
  },
  plainText: string,
): NoteData {
  return {
    title: generateTitle(plainText),
    snippet: generateSnippet(plainText),
    tags: generateTags(plainText),
    stringifiedContent: JSON.stringify(content),
    now: new Date().toISOString(),
  };
}

export { getNoteData };
