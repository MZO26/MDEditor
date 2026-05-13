import type { Result } from "@shared/types";

async function safeInvoke<T>(
  ipcPromise: Promise<Result<T>>,
): Promise<Result<T>> {
  try {
    return await ipcPromise;
  } catch (err: unknown) {
    console.error("IPC error: ", err);
    const msg =
      err instanceof Error
        ? err.message
        : "An unknown communication error occurred";

    return { success: false, message: msg };
  }
}

export { safeInvoke };
