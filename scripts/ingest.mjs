#!/usr/bin/env node
// Ingest a PDF manual for a machine: page text -> chunks -> embeddings -> Supabase.
// Usage: node scripts/ingest.mjs --machine cnc-01 --file manuals/cnc-3018-prover.pdf --title "Genmitsu 3018-PROVer User Manual"
// Re-running for the same machine replaces its previous manual.
import { readFileSync, existsSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { extractText, getDocumentProxy } from "unpdf";

function loadEnv(file = ".env.local") {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function chunkPage(text, size = 1400, overlap = 200) {
  const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= size) return clean.length > 40 ? [clean] : [];
  const out = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + size);
    const soft = clean.lastIndexOf("\n", end);
    if (end < clean.length && soft > start + size * 0.6) end = soft;
    const piece = clean.slice(start, end).trim();
    if (piece.length > 40) out.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}

loadEnv();
const machineId = arg("machine");
const file = arg("file");
const title = arg("title") ?? (file ? basename(file, ".pdf") : "");
if (!machineId || !file) {
  console.error('Usage: node scripts/ingest.mjs --machine <id> --file <pdf> [--title "Manual title"]');
  process.exit(1);
}
for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "OPENAI_API_KEY"]) {
  if (!process.env[k]) {
    console.error(`Missing ${k} in .env.local`);
    process.exit(1);
  }
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const bytes = readFileSync(file);
const pdf = await getDocumentProxy(new Uint8Array(bytes));
const { totalPages, text: pages } = await extractText(pdf, { mergePages: false });
console.log(`${title}: ${totalPages} pages`);

// Replace any previous manual for this machine.
const { data: old } = await db.from("manuals").select("id, storage_path").eq("machine_id", machineId);
for (const m of old ?? []) {
  if (m.storage_path) await db.storage.from("manuals").remove([m.storage_path]);
  await db.from("manuals").delete().eq("id", m.id);
}

const storagePath = `${machineId}/${basename(file)}`;
const up = await db.storage.from("manuals").upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
if (up.error) console.warn(`PDF upload skipped (${up.error.message}); page text will still work.`);

const { data: manual, error: mErr } = await db
  .from("manuals")
  .insert({ machine_id: machineId, title, storage_path: up.error ? null : storagePath, page_count: totalPages })
  .select("id")
  .single();
if (mErr) throw mErr;

const pageRows = pages.map((content, i) => ({ manual_id: manual.id, machine_id: machineId, page: i + 1, content: content ?? "" }));
for (let i = 0; i < pageRows.length; i += 200) {
  const { error } = await db.from("manual_pages").insert(pageRows.slice(i, i + 200));
  if (error) throw error;
}

const chunks = pages.flatMap((content, i) => chunkPage(content ?? "").map((c) => ({ page: i + 1, content: c })));
console.log(`Embedding ${chunks.length} chunks…`);
for (let i = 0; i < chunks.length; i += 96) {
  const batch = chunks.slice(i, i + 96);
  const res = await ai.embeddings.create({ model: "text-embedding-3-small", input: batch.map((c) => `[p.${c.page}] ${c.content}`) });
  const rows = batch.map((c, j) => ({ manual_id: manual.id, machine_id: machineId, page: c.page, content: c.content, embedding: res.data[j].embedding }));
  const { error } = await db.from("manual_chunks").insert(rows);
  if (error) throw error;
  process.stdout.write(`  ${Math.min(i + 96, chunks.length)}/${chunks.length}\r`);
}
console.log(`\nDone: ${title} -> ${machineId} (${totalPages} pages, ${chunks.length} chunks)`);
