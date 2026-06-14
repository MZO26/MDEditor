import { UNTITLED } from "@shared/constants";
import { DateSchema, TitleSchema } from "@shared/schemas/note-schema";
import z from "zod";

const truncateAtBoundary = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) return input;
  const slice = input.slice(0, maxLength);
  const breakpoints = [" ", "-", "_", "."];
  let cut = -1;
  for (const bp of breakpoints) {
    cut = Math.max(cut, slice.lastIndexOf(bp));
  }
  return (cut > 0 ? slice.slice(0, cut) : slice).trim();
};

const normalizeFileName = (val: string): string => {
  if (!val) return UNTITLED;
  const safe = truncateAtBoundary(
    val
      .normalize("NFC")
      .trim()
      .replace(/[\x00-\x1f\x80-\x9f]/g, "")
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, " ")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "")
      .replace(/[. ]+$/g, "")
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..+)?$/i, "_$1$2"),
    200,
  ).replace(/[. ]+$/g, "");
  return safe || UNTITLED;
};

const FileNameSchema = z
  .string()
  .transform(normalizeFileName)
  .pipe(z.string().min(1).max(255));

// for md, txt, html and pdf (because html is used for pdf)
const StringContentSchema = z
  .string()
  .max(10_000_000, "Content exceeds maximum size")
  .optional()
  .transform((val) => {
    if (!val || val.trim() === "") {
      return UNTITLED;
    }
    return val;
  });

const ExportBaseSchema = z.object({
  id: z.string(),
  fileName: FileNameSchema,
  content: StringContentSchema,
});

const MdSchema = ExportBaseSchema.extend({
  extension: z.literal("md"),
});

const TxtSchema = ExportBaseSchema.extend({
  extension: z.literal("txt"),
});

const HtmlSchema = ExportBaseSchema.extend({
  extension: z.literal("html"),
});

const JsonSchema = ExportBaseSchema.extend({
  extension: z.literal("json"),
});

const PdfSchema = ExportBaseSchema.extend({
  extension: z.literal("pdf"),
});

const ExportRequestSchema = z.discriminatedUnion("extension", [
  HtmlSchema,
  MdSchema,
  TxtSchema,
  JsonSchema,
  PdfSchema,
]);

const WriteMirrorRequestSchema = MdSchema.extend({
  oldFileName: TitleSchema.optional(),
});

const DeleteMirrorRequestSchema = MdSchema.omit({
  content: true,
});

const SyncRequestSchema = MdSchema.extend({ updated_at: DateSchema });

const OpenSyncRequestSchema = SyncRequestSchema.omit({ content: true });

const ExportItemSchema = z.discriminatedUnion("extension", [
  HtmlSchema,
  MdSchema,
  TxtSchema,
  JsonSchema,
  PdfSchema,
]);

const ExportManyRequestSchema = z.array(ExportItemSchema);

const ImportRequestSchema = z.discriminatedUnion("extension", [
  HtmlSchema.omit({ id: true }),
  MdSchema.omit({ id: true }),
  TxtSchema.omit({ id: true }),
  JsonSchema.omit({ id: true }),
]);

type OpenSyncRequest = z.infer<typeof OpenSyncRequestSchema>;
type SyncRequest = z.infer<typeof SyncRequestSchema>;
type WriteMirrorRequest = z.infer<typeof WriteMirrorRequestSchema>;
type DeleteMirrorRequest = z.infer<typeof DeleteMirrorRequestSchema>;
type ExportManyRequest = z.infer<typeof ExportManyRequestSchema>;
type ImportRequest = z.infer<typeof ImportRequestSchema>;
type ExportRequest = z.infer<typeof ExportRequestSchema>;

export {
  DeleteMirrorRequestSchema,
  ExportManyRequestSchema,
  ExportRequestSchema,
  FileNameSchema,
  ImportRequestSchema,
  OpenSyncRequestSchema,
  StringContentSchema,
  SyncRequestSchema,
  WriteMirrorRequestSchema,
  type DeleteMirrorRequest,
  type ExportManyRequest,
  type ExportRequest,
  type ImportRequest,
  type OpenSyncRequest,
  type SyncRequest,
  type WriteMirrorRequest,
};
