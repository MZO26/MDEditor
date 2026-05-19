import type { Failure } from "@shared/types";
import z, { ZodError } from "zod";

enum AppError {
  DBError = "NOT_FOUND",
  RateLimitError = "RATE_LIMIT",
  SenderError = "UNAUTHORIZED_SENDER",
  UnknownError = "UNKNOWN_ERROR",
  InvalidViewError = "INVALID_VIEW",
  CancelledOperation = "CANCELLED_OPERATION",
  CompressionError = "COMPRESSION_ERROR",
  InvalidImageError = "INVALID_IMAGE_ERROR",
  InvalidDbAction = "INVALID_ACTION",
}

function handleIpcError(err: unknown): Failure {
  if (err instanceof ZodError) {
    console.error(
      "[IPC Validation]: ",
      JSON.stringify(z.treeifyError(err), null, 2),
    );
    return { success: false, message: "Invalid data provided." };
  }
  // check if it's an error object and show the message in console for debugging. If it's no error object, just return the string
  const errorCode =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : AppError.UnknownError;
  console.error("[IPC]: ", errorCode);

  switch (errorCode) {
    case AppError.SenderError:
      return { success: false, message: "Unauthorized request." };

    case AppError.RateLimitError:
      return {
        success: false,
        message: "Too many requests. Please try again.",
      };

    case AppError.DBError:
      return { success: false, message: "Requested item could not be found." };

    case AppError.InvalidViewError:
      return { success: false, message: "View not found." };

    case AppError.CancelledOperation:
      return { success: false, message: "Operation cancelled." };

    case AppError.CompressionError:
      return { success: false, message: "Failed to process the image." };

    case AppError.InvalidImageError:
      return { success: false, message: "Image is damaged or unsupported" };

    case AppError.InvalidDbAction:
      return { success: false, message: "Action not found" };

    case AppError.UnknownError:
    default:
      return { success: false, message: "Unknown error occurred." };
  }
}

export { handleIpcError };
