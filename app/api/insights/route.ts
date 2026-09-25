import { NextResponse } from "next/server";
import { INSIGHTS, MACHINES, WEEK_HISTORY } from "@/lib/data";
import { MODELS, openai } from "@/lib/server/ai";
import { getState } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Card {
  machineId: string;
  title: string;
  evidence: string;
  recommendation: string;
}

const g = globalThis as unknown as { __insights?: { key: string; at: number; cards: Card[] } };
const TTL_MS = 10 * 60 * 1000;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Pattern cards over last week's history plus faults logged live in the app. */
export async function GET() {
  const state = await getState();
  const nameOf = (id: string) => MACHINES.find((m) => m.id === id)?.name ?? id;
  const lines = [
    ...WEEK_HISTORY.map((e) => {
      const hour = Math.floor(e.hour % 24);
      return `${DAYS[Math.floor(e.hour / 24)]} ${String(hour).padStart(2, "0")}:00 | ${nameOf(e.machineId)} | ${e.label} | ${e.night ? "night" : "day"} shift | down ${e.durationHours} h`;
    }),
    ...state.faults.map(
      (f) => `today | ${nameOf(f.machineId)} | ${f.report.slice(0, 80)} | status ${f.status}${f.rootCause ? ` | root cause: ${f.rootCause}` : ""}`,
    ),
  ];
  const key = String(lines.length) + (state.faults[0]?.id ?? "");
  if (g.__insights && g.__insights.key === key && Date.now() - g.__insights.at < TTL_MS) {
    return NextResponse.json({ cards: g.__insights.cards, ai: true });
  }

  const ai = openai();
  if (!ai) return NextResponse.json({ cards: INSIGHTS, ai: false });
  try {
    const res = await ai.chat.completions.create({
      model: MODELS.vision,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "insights",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              cards: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    machineId: { type: "string", enum: MACHINES.map((m) => m.id) },
                    title: { type: "string", description: "Headline under 70 characters, starting with the machine name." },
                    evidence: { type: "string", description: "The specific counts, shifts and downtime hours that show the pattern." },
                    recommendation: { type: "string", description: "One concrete root-cause fix and the expected saving." },
                  },
                  required: ["machineId", "title", "evidence", "recommendation"],
                },
              },
            },
            required: ["cards"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a reliability engineer reviewing a small plant's fault log. Find the 2-3 most valuable patterns: repeat faults, shift correlations, downtime hot spots. Be specific with numbers from the log. Never invent events. Machine ids: " +
            MACHINES.map((m) => `${m.id}=${m.name} (${m.model})`).join(", "),
        },
        { role: "user", content: lines.join("\n") },
      ],
    });
    const cards = (JSON.parse(res.choices[0].message.content ?? "{}").cards ?? []) as Card[];
    if (!cards.length) throw new Error("no cards");
    g.__insights = { key, at: Date.now(), cards };
    return NextResponse.json({ cards, ai: true });
  } catch (e) {
    console.error("insights failed", e);
    return NextResponse.json({ cards: INSIGHTS, ai: false });
  }
}
