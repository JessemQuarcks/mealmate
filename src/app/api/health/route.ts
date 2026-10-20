import { NextResponse } from "next/server";
import mongodbConnect from "@/utils/mongoConnect";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for load balancers and uptime monitors. Reports DB
 * connectivity; 200 when healthy, 503 when the database is unreachable. No auth.
 */
export async function GET(): Promise<NextResponse> {
  let db = false;
  try {
    db = !!(await mongodbConnect());
  } catch {
    db = false;
  }

  const body = {
    status: db ? "ok" : "degraded",
    db,
    uptime: Math.round(process.uptime()),
    time: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: db ? 200 : 503 });
}
