import z from "zod";

const ImagePayloadSchema = z.object({
  extension: z.enum(["jpeg", "png", "gif", "webp"]).default("webp"),
  imageData: z.custom<Uint8Array>((val) => val instanceof Uint8Array),
});

const ImagePayloadsSchema = z.array(ImagePayloadSchema);

type ImageExtension = z.infer<typeof ImagePayloadSchema>["extension"];
type ImagePayload = z.infer<typeof ImagePayloadSchema>;

export {
  ImagePayloadSchema,
  ImagePayloadsSchema,
  type ImageExtension,
  type ImagePayload,
};
