import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

/**
 * Minimal structured logger. Swap the sink for a real service (e.g. Sentry,
 * Datadog) in Phase 0's monitoring task without touching call sites.
 */
export const logger = {
  info: (msg: string, meta?: unknown) => console.log(`[info] ${msg}`, meta ?? ""),
  warn: (msg: string, meta?: unknown) => console.warn(`[warn] ${msg}`, meta ?? ""),
  error: (msg: string, meta?: unknown) => console.error(`[error] ${msg}`, meta ?? ""),
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
      logger.error("Unhandled route error", err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
