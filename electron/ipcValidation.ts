import { app, type IpcMainInvokeEvent } from "electron";
import z, { ZodError } from "zod";

type IpcResponse<T> =
  | { success: true; data: T }
  | {
      success: false;
      message: string;
      errors?: Record<string, string[] | undefined>;
    };

function validateSender(event: IpcMainInvokeEvent) {
  if (!event.senderFrame) {
    console.error("Blocked: IPC Without valid senderFrame");
    throw new Error("UNAUTHORIZED_SENDER");
  }
  const senderUrl = new URL(event.senderFrame.url);
  if (!app.isPackaged) {
    const allowedDevOrigins = ["http://localhost:5173"];
    if (allowedDevOrigins.includes(senderUrl.origin)) {
      return true;
    }
  }
  const allowedProtocols = ["appimg:", "file:"];
  if (allowedProtocols.includes(senderUrl.protocol)) {
    return true;
  }
  console.error(`Blocked senderFrame: ${senderUrl.href}`);
  throw new Error("UNAUTHORIZED_SENDER");
}

async function handleIpc<T>(
  event: IpcMainInvokeEvent,
  action: () => T,
): Promise<IpcResponse<T>> {
  try {
    validateSender(event);
    const data = await action();
    return { success: true, data };
  } catch (err: any) {
    console.error("[IPC Error]:", err);

    if (err instanceof ZodError) {
      return {
        success: false,
        message: "Invalid data provided",
        errors: z.treeifyError(err),
      };
    }
    if (err.message === "NOT_FOUND") {
      return {
        success: false,
        message: "Note not found",
      };
    }
    return { success: false, message: "An unexpected error occurred." };
  }
}

export { handleIpc };
