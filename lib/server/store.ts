import "server-only";
import { initialState, reduce } from "@/lib/reducer";
import type { Action, FactoryState } from "@/lib/types";
import { admin } from "./supabase";

const ROW_ID = "demo";
const g = globalThis as unknown as { __faultline?: FactoryState };

/** Current plant state: Supabase when configured, otherwise process memory. */
export async function getState(): Promise<FactoryState> {
  const db = admin();
  if (!db) return (g.__faultline ??= initialState());
  const { data, error } = await db.from("plant_state").select("state, version").eq("id", ROW_ID).maybeSingle();
  if (error) throw error;
  if (data) return { ...(data.state as FactoryState), version: data.version };
  const fresh = initialState();
  const { error: insertError } = await db.from("plant_state").insert({ id: ROW_ID, state: fresh, version: fresh.version });
  if (insertError && insertError.code !== "23505") throw insertError;
  return insertError ? getState() : fresh;
}

/** Apply an action with optimistic concurrency (retries if another tap won the race). */
export async function applyAction(action: Action): Promise<FactoryState> {
  const db = admin();
  if (!db) {
    g.__faultline = reduce(g.__faultline ?? initialState(), action, Date.now());
    return g.__faultline;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await getState();
    const next = reduce(current, action, Date.now());
    if (next === current) return current;
    const { data, error } = await db
      .from("plant_state")
      .update({ state: next, version: next.version, updated_at: new Date().toISOString() })
      .eq("id", ROW_ID)
      .eq("version", current.version)
      .select("version");
    if (error) throw error;
    if (data && data.length === 1) return next;
  }
  throw new Error("Could not save the change: the plant state was busy. Try again.");
}
