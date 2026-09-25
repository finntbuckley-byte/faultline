import { NextResponse } from "next/server";
import { z } from "zod";
import { applyAction, getState } from "@/lib/server/store";
import type { Action } from "@/lib/types";

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(64);
// Clients may send every action except "report", which must go through /api/report (AI triage).
const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("inject"), cardId: id }),
  z.object({ type: z.literal("step"), faultId: id, index: z.number().int().min(0).max(20), outcome: z.enum(["worked", "failed"]).nullable() }),
  z.object({ type: z.literal("resolve"), faultId: id, note: z.string().max(500).optional() }),
  z.object({ type: z.literal("escalate"), faultId: id }),
  z.object({ type: z.literal("start"), faultId: id, assignee: z.string().min(1).max(60) }),
  z.object({ type: z.literal("close"), faultId: id, rootCause: z.string().min(1).max(500) }),
  z.object({ type: z.literal("reset") }),
]);

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    return NextResponse.json(await getState(), { headers: noStore });
  } catch (e) {
    console.error("state GET failed", e);
    return NextResponse.json({ error: "State unavailable" }, { status: 503, headers: noStore });
  }
}

export async function POST(req: Request) {
  const parsed = ActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  try {
    return NextResponse.json(await applyAction(parsed.data as Action), { headers: noStore });
  } catch (e) {
    console.error("state POST failed", e);
    return NextResponse.json({ error: "Couldn't save that change. Try again." }, { status: 503, headers: noStore });
  }
}
