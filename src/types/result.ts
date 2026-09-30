/** User-facing error with a safe, human message (never raw backend text). */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type AppErrorCode =
  | "unconfigured"
  | "offline"
  | "unauthorized"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "not_found"
  | "unknown";
