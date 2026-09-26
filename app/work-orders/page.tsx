"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo, MachineIcon, SEVERITY, STATUS, timeAgo } from "@/components/ui";
import { useFactory } from "@/lib/useFactory";
import { useNow } from "@/lib/useNow";

const TECHS = ["Sam", "Aroha"];

export default function WorkOrdersPage() {
  const { state, dispatch } = useFactory();
  const now = useNow();
  const [cause, setCause] = useState<Record<string, string>>({});

  const orders = state.faults.filter((f) => f.status === "escalated" || f.status === "in_progress");
  const history = state.faults.filter((f) => f.status === "resolved").slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-14 max-w-[980px] items-center gap-4 px-5">
          <Link href="/" aria-label="FaultLine home">
            <Logo />
          </Link>
          <Link href="/floor" className="ml-auto rounded-full px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent/10">
            Back to floor
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[980px] gap-10 px-5 py-10">
        <section>
          <h1 className="text-[32px] font-semibold">Work orders</h1>
          <p className="mt-1 text-[17px] text-muted">
            {orders.length === 0 ? "Nothing waiting on a technician." : `${orders.length} waiting on a technician.`}
          </p>

          {orders.length === 0 ? (
            <p className="mt-8 rounded-[28px] bg-panel px-8 py-14 text-center text-[17px] text-muted shadow-card">
              When an operator taps &ldquo;Get a technician&rdquo;, the job lands here, already filled in.
            </p>
          ) : (
            <div className="mt-8 grid gap-5">
              {orders.map((f) => {
                const m = state.machines.find((x) => x.id === f.machineId);
                if (!m) return null;
                const tried = f.triage.steps.map((s, i) => ({ s, o: f.steps[i] })).filter((x) => x.o);
                return (
                  <article key={f.id} className="fade-in overflow-hidden rounded-[28px] bg-panel shadow-card">
                    <div className="flex flex-wrap items-center gap-4 px-6 pt-6">
                      <span className="grid size-12 place-items-center rounded-2xl bg-panel-2" style={{ color: STATUS[m.status].color }}>
                        <MachineIcon kind={m.kind} className="size-7" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[20px] font-semibold">{m.name}</h2>
                        <p className="text-[14px] text-muted">
                          {m.location} · reported {now ? timeAgo(f.createdAt, now) : ""}
                          {f.code ? (
                            <>
                              {" · "}
                              <span className="font-mono">{f.code}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${SEVERITY[f.triage.severity].className}`}>{SEVERITY[f.triage.severity].label}</span>
                    </div>

                    <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                      <dl className="grid gap-4 text-[15px]">
                        <Field label="Operator said">&ldquo;{f.report}&rdquo;</Field>
                        <Field label="Diagnosis">{f.triage.summary}</Field>
                        <Field label="Likely cause">{f.triage.likelyCause}</Field>
                        {f.triage.parts.length > 0 && <Field label="Bring">{f.triage.parts.join(", ")}</Field>}
                      </dl>
                      <div className="text-[15px]">
                        <div className="text-[13px] text-muted">Already tried</div>
                        {tried.length === 0 ? (
                          <p className="mt-1 text-muted">Nothing marked yet.</p>
                        ) : (
                          <ul className="mt-2 grid gap-2">
                            {tried.map(({ s, o }) => (
                              <li key={s.text} className="flex gap-2.5">
                                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] text-white ${o === "worked" ? "bg-ok" : "bg-bad"}`}>{o === "worked" ? "✓" : "✕"}</span>
                                <span className="leading-snug">
                                  {s.text} <span className="text-muted">p.{s.page}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-line bg-panel-2/60 px-6 py-4">
                      {f.status === "escalated" ? (
                        <>
                          <span className="text-[15px] text-muted">Assign to</span>
                          {TECHS.map((t) => (
                            <button key={t} type="button" onClick={() => dispatch({ type: "start", faultId: f.id, assignee: t })} className="rounded-full bg-accent px-4 py-1.5 text-[15px] font-medium text-white active:opacity-80">
                              {t}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          <span className="text-[15px] text-muted">{f.assignee} is on it.</span>
                          <input
                            value={cause[f.id] ?? ""}
                            onChange={(e) => setCause((c) => ({ ...c, [f.id]: e.target.value }))}
                            placeholder="Root cause, e.g. loose Y switch wire"
                            aria-label="Root cause"
                            className="min-w-56 flex-1 rounded-full bg-panel px-4 py-2 text-[15px] shadow-card outline-none focus:ring-2 focus:ring-accent/40"
                          />
                          <button
                            type="button"
                            disabled={!cause[f.id]?.trim()}
                            onClick={() => dispatch({ type: "close", faultId: f.id, rootCause: cause[f.id].trim() })}
                            className="rounded-full bg-accent px-4 py-2 text-[15px] font-medium text-white disabled:opacity-30"
                          >
                            Close job
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section>
            <h2 className="text-[22px] font-semibold">Recently fixed</h2>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[22px] bg-panel shadow-card">
              {history.map((f) => {
                const m = state.machines.find((x) => x.id === f.machineId);
                return (
                  <li key={f.id} className="flex flex-wrap items-baseline gap-x-3 px-5 py-3.5 text-[15px]">
                    <span className="font-medium">{m?.name}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{f.rootCause}</span>
                    <span className="text-[13px] text-muted">{Math.max(1, Math.round(((f.resolvedAt ?? f.createdAt) - f.createdAt) / 60000))} min</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 leading-snug">{children}</dd>
    </div>
  );
}
