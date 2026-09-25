import { NextResponse } from "next/server";
import { initialState, reduce } from "@/lib/reducer";
import type { Action, FactoryState } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * In-memory shared state so a projector, a phone and a laptop see the same floor.
 * Works when one server process runs (npm run dev / npm start on a laptop).
 * Swap for Supabase realtime before relying on it in a multi-instance deploy.
 */
const g = globalThis as unknown as { __faultline?: FactoryState };
const get = () => (g.__faultline ??= initialState());

const ACTIONS = new Set(["inject", "report", "step", "resolve", "escalate", "start", "close", "reset"]);

export async function GET() {
  return NextResponse.json(get(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  let action: Action;
  try {
    action = (await req.json()) as Action;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!action || typeof action !== "object" || !ACTIONS.has(action.type)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (action.type === "report" && (typeof action.report !== "string" || action.report.length > 2000)) {
    return NextResponse.json({ error: "Report too long" }, { status: 400 });
  }
  g.__faultline = reduce(get(), action, Date.now());
  return NextResponse.json(g.__faultline, { headers: { "Cache-Control": "no-store" } });
}
