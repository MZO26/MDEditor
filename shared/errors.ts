enum WorkerErrorCode {
  CompressionError = "COMPRESSION_FAILED",
  InvalidImageError = "INVALID_IMAGE",
  UnknownError = "UNKNOWN_ERROR",
}

enum AppErrorCode {
  DBError = "DB_ERROR",
  InvalidData = "INVALID_DATA",
  FileWriteError = "FILE_WRITE_ERROR",
  RateLimitError = "RATE_LIMIT",
  SenderError = "UNAUTHORIZED_SENDER",
  UnknownError = "UNKNOWN_ERROR",
  CancelledOperation = "CANCELLED_OPERATION",
  CompressionError = "COMPRESSION_ERROR",
  InvalidImageError = "INVALID_IMAGE_ERROR",
  ExportError = "EXPORT_ERROR",
}

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.DBError]: "Failed to access database.",
  [AppErrorCode.InvalidData]: "Couldn't read the notes' data.",
  [AppErrorCode.FileWriteError]: "Failed to write file.",
  [AppErrorCode.RateLimitError]: "Too many attempts. Please wait.",
  [AppErrorCode.SenderError]: "Action blocked for security.",
  [AppErrorCode.UnknownError]: "An unexpected error occurred.",
  [AppErrorCode.CancelledOperation]: "Operation cancelled.",
  [AppErrorCode.CompressionError]: "Failed to compress file.",
  [AppErrorCode.InvalidImageError]: "Unsupported image format.",
  [AppErrorCode.ExportError]: "Export failed.",
};

export { AppErrorCode, ERROR_MESSAGES, WorkerErrorCode };
