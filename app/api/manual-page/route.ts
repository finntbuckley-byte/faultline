import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

const Query = z.object({ machineId: z.string().min(1).max(64), page: z.coerce.number().int().min(1).max(5000) });

/** Real page text from the ingested manual, plus a short-lived link to the PDF page. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({ machineId: url.searchParams.get("machineId"), page: url.searchParams.get("page") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const db = admin();
  if (!db) return NextResponse.json({ error: "Manuals not configured" }, { status: 404 });
  const { machineId, page } = parsed.data;

  const { data: row } = await db
    .from("manual_pages")
    .select("content, manual_id, manuals(title, storage_path)")
    .eq("machine_id", machineId)
    .eq("page", page)
    .limit(1)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const manual = (Array.isArray(row.manuals) ? row.manuals[0] : row.manuals) as { title: string; storage_path: string | null } | null;
  let pdfUrl: string | null = null;
  if (manual?.storage_path) {
    const { data: signed } = await db.storage.from("manuals").createSignedUrl(manual.storage_path, 60 * 30);
    if (signed?.signedUrl) pdfUrl = `${signed.signedUrl}#page=${page}`;
  }
  return NextResponse.json({ title: manual?.title ?? "Manual", page, content: row.content, pdfUrl }, { headers: { "Cache-Control": "no-store" } });
}
