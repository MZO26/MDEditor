import type { Metadata } from "@shared/types";
import type { JSONContent } from "@tiptap/core";
import { UNTITLED } from "./constants";
import type { EditorDoc } from "./schemas/editor-schema";

function getMetadata(content: EditorDoc): Metadata {
  const { left } = getTodoStats(content);
  return {
    snippet: snippetGenerator(content),
    todos_left: left,
    links: getLinks(content),
    tags: getTags(content),
  };
}

// function* iterateLines(text: string): IterableIterator<string> {
//   let start = 0;
//   while (start < text.length) {
//     let end = text.indexOf("\n", start);
//     if (end === -1) end = text.length;
//     yield text.slice(start, end);
//     start = end + 1;
//   }
// }

// function titleGenerator(text: string) {
//   if (typeof text !== "string") return "New Note";
//   for (let line of iterateLines(text)) {
//     line = line.replace(/#[\p{L}\p{N}_]+/gu, "").trim();
//     if (line) return line.length > 50 ? line.slice(0, 47) + "..." : line;
//   }
//   return "New Note";
// }

function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractText).join("");
  }
  return "";
}

function titleGenerator(doc: EditorDoc): string {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return UNTITLED;
  }
  const firstBlock = doc.content[0];
  if (
    firstBlock &&
    (firstBlock.type === "heading" || firstBlock.type === "paragraph")
  ) {
    const text = extractText(firstBlock).trim();
    if (text) return truncateTitle(text);
  }
  for (const block of doc.content) {
    if (block.type === "paragraph" || block.type === "heading") {
      const text = extractText(block).trim();
      if (text) return truncateTitle(text);
    }
  }
  return UNTITLED;
}

function truncateTitle(text: string): string {
  return text.length > 50 ? text.slice(0, 47) + "..." : text;
}

// function snippetGenerator(text: string) {
//   if (typeof text !== "string") return "";
//   let snippet = "";
//   let validLineCount = 0;
//   for (let line of iterateLines(text)) {
//     line = line.replace(/#[\p{L}\p{N}_]+/gu, "").trim();
//     if (!line) continue;
//     validLineCount++;
//     if (validLineCount === 1) continue;
//     snippet += (snippet.length > 0 ? " " : "") + line;
//     if (snippet.length >= 50) break;
//   }
//   const cleanedSnippet = snippet.replace(/\s{2,}/g, " ").trim();
//   return cleanedSnippet.length > 47
//     ? cleanedSnippet.slice(0, 47) + "..."
//     : cleanedSnippet;
// }

function snippetGenerator(doc: EditorDoc | undefined): string {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return "";
  }
  let snippet = "";
  let skippedTitle = false;
  for (const block of doc.content) {
    if (block.type !== "paragraph" && block.type !== "heading") continue;
    const text = extractText(block).trim();
    if (!text) continue;
    if (!skippedTitle) {
      skippedTitle = true;
      continue;
    }
    snippet += (snippet.length > 0 ? " " : "") + text;
    if (snippet.length >= 50) break;
  }
  const cleaned = snippet.replace(/\s+/g, " ").trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + "..." : cleaned;
}

function getTodoStats(doc: EditorDoc) {
  let total = 0;
  let completed = 0;
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return { total, completed, left: 0 };
  }
  const stack: JSONContent[] = [doc.content];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.type === "taskItem") {
      total++;
      if (node.attrs?.["checked"]) {
        completed++;
      }
    }
    const content = node.content;
    if (content) {
      for (let i = 0, len = content.length; i < len; i++) {
        const child = content[i];
        if (child) {
          stack.push(child);
        }
      }
    }
  }
  return {
    total,
    completed,
    left: total - completed,
  };
}

function getLinks(doc: EditorDoc) {
  if (!doc) return [];
  const seen = new Set<string>();
  const stack: JSONContent[] = [doc];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.content) {
      for (let i = node.content.length - 1; i >= 0; i--) {
        stack.push(node.content[i] as JSONContent);
      }
    }
    if (node.type !== "wikilink" || !node.attrs?.["id"]) continue;
    const linkId = node.attrs["id"];
    if (seen.has(linkId)) continue;
    seen.add(linkId);
  }
  return Array.from(seen);
}

function getTags(doc: EditorDoc) {
  if (!doc) return [];
  const seen = new Set<string>();
  const stack: JSONContent[] = [doc.content];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.content) {
      for (let i = node.content.length - 1; i >= 0; i--) {
        stack.push(node.content[i] as JSONContent);
      }
    }
    if (node.type !== "noteTag" || !node.attrs?.["id"]) continue;
    const tagText = node.attrs["id"].trim().toLowerCase();
    if (tagText.length === 0 || tagText.length > 40) continue;
    if (seen.has(tagText)) continue;
    seen.add(tagText);
    if (seen.size === 3) break;
  }
  return Array.from(seen);
}

export { getMetadata, getTodoStats, snippetGenerator, titleGenerator };
