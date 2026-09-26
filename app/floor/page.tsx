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

  const attention = counts.fault + counts.down;
  const summary =
    replay.hour !== null
      ? "Replaying last week"
      : attention === 0 && counts.tech === 0
        ? "Everything is running"
        : [attention && `${attention} need${attention === 1 ? "s" : ""} attention`, counts.tech && `${counts.tech} with a technician`].filter(Boolean).join(" · ");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-5">
          <Link href="/" aria-label="FaultLine home">
            <Logo />
          </Link>
          <span className="hidden text-[13px] text-muted md:block">Kauri Timber Co.</span>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-panel-2 p-1 text-[13px]" role="group" aria-label="Floor tools">
            <Seg active={showQr} onClick={() => setShowQr((v) => !v)}>QR codes</Seg>
            <Seg active={replay.running} onClick={() => (replay.running ? replay.stop() : startReplay())}>
              {replay.running ? "Stop replay" : "Replay week"}
            </Seg>
            <Seg active={simOpen} onClick={() => setSimOpen((v) => !v)}>Simulator</Seg>
          </div>
          <Link href="/work-orders" className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent/10 sm:flex">
            Work orders
            {openFaults.length > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] text-white">{openFaults.length}</span>}
          </Link>
          <Link href="/qr" className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent/10 lg:block">
            Print QR
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-5 py-8 xl:grid-cols-[1fr_360px]">
        <section className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-semibold leading-tight">Christchurch plant</h1>
              <p className="mt-1 flex items-center gap-2 text-[17px] text-muted">
                <span className={`size-2 rounded-full ${online ? "bg-ok" : "bg-bad"}`} aria-hidden />
                {online ? summary : "Reconnecting…"}
              </p>
            </div>
            <dl className="flex gap-8 text-right">
              <Stat label="Running" value={`${counts.running}/${machines.length}`} />
              <Stat label="Open faults" value={String(openFaults.length)} />
              <Stat label="Avg fix" value={mttr === null ? "–" : `${mttr} min`} />
              <Stat label="Time" value={now ? new Date(now).toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }) : "--:--"} />
            </dl>
          </div>

          {replay.hour !== null && <ReplayBar hour={replay.hour} onStop={replay.stop} />}

          <FloorPlan machines={machines} showQr={showQr} origin={origin} selected={selected} onSelect={(id) => setSelected((s) => (s === id ? undefined : id))} />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <StatusDot status={k} /> {STATUS[k].label}
              </span>
            ))}
            <span className="ml-auto">Scan a machine&apos;s code to report a fault.</span>
          </div>

          {sel && (
            <div className="fade-in flex flex-wrap items-center gap-4 rounded-[22px] bg-panel p-5 shadow-card">
              <span className="grid size-12 place-items-center rounded-2xl bg-panel-2" style={{ color: STATUS[sel.status].color }}>
                <MachineIcon kind={sel.kind} className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-semibold">{sel.name}</div>
                <div className="truncate text-[14px] text-muted">
                  {sel.model} · {sel.location} · {sel.manual}
                </div>
              </div>
              <Link href={`/m/${sel.id}`} target="_blank" className="rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-white">
                Open operator view
              </Link>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          {simOpen && (
            <Group title="Simulator" action={<button type="button" onClick={() => dispatch({ type: "reset" })} className="text-[13px] text-accent">Reset floor</button>}>
              {FAULT_CARDS.map((c) => {
                const m = state.machines.find((x) => x.id === c.machineId);
                return (
                  <button key={c.id} type="button" onClick={() => dispatch({ type: "inject", cardId: c.id })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel-2">
                    {m && <MachineIcon kind={m.kind} className="size-5 shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{m?.name} · {c.label}</span>
                      <span className="block truncate text-[13px] text-muted">{c.code ?? "Symptom only"}</span>
                    </span>
                    <span className="text-[13px] text-accent">Trigger</span>
                  </button>
                );
              })}
            </Group>
          )}

          {showInsights && (
            <Group title="Insights" action={<button type="button" onClick={() => setShowInsights(false)} className="text-[13px] text-accent">Hide</button>}>
              {(insights ?? INSIGHTS).map((i) => (
                <div key={i.title} className="fade-in px-4 py-4">
                  <div className="text-[15px] font-semibold leading-snug">{i.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{i.evidence}</p>
                  <p className="mt-2 text-[14px] leading-relaxed">{i.recommendation}</p>
                </div>
              ))}
            </Group>
          )}

          <Group title="Needs attention">
            {openFaults.length === 0 ? (
              <p className="px-4 py-4 text-[15px] text-muted">Nothing open. Every machine is running.</p>
            ) : (
              openFaults.map((f) => {
                const m = state.machines.find((x) => x.id === f.machineId);
                return (
                  <div key={f.id} className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {m && <StatusDot status={m.status} />}
                      <span className="text-[15px] font-medium">{m?.name}</span>
                      <span className="ml-auto text-[13px] text-muted">{now ? timeAgo(f.createdAt, now) : ""}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[14px] text-muted">{f.triage.summary}</p>
                    <p className="mt-1 text-[13px] capitalize text-muted">
                      {f.status.replace("_", " ")}
                      {f.assignee ? ` · ${f.assignee}` : ""}
                    </p>
                  </div>
                );
              })
            )}
          </Group>

          <Group title="Activity">
            {state.feed.length === 0 ? (
              <p className="px-4 py-4 text-[15px] text-muted">Events appear here as they happen.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {state.feed.map((e) => (
                  <div key={e.id} className="fade-in flex gap-3 px-4 py-3 text-[14px]">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${e.tone === "bad" ? "bg-bad" : e.tone === "warn" ? "bg-warn" : e.tone === "good" ? "bg-ok" : "bg-tech"}`} aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug">{e.text}</span>
                    <span className="shrink-0 text-[12px] text-muted">{now ? timeAgo(e.at, now) : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </Group>
        </aside>
      </main>
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 font-medium transition-all ${active ? "bg-panel text-text shadow-card" : "text-muted hover:text-text"}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="font-display text-[22px] font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  );
}

function Group({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        {action}
      </div>
      <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-panel shadow-card">{children}</div>
    </section>
  );
}
