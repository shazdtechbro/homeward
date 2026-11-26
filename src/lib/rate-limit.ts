import { AppError } from "./errors";

type Window = { count: number; resetAt: number };

/**
 * Fixed-window limiter held in process memory. Fine for one instance and the
 * demo; production puts AWS WAF rate rules in front and keeps this as a backstop.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, Window>();

  return function check(key: string, now = Date.now()) {
    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    current.count += 1;
    if (current.count > limit) {
      throw new AppError("rate_limited", "Too many searches. Give it a minute and try again.");
    }
  };
}

export function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}
