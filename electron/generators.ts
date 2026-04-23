import type { JSONContent } from "@tiptap/core";
import {
  snippetGenerator,
  tagsGenerator,
  titleGenerator,
} from "../shared/generators/generators";

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
  plainText: unknown,
): NoteData {
  return {
    title: titleGenerator(plainText),
    snippet: snippetGenerator(plainText),
    tags: tagsGenerator(plainText),
    stringifiedContent: JSON.stringify(content),
    now: new Date().toISOString(),
  };
}

export { getNoteData };
