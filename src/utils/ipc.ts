import type { IpcResponse } from "@shared/types";

async function safeIpcCall<T>(
  ipcPromise: Promise<IpcResponse<T>>,
): Promise<IpcResponse<T>> {
  try {
    return await ipcPromise;
  } catch (error) {
    console.error("IPC error: ", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown communication error occurred";

    return { success: false, message: errorMessage };
  }
}

export { safeIpcCall };
