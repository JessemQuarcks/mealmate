import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

type LogLevel = "info" | "warn" | "error";

/**
 * Forward warn/error logs to an external sink when `LOG_SINK_URL` is set
 * (a webhook — Sentry, Datadog, Logtail, a Slack incoming webhook, …). Best
 * effort and fire-and-forget: observability must never break a request.
 */
function forwardToSink(level: LogLevel, msg: string, meta?: unknown): void {
  const url = process.env.LOG_SINK_URL;
  if (!url || level === "info") return;
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        msg,
        meta: meta instanceof Error ? { message: meta.message, stack: meta.stack } : meta,
        service: "mealmate",
        at: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from logging */
  }
}

/**
 * Structured logger with a pluggable sink. Console always; warn/error also go
 * to `LOG_SINK_URL` when configured, so production has real monitoring without
 * changing any call site.
 */
export const logger = {
  info: (msg: string, meta?: unknown) => console.log(`[info] ${msg}`, meta ?? ""),
  warn: (msg: string, meta?: unknown) => {
    console.warn(`[warn] ${msg}`, meta ?? "");
    forwardToSink("warn", msg, meta);
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[error] ${msg}`, meta ?? "");
    forwardToSink("error", msg, meta);
  },
};

/** Consistent success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Consistent error envelope. */
export function fail(messages: string | string[], status = 400) {
  const errors = Array.isArray(messages) ? messages : [messages];
  return NextResponse.json({ success: false, errors }, { status });
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns either the typed data or a ready-to-return error response.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { data: null, error: fail("Request body must be valid JSON", 400) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const messages = (result.error as ZodError).issues.map(
      (i) => `${i.path.join(".") || "body"}: ${i.message}`
    );
    return { data: null, error: fail(messages, 422) };
  }
  return { data: result.data, error: null };
}

/**
 * Wrap a route handler so any unexpected throw becomes a logged 500 instead of
 * leaking a stack trace to the client.
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (err) {
      // A short reference the user can quote to support; it ties their report
      // to the logged error without leaking a stack trace.
      const errorId = Math.random().toString(36).slice(2, 10);
      logger.error("Unhandled route error", {
        errorId,
        method: req.method,
        url: req.url,
        err,
      });
      return fail(`Something went wrong. Please try again. (ref ${errorId})`, 500);
    }
  };
}
