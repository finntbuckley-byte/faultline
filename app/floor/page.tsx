"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FloorPlan } from "@/components/FloorPlan";
import { ReplayBar, applyReplay, useReplay } from "@/components/Replay";
import { Logo, MachineIcon, STATUS, StatusDot, timeAgo } from "@/components/ui";
import { FAULT_CARDS, INSIGHTS } from "@/lib/data";
import { useFactory } from "@/lib/useFactory";
import { useNow, useOrigin } from "@/lib/useNow";

export default function FloorPage() {
  const { state, dispatch, online } = useFactory();
  const [showQr, setShowQr] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  const origin = useOrigin();
  const now = useNow();
  const [insights, setInsights] = useState<typeof INSIGHTS | null>(null);
  const replay = useReplay(() => setShowInsights(true));
  const startReplay = () => {
    setShowInsights(false);
    replay.start();
    // Ask the AI for pattern cards while the replay plays, so they're ready at the end.
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { cards: typeof INSIGHTS }) => setInsights(d.cards))
      .catch(() => setInsights(null));
  };

  const machines = useMemo(
    () => (replay.hour !== null ? applyReplay(state.machines, replay.hour) : state.machines),
    [state.machines, replay.hour],
  );
  const counts = useMemo(() => {
    const c = { running: 0, fault: 0, down: 0, tech: 0 };
    machines.forEach((m) => c[m.status]++);
    return c;
  }, [machines]);
  const openFaults = state.faults.filter((f) => f.status !== "resolved");
  const resolved = state.faults.filter((f) => f.status === "resolved" && f.resolvedAt);
  const mttr = resolved.length
    ? Math.round(resolved.reduce((s, f) => s + ((f.resolvedAt ?? f.createdAt) - f.createdAt), 0) / resolved.length / 60000)
    : null;
  const sel = state.machines.find((m) => m.id === selected);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-4 py-3 sm:px-6">
        <Link href="/" aria-label="FaultLine home"><Logo /></Link>
        <div className="text-sm text-muted">
          Kauri Timber Co. · Christchurch plant <span className="mx-1">·</span>
          <span className="font-mono tabular-nums text-text">{now ? new Date(now).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}</span>
        </div>
        <nav className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          <span className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${online ? "text-ok" : "text-bad"}`}>
            <span className={`size-2 rounded-full ${online ? "bg-ok" : "bg-bad"}`} /> {online ? "Live" : "Offline"}
          </span>
          <button type="button" onClick={() => setShowQr((v) => !v)} className={`rounded-lg border px-3 py-1.5 ${showQr ? "border-accent bg-accent text-black" : "border-line hover:border-muted"}`}>
            {showQr ? "Hide QR codes" : "Show QR codes"}
          </button>
          <button type="button" onClick={() => (replay.running ? replay.stop() : startReplay())} className="rounded-lg border border-line px-3 py-1.5 hover:border-muted">
            {replay.running ? "Stop replay" : "Replay last week"}
          </button>
          <button type="button" onClick={() => setSimOpen((v) => !v)} className={`rounded-lg border px-3 py-1.5 ${simOpen ? "border-accent text-accent" : "border-line hover:border-muted"}`}>
            Simulator
          </button>
          <Link href="/qr" className="rounded-lg border border-line px-3 py-1.5 hover:border-muted">
            QR sheet
          </Link>
          <Link href="/work-orders" className="rounded-lg border border-line px-3 py-1.5 hover:border-muted">
            Work orders{openFaults.length ? <span className="ml-1.5 rounded-full bg-tech px-1.5 text-xs text-white">{openFaults.length}</span> : null}
          </Link>
        </nav>
      </header>

      <main className="grid flex-1 gap-4 p-4 sm:p-6 xl:grid-cols-[1fr_340px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Running" value={`${counts.running}/${machines.length}`} color="var(--ok)" />
            <Kpi label="Faults" value={counts.fault + counts.down} color={counts.fault + counts.down ? "var(--bad)" : "var(--muted)"} />
            <Kpi label="Technician jobs" value={counts.tech} color={counts.tech ? "var(--tech)" : "var(--muted)"} />
            <Kpi label="Avg time to fix" value={mttr === null ? "–" : `${mttr} min`} color="var(--accent)" />
          </div>

          {replay.hour !== null && <ReplayBar hour={replay.hour} onStop={replay.stop} />}

          <FloorPlan machines={machines} showQr={showQr} origin={origin} selected={selected} onSelect={(id) => setSelected((s) => (s === id ? undefined : id))} />

          <div className="flex flex-wrap gap-4 text-xs text-muted">
            {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <StatusDot status={k} /> {STATUS[k].label}
              </span>
            ))}
            <span className="ml-auto">Scan a machine&apos;s QR code to report a fault from your phone.</span>
          </div>

          {sel && (
            <div className="fade-in flex flex-wrap items-center gap-4 rounded-xl border border-line bg-panel p-4">
              <span style={{ color: STATUS[sel.status].color }}>
                <MachineIcon kind={sel.kind} className="size-9" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {sel.name} <span className="font-normal text-muted">· {sel.model} · {sel.location}</span>
                </div>
                <div className="text-sm text-muted">Manual: {sel.manual}</div>
              </div>
              <Link href={`/m/${sel.id}`} target="_blank" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black">
                Open operator view
              </Link>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          {simOpen && (
            <Panel title="Simulator" action={<button type="button" onClick={() => dispatch({ type: "reset" })} className="text-xs text-muted hover:text-text">Reset floor</button>}>
              <p className="mb-3 text-xs text-muted">Put a fault on a machine&apos;s display. The operator then reports it by scanning its QR code.</p>
              <div className="grid gap-2">
                {FAULT_CARDS.map((c) => {
                  const m = state.machines.find((x) => x.id === c.machineId);
                  return (
                    <button key={c.id} type="button" onClick={() => dispatch({ type: "inject", cardId: c.id })} className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2 text-left text-sm hover:border-bad/60">
                      {m && <MachineIcon kind={m.kind} className="size-5 shrink-0 text-muted" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{m?.name} · {c.label}</span>
                        <span className="block truncate text-xs text-muted">{c.code ?? "No code: symptom only"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {showInsights && (
            <Panel title="Insights" action={<button type="button" onClick={() => setShowInsights(false)} className="text-xs text-muted hover:text-text">Hide</button>}>
              <div className="grid gap-3">
                {(insights ?? INSIGHTS).map((i) => (
                  <div key={i.title} className="fade-in rounded-lg border border-accent/40 bg-accent/5 p-3">
                    <div className="text-sm font-semibold text-accent">{i.title}</div>
                    <p className="mt-1 text-xs text-muted">{i.evidence}</p>
                    <p className="mt-2 text-sm">{i.recommendation}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Open faults">
            {openFaults.length === 0 ? (
              <p className="text-sm text-muted">No open faults. Everything is running.</p>
            ) : (
              <ul className="grid gap-2">
                {openFaults.map((f) => {
                  const m = state.machines.find((x) => x.id === f.machineId);
                  return (
                    <li key={f.id} className="rounded-lg border border-line bg-panel-2 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {m && <StatusDot status={m.status} />}
                        <span className="font-medium">{m?.name}</span>
                        <span className="ml-auto text-xs text-muted">{now ? timeAgo(f.createdAt, now) : ""}</span>
                      </div>
                      <div className="mt-1 text-muted">{f.triage.summary}</div>
                      <div className="mt-1 text-xs capitalize text-muted">{f.status.replace("_", " ")}{f.assignee ? ` · ${f.assignee}` : ""}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Live feed">
            {state.feed.length === 0 ? (
              <p className="text-sm text-muted">Events will appear here as they happen.</p>
            ) : (
              <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
                {state.feed.map((e) => (
                  <li key={e.id} className="fade-in flex gap-2 text-sm">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${e.tone === "bad" ? "bg-bad" : e.tone === "warn" ? "bg-warn" : e.tone === "good" ? "bg-ok" : "bg-tech"}`} />
                    <span className="min-w-0 flex-1">{e.text}</span>
                    <span className="shrink-0 text-xs text-muted">{now ? timeAgo(e.at, now) : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </main>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
