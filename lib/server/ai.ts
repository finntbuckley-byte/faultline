import "server-only";
import OpenAI, { toFile } from "openai";
import type { Triage } from "@/lib/types";
import { admin } from "./supabase";

/**
 * Model choices in one place. OPENAI_BASE_URL lets a local OpenAI-compatible
 * gateway (e.g. OmniRoute) stand in during development; Vercel uses OpenAI directly.
 */
export const MODELS = {
  triage: process.env.FAULTLINE_TRIAGE_MODEL ?? "gpt-4.1",
  vision: process.env.FAULTLINE_VISION_MODEL ?? "gpt-4.1-mini",
  embed: "text-embedding-3-small",
} as const;

let client: OpenAI | null | undefined;
export function openai(): OpenAI | null {
  if (client !== undefined) return client;
  client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined, timeout: 25_000, maxRetries: 1 })
    : null;
  return client;
}

export async function embed(texts: string[]): Promise<number[][]> {
  const ai = openai();
  if (!ai) throw new Error("OPENAI_API_KEY missing");
  const res = await ai.embeddings.create({ model: MODELS.embed, input: texts });
  return res.data.map((d) => d.embedding);
}

/** Transcribe a short voice note sent as a data URL. */
export async function transcribe(dataUrl: string): Promise<string> {
  const ai = openai();
  if (!ai) throw new Error("OPENAI_API_KEY missing");
  const [meta, b64] = dataUrl.split(",", 2);
  const mime = meta.slice(5).split(";")[0] || "audio/webm";
  const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
  const file = await toFile(Buffer.from(b64, "base64"), `voice.${ext}`, { type: mime });
  const res = await ai.audio.transcriptions.create({
    model: "gpt-4o-mini-transcribe",
    file,
    prompt: "A factory machine operator describing a fault: alarms, limit switches, printheads, belts, error codes.",
  });
  return res.text.trim();
}

export interface Reading {
  errorCode: string | null;
  displayText: string;
  visibleIssue: string;
}

/** Read an error code / display text from a photo of the machine. */
export async function readPhoto(dataUrl: string, machine: string): Promise<Reading> {
  const ai = openai();
  if (!ai) throw new Error("OPENAI_API_KEY missing");
  const res = await ai.chat.completions.create({
    model: MODELS.vision,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "reading",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            errorCode: { type: ["string", "null"], description: "Exact alarm/error code shown, e.g. ALARM:1, E07, PRINTHEAD OPEN. null if none visible." },
            displayText: { type: "string", description: "Any other text on the display or indicator lights, verbatim." },
            visibleIssue: { type: "string", description: "Short description of any visible physical problem." },
          },
          required: ["errorCode", "displayText", "visibleIssue"],
        },
      },
    },
    messages: [
      { role: "system", content: `You read machine displays for maintenance. The machine is: ${machine}. Only report what is visible; never guess codes.` },
      { role: "user", content: [{ type: "text", text: "What does this machine's display or indicator show?" }, { type: "image_url", image_url: { url: dataUrl, detail: "high" } }] },
    ],
  });
  return JSON.parse(res.choices[0].message.content ?? "{}") as Reading;
}

export interface Excerpt {
  page: number;
  content: string;
}

/** Retrieve the most relevant manual excerpts for a machine (vector + exact code match). */
export async function retrieve(machineId: string, query: string, code?: string | null): Promise<Excerpt[]> {
  const db = admin();
  if (!db) return [];
  const [vector] = await embed([query]);
  const { data, error } = await db.rpc("match_manual_chunks", { p_machine_id: machineId, p_embedding: vector, p_count: 8 });
  if (error) throw error;
  const hits: Excerpt[] = (data ?? []).map((d: { page: number; content: string }) => ({ page: d.page, content: d.content }));
  if (code && code.length >= 3) {
    const { data: exact } = await db.from("manual_chunks").select("page, content").eq("machine_id", machineId).ilike("content", `%${code.replace(/[%_]/g, "")}%`).limit(4);
    for (const e of exact ?? []) if (!hits.some((h) => h.page === e.page && h.content === e.content)) hits.unshift(e);
  }
  return hits.slice(0, 10);
}

const TRIAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    covered: { type: "boolean", description: "True if the excerpts actually cover this fault." },
    summary: { type: "string" },
    likelyCause: { type: "string" },
    severity: { type: "string", enum: ["operator_fixable", "needs_technician", "stop_now"] },
    safetyFirst: { type: "string" },
    steps: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", description: "One clear action for the operator, imperative voice." },
          page: { type: "integer", description: "Manual page number of the excerpt this step is based on." },
          quote: { type: "string", description: "Short verbatim quote (under 30 words) from that excerpt." },
        },
        required: ["text", "page", "quote"],
      },
    },
    parts: { type: "array", items: { type: "string" }, maxItems: 5 },
  },
  required: ["covered", "summary", "likelyCause", "severity", "safetyFirst", "steps", "parts"],
} as const;

/** Ground a fault report in manual excerpts and return a cited triage. */
export async function triage(machine: string, report: string, excerpts: Excerpt[], plantNotes: string[]): Promise<Triage & { covered: boolean }> {
  const ai = openai();
  if (!ai) throw new Error("OPENAI_API_KEY missing");
  const context = excerpts.map((e) => `[p.${e.page}]\n${e.content}`).join("\n\n---\n\n");
  const res = await ai.chat.completions.create({
    model: MODELS.triage,
    temperature: 0.1,
    response_format: { type: "json_schema", json_schema: { name: "triage", strict: true, schema: TRIAGE_SCHEMA as unknown as Record<string, unknown> } },
    messages: [
      {
        role: "system",
        content: [
          "You are FaultLine, a maintenance assistant for machine operators on a factory floor.",
          "Use ONLY the manual excerpts provided. Every step must cite the page of the excerpt it comes from and include a short verbatim quote from that excerpt.",
          "Put the most important safety action (e-stop, isolate, lock out, let cool) in safetyFirst.",
          "Write for an operator holding a phone: short, concrete, imperative steps, most likely fix first.",
          "If the excerpts do not cover the fault, set covered=false, severity=needs_technician, and give only safe generic checks that are still cited.",
          "severity: operator_fixable if an operator can safely resolve it; needs_technician for electrical/mechanical repair; stop_now if continuing is unsafe or damaging.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Machine: ${machine}\nOperator report: ${report}\n${plantNotes.length ? `\nPrevious fixes on this machine:\n${plantNotes.map((n) => `- ${n}`).join("\n")}\n` : ""}\nManual excerpts:\n\n${context}`,
      },
    ],
  });
  const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
  const validPages = new Set(excerpts.map((e) => e.page));
  parsed.steps = (parsed.steps ?? []).filter((s: { page: number }) => validPages.has(s.page));
  return parsed;
}
