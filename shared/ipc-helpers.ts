import type { Result } from "@shared/types";
import z from "zod";
import { AppErrorCode } from "./constants";

function validation<T extends z.ZodType>(
  schema: T,
  payload: unknown,
): z.infer<T> {
  const validation = schema.safeParse(payload);
  if (!validation.success) {
    console.error(
      "Validation failed:",
      JSON.stringify(validation.error, null, 2),
    );
    console.dir(validation.error.issues, { depth: null });
    throw validation.error;
  }
  return validation.data;
}

async function safeInvoke<T>(
  ipcPromise: Promise<Result<T>>,
): Promise<Result<T>> {
  try {
    return await ipcPromise;
  } catch (err: unknown) {
    console.error("[IPC Bridge Connection Error]: ", err);
    return { success: false, error: AppErrorCode.UnknownError };
  }
}

function measure<T>(fn: () => T) {
  const start = performance.now();
  fn();
  const end = performance.now();
  return Math.round((end - start) * 100) / 100;
}

export { measure, safeInvoke, validation };
