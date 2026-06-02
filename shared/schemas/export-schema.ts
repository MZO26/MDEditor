import { UNTITLED } from "@shared/constants";
import { DateSchema, TitleSchema } from "@shared/schemas/note-schema";
import z from "zod";

const normalizeFileName = (val: string): string => {
  if (!val) return UNTITLED;

  return (
    val
      .normalize("NFC") // ensures consistent unicode representation ('é' as one char)
      .trim()
      .replace(/[\x00-\x1f\x80-\x9f]/g, "")
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^\.+|\.+$/g, "")
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..+)?$/i, "_$1$2")
      .slice(0, 200) || UNTITLED
  );
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
  StringContentSchema,
  SyncRequestSchema,
  WriteMirrorRequestSchema,
  type DeleteMirrorRequest,
  type ExportManyRequest,
  type ExportRequest,
  type ImportRequest,
  type SyncRequest,
  type WriteMirrorRequest,
};
