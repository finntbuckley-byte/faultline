import { NextResponse } from "next/server";
import { z } from "zod";
import { cardById, matchCard } from "@/lib/data";
import { readPhoto, retrieve, transcribe, triage as runTriage, openai } from "@/lib/server/ai";
import { applyAction, getState } from "@/lib/server/store";
import type { Triage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  machineId: z.string().min(1).max(64),
  faultId: z.string().min(4).max(64),
  text: z.string().max(2000).default(""),
  // data:image/...;base64,... (client downsizes to ~1600px JPEG before sending)
  photo: z.string().startsWith("data:image/").max(4_000_000).optional(),
  // data:audio/...;base64,... recorded on devices without live speech recognition (max ~30 s)
  audio: z.string().startsWith("data:audio/").max(4_000_000).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  const { machineId, faultId, photo, audio } = parsed.data;
  let text = parsed.data.text.trim();

  const state = await getState();
  const machine = state.machines.find((m) => m.id === machineId);
  if (!machine) return NextResponse.json({ error: "Unknown machine" }, { status: 404 });
  const machineLabel = `${machine.name} (${machine.model})`;
  const alarmCard = machine.alarm ? cardById(machine.alarm) : undefined;

  // 0. Voice note -> text.
  if (audio && openai()) {
    try {
      const heard = await transcribe(audio);
      text = [text, heard].filter(Boolean).join(". ");
    } catch (e) {
      console.error("transcription failed", e);
    }
  }

  // 1. Photo -> error code / display text.
  let code: string | null = null;
  if (photo && openai()) {
    try {
      const reading = await readPhoto(photo, machineLabel);
      code = reading.errorCode;
      const seen = [reading.errorCode && `Display shows ${reading.errorCode}`, reading.displayText, reading.visibleIssue].filter(Boolean).join(". ");
      text = [text, seen].filter(Boolean).join(". ");
    } catch (e) {
      console.error("photo read failed", e);
    }
  }
  if (!text && alarmCard) {
    text = alarmCard.symptom;
    code ??= alarmCard.code ?? null;
  }
  if (!text) text = "Machine stopped, cause unknown";

  // 2. Retrieval + grounded triage; fall back to curated demo content if anything fails.
  let triage: Triage | undefined;
  let grounded = false;
  try {
    const excerpts = openai() ? await retrieve(machineId, `${text} ${code ?? ""}`.trim(), code) : [];
    if (excerpts.length) {
      const notes = state.faults
        .filter((f) => f.machineId === machineId && f.status === "resolved" && f.rootCause)
        .slice(0, 5)
        .map((f) => `${f.report} -> ${f.rootCause}`);
      const t = await runTriage(machineLabel, text, excerpts, notes);
      if (t.steps.length) {
        const { covered, ...rest } = t;
        void covered;
        triage = rest;
        grounded = true;
      }
    }
  } catch (e) {
    console.error("triage failed, using fallback", e);
  }
  if (!triage) {
    const card = alarmCard ?? matchCard(machineId, text);
    triage = card?.triage;
    code ??= card?.code ?? null;
  }
  if (!triage) return NextResponse.json({ error: "Couldn't triage this fault" }, { status: 502 });

  const next = await applyAction({ type: "report", machineId, report: text, faultId, triage, code: code ?? undefined, grounded });
  return NextResponse.json({ faultId, grounded, state: next }, { headers: { "Cache-Control": "no-store" } });
}
