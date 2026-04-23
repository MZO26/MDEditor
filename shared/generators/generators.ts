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

export { snippetGenerator, tagsGenerator, titleGenerator };
