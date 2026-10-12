import Order from "@/models/order";
import mongodbConnect from "@/utils/mongoConnect";
import { fail } from "@/lib/http";
import { requireRole } from "@/lib/session";
import { buildTrackPayload, isTerminalStatus, TrackableOrder } from "@/lib/trackPayload";

export const dynamic = "force-dynamic";

function orderIdFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.indexOf("orders") + 1] ?? "";
}

const TICK_MS = 4000;
const MAX_TICKS = 150; // ~10 minutes; the browser's EventSource reconnects after.

/**
 * Server-Sent Events stream of tracking updates for the order's owner. The
 * server polls the order every few seconds and pushes a `data:` frame only when
 * the payload changes, closing once the order reaches a terminal state (or the
 * client disconnects). This is the "push" transport; the plain GET endpoint
 * remains as a fallback. SSE is chosen over raw WebSockets because it needs no
 * custom server and rides the existing auth cookie.
 *
 * Note: very long-lived connections can be cut by serverless platforms; the
 * client reconnects automatically and falls back to polling if SSE is
 * unavailable.
 */
export async function GET(req: Request): Promise<Response> {
  const { user, response } = await requireRole();
  if (response) return response;

  const conn = await mongodbConnect();
  if (!conn) return fail("Database is not available", 503);

  const id = orderIdFromUrl(req.url);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastJson = "";
      let ticks = 0;
      let interval: ReturnType<typeof setInterval>;

      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const tick = async () => {
        try {
          const order = await Order.findOne({ _id: id, user_id: user.id }).lean();
          if (!order) {
            controller.enqueue(encoder.encode("event: notfound\ndata: {}\n\n"));
            cleanup();
            return;
          }
          const payload = buildTrackPayload(order as unknown as TrackableOrder);
          const json = JSON.stringify(payload);
          if (json !== lastJson) {
            lastJson = json;
            controller.enqueue(encoder.encode(`data: ${json}\n\n`));
          }
          if (isTerminalStatus(payload.status) || ++ticks >= MAX_TICKS) cleanup();
        } catch {
          cleanup();
        }
      };

      // Ask the browser to wait 5s before reconnecting.
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      interval = setInterval(tick, TICK_MS);
      req.signal.addEventListener("abort", cleanup);
      await tick(); // push an immediate first frame
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
