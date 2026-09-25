"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo, MachineIcon, SEVERITY, STATUS, timeAgo } from "@/components/ui";
import { useFactory } from "@/lib/useFactory";
import { useNow } from "@/lib/useNow";

const TECHS = ["Sam (fitter)", "Aroha (electrician)"];

export default function WorkOrdersPage() {
  const { state, dispatch } = useFactory();
  const now = useNow();
  const [cause, setCause] = useState<Record<string, string>>({});

  const orders = state.faults.filter((f) => f.status === "escalated" || f.status === "in_progress");
  const history = state.faults.filter((f) => f.status === "resolved").slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-line px-4 py-3 sm:px-6">
        <Link href="/" aria-label="FaultLine home"><Logo /></Link>
        <span className="text-sm text-muted">Work orders</span>
        <Link href="/floor" className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm hover:border-muted">
          Back to floor
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-6 p-4 sm:p-6">
        <section>
          <h1 className="mb-3 text-xl font-semibold">Open work orders</h1>
          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">No work orders. When an operator escalates a fault it appears here, already filled in.</p>
          ) : (
            <div className="grid gap-4">
              {orders.map((f) => {
                const m = state.machines.find((x) => x.id === f.machineId);
                if (!m) return null;
                const tried = f.triage.steps.map((s, i) => ({ s, o: f.steps[i] })).filter((x) => x.o);
                return (
                  <article key={f.id} className="fade-in rounded-2xl border border-tech/50 bg-panel p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span style={{ color: STATUS[m.status].color }}>
                        <MachineIcon kind={m.kind} className="size-8" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold">
                          {m.name} <span className="font-normal text-muted">· {m.location}</span>
                        </h2>
                        <p className="text-sm text-muted">
                          Reported {now ? timeAgo(f.createdAt, now) : ""} · {f.code ? <span className="font-mono">{f.code}</span> : "no code"}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${SEVERITY[f.triage.severity].className}`}>{SEVERITY[f.triage.severity].label}</span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2 text-sm">
                        <Field label="Operator said">&ldquo;{f.report}&rdquo;</Field>
                        <Field label="FaultLine diagnosis">{f.triage.summary}</Field>
                        <Field label="Likely cause">{f.triage.likelyCause}</Field>
                        {f.triage.parts.length > 0 && <Field label="Bring">{f.triage.parts.join(", ")}</Field>}
                      </div>
                      <div className="text-sm">
                        <div className="mb-1 text-xs uppercase tracking-wider text-muted">Already tried by operator</div>
                        {tried.length === 0 ? (
                          <p className="text-muted">Nothing marked yet.</p>
                        ) : (
                          <ul className="grid gap-1.5">
                            {tried.map(({ s, o }) => (
                              <li key={s.text} className="flex gap-2">
                                <span className={o === "worked" ? "text-ok" : "text-bad"}>{o === "worked" ? "✓" : "✗"}</span>
                                <span>
                                  {s.text} <span className="text-muted">(p.{s.page})</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                      {f.status === "escalated" ? (
                        TECHS.map((t) => (
                          <button key={t} type="button" onClick={() => dispatch({ type: "start", faultId: f.id, assignee: t.split(" ")[0] })} className="rounded-lg bg-tech px-3 py-2 text-sm font-semibold text-white">
                            Assign {t}
                          </button>
                        ))
                      ) : (
                        <>
                          <span className="text-sm text-muted">{f.assignee} is on it.</span>
                          <input
                            value={cause[f.id] ?? ""}
                            onChange={(e) => setCause((c) => ({ ...c, [f.id]: e.target.value }))}
                            placeholder="Root cause, e.g. loose Y switch wire"
                            className="min-w-56 flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={!cause[f.id]?.trim()}
                            onClick={() => dispatch({ type: "close", faultId: f.id, rootCause: cause[f.id].trim() })}
                            className="rounded-lg bg-ok px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
                          >
                            Close work order
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Recently resolved</h2>
            <ul className="grid gap-2">
              {history.map((f) => {
                const m = state.machines.find((x) => x.id === f.machineId);
                return (
                  <li key={f.id} className="flex flex-wrap gap-x-3 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm">
                    <span className="font-medium">{m?.name}</span>
                    <span className="text-muted">{f.rootCause}</span>
                    <span className="ml-auto text-xs text-muted">
                      fixed in {Math.max(1, Math.round(((f.resolvedAt ?? f.createdAt) - f.createdAt) / 60000))} min
                    </span>
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
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}
