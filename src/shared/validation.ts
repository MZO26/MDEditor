import z from "zod";
import { ImagePayloadSchema } from "./schemas/imageSchema";
import {
  CreateNotePayloadSchema,
  IdSchema,
  SearchSchema,
  UpdateNotePayloadSchema,
} from "./schemas/noteSchema";
import { StoreSchema } from "./schemas/storeSchema";

function validation<T>(schema: z.ZodType<T>, payload: unknown): T {
  const validation = schema.safeParse(payload);
  if (!validation.success) {
    console.error("Validation failed:", z.treeifyError(validation.error));

    throw validation.error;
  }
  return validation.data;
}

function validateUpdate(payload: unknown) {
  return validation(UpdateNotePayloadSchema, payload);
}

function validateCreate(payload: unknown) {
  return validation(CreateNotePayloadSchema, payload);
}

function validateId(id: unknown) {
  return validation(IdSchema, id);
}

function validateSearch(searchTerm: unknown, limit: unknown) {
  return validation(SearchSchema, { searchTerm, limit });
}

function validateStore(key: unknown, val: unknown) {
  const keyValidation = StoreSchema.keyof().safeParse(key);
  if (!keyValidation.success) {
    console.error("Validation failed:", z.treeifyError(keyValidation.error));
    throw keyValidation.error;
  }
  const safeKey = keyValidation.data;
  const validObject = validation(StoreSchema.partial(), { [safeKey]: val });
  return validObject[safeKey];
}

function validateTheme(theme: unknown) {
  return validation(StoreSchema.shape.theme, theme);
}

function validateImage(payload: unknown) {
  return validation(ImagePayloadSchema, payload);
}

export {
  validateCreate,
  validateId,
  validateImage,
  validateSearch,
  validateStore,
  validateTheme,
  validateUpdate,
};
