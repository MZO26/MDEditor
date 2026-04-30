import { getTodoStats } from "@/extensions/toDoBar";
import type { NoteData } from "@shared/types";
import type { JSONContent } from "@tiptap/core";

function getNoteData(
  content: {
    type: "doc";
    content: JSONContent[];
    attrs?: Record<string, unknown> | undefined;
  },
  plainText: unknown,
): NoteData {
  const { left } = getTodoStats(content);
  return {
    title: titleGenerator(plainText),
    snippet: snippetGenerator(plainText),
    todos_left: left,
    tags: tagsGenerator(plainText),
    stringifiedContent: JSON.stringify(content),
    now: new Date().toISOString(),
  };
}

function* iterateLines(text: string): IterableIterator<string> {
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;
    yield text.slice(start, end);
    start = end + 1;
  }
}

function titleGenerator(text: unknown): string {
  if (typeof text !== "string") return "New Note";

  for (let line of iterateLines(text)) {
    line = line.replace(/#[\p{L}\p{N}_]+/gu, "").trim();
    if (line) return line;
  }
  return "New Note";
}

function snippetGenerator(text: unknown) {
  if (typeof text !== "string") return "";
  let snippet = "";
  let validLineCount = 0;
  for (let line of iterateLines(text)) {
    line = line.replace(/#[\p{L}\p{N}_]+/gu, "").trim();
    if (!line) continue;
    validLineCount++;
    if (validLineCount === 1) continue;
    snippet += (snippet.length > 0 ? " " : "") + line;
    if (snippet.length >= 50) break;
  }
  return snippet
    .replace(/\s{2,}/g, " ")
    .substring(0, 50)
    .trim();
}

function tagsGenerator(input: unknown): string[] {
  if (typeof input !== "string") return [];
  const arr: string[] = [];
  const seen = new Set<string>();
  for (const tag of input.match(/#[\p{L}\p{N}_]+/gu) ?? []) {
    const t = tag.slice(1);
    if (seen.has(t)) continue;
    seen.add(t);
    arr.push(t);
    if (arr.length === 3) break;
  }
  return arr;
}

function ftsQueryGenerator(searchTerm: unknown): string {
  if (typeof searchTerm !== "string") return "";
  const cleanSearch = searchTerm.replace(/[^\p{L}\p{N}\s]/gu, " ");
  const ftsQuery = cleanSearch
    .split(/\s+/)
    .filter((word: string) => word.length > 0)
    .map((word: string) => `"${word}"*`)
    .join(" AND ");
  return ftsQuery;
}

export {
  ftsQueryGenerator,
  getNoteData,
  snippetGenerator,
  tagsGenerator,
  titleGenerator,
};
