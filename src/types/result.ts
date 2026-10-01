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
  | "already_exists"
  | "weak_password"
  | "invalid_input"
  | "provider_disabled"
  | "link_other_device"
  | "link_expired"
  | "min_age"
  | "not_found"
  | "unknown";
