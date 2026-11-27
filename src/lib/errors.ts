export type ErrorCode =
  "invalid_input" | "unauthorized" | "not_found" | "rate_limited" | "internal";

const STATUS: Record<ErrorCode, number> = {
  invalid_input: 400,
  unauthorized: 401,
  not_found: 404,
  rate_limited: 429,
  internal: 500,
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status() {
    return STATUS[this.code];
  }
}

export function toErrorResponse(error: unknown) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError("internal", "Something went wrong on our side.");
  return Response.json(
    { error: { code: appError.code, message: appError.message } },
    { status: appError.status },
  );
}
