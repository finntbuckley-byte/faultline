"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ManualSheet } from "@/components/ManualSheet";
import { Logo, MachineIcon, SEVERITY, STATUS } from "@/components/ui";
import { cardById } from "@/lib/data";
import { newId, useFactory } from "@/lib/useFactory";
import type { TriageStep } from "@/lib/types";

type Mode = "idle" | "thinking" | "result";
const THINK_MS = 1800;

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

export default function OperatorPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useFactory();
  const machine = state.machines.find((m) => m.id === id);
  const [mode, setMode] = useState<Mode>("idle");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [faultId, setFaultId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sheet, setSheet] = useState<TriageStep | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const fault = state.faults.find((f) => f.id === faultId);
  const alarm = machine?.alarm ? cardById(machine.alarm) : undefined;

  useEffect(() => () => recRef.current?.stop(), []);

  if (!machine) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted">Loading machine…</p>
          <Link href="/" className="mt-4 inline-block text-sm text-accent underline">
            Back to floor
          </Link>
        </div>
      </main>
    );
  }

  const submit = (report: string) => {
    const fid = newId();
    setFaultId(fid);
    setMode("thinking");
    dispatch({ type: "report", machineId: machine.id, report, faultId: fid });
    setTimeout(() => setMode("result"), THINK_MS);
  };

  const onPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      // Simulated vision step: the real build reads the error code from the photo.
      submit(text || alarm?.code || "photo of display");
    };
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setText((t) => t || "Belt squealing on start-up");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-NZ";
    rec.interimResults = true;
    rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(" "));
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const st = STATUS[machine.status];
  const done = fault?.status === "resolved";
  const escalated = fault?.status === "escalated" || fault?.status === "in_progress";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-36 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <Logo />
        <span className="text-xs text-muted">Operator</span>
      </div>

      <section className="rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-center gap-3">
          <span style={{ color: st.color }}>
            <MachineIcon kind={machine.kind} className="size-10" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-tight">{machine.name}</h1>
            <p className="truncate text-sm text-muted">
              {machine.model} · {machine.location}
            </p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: st.color, background: `color-mix(in oklab, ${st.color} 16%, transparent)` }}>
            {st.label}
          </span>
        </div>
        {alarm && mode === "idle" && (
          <div className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm">
            Display shows <b className="font-mono">{alarm.code ?? alarm.label}</b>
          </div>
        )}
      </section>

      {mode === "idle" && (
        <section className="mt-4 grid gap-3">
          <h2 className="text-lg font-semibold">What&apos;s wrong?</h2>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-panel-2 p-4 text-base font-medium active:scale-[0.99]">
            <span className="grid size-10 place-items-center rounded-lg bg-accent text-black"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
            Photo of the screen
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={toggleVoice} className={`flex items-center gap-3 rounded-xl border p-4 text-left text-base font-medium ${listening ? "border-bad bg-bad/10" : "border-line bg-panel-2"}`}>
            <span className={`grid size-10 place-items-center rounded-lg ${listening ? "bg-bad text-white" : "bg-accent text-black"}`}><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>
            {listening ? "Listening… tap to stop" : "Say what's happening"}
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Or type it, e.g. “stopped mid-cut and beeped”"
            className="rounded-xl border border-line bg-panel-2 p-3 text-base placeholder:text-muted"
          />
          <button
            type="button"
            disabled={!text.trim() && !alarm}
            onClick={() => submit(text)}
            className="rounded-xl bg-accent py-4 text-lg font-semibold text-black disabled:opacity-40"
          >
            {text.trim() ? "Get fix steps" : alarm ? `Report ${alarm.code ?? "this fault"}` : "Get fix steps"}
          </button>
        </section>
      )}

      {mode === "thinking" && (
        <section className="mt-4 grid gap-3" aria-live="polite">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Your photo" className="max-h-40 w-full rounded-xl object-cover" />
          )}
          <p className="text-sm text-muted">Reading the {machine.manual}…</p>
          <div className="skeleton h-16" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
          <div className="skeleton h-12" />
        </section>
      )}

      {mode === "result" && fault && (
        <section className="fade-in mt-4 grid gap-3">
          <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${SEVERITY[fault.triage.severity].className}`}>{SEVERITY[fault.triage.severity].label}</div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="font-medium">{fault.triage.summary}</p>
            <p className="mt-1 text-sm text-muted">Likely cause: {fault.triage.likelyCause}</p>
          </div>
          <div className="rounded-xl border-2 border-bad/60 bg-bad/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-bad">Safety first</div>
            <p className="mt-1">{fault.triage.safetyFirst}</p>
          </div>
          <ol className="grid gap-3">
            {fault.triage.steps.map((s, i) => {
              const outcome = fault.steps[i];
              return (
                <li key={i} className="rounded-xl border border-line bg-panel p-4">
                  <div className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-panel-2 text-sm font-semibold">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p>{s.text}</p>
                      <button type="button" onClick={() => setSheet(s)} className="mt-2 rounded-md border border-accent/50 px-2 py-0.5 text-xs font-semibold text-accent">
                        Manual p.{s.page}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => dispatch({ type: "step", faultId: fault.id, index: i, outcome: "worked" })} className={`rounded-lg border py-2 text-sm ${outcome === "worked" ? "border-ok bg-ok/15 text-ok" : "border-line"}`}>
                      ✓ Worked
                    </button>
                    <button type="button" onClick={() => dispatch({ type: "step", faultId: fault.id, index: i, outcome: "failed" })} className={`rounded-lg border py-2 text-sm ${outcome === "failed" ? "border-bad bg-bad/15 text-bad" : "border-line"}`}>
                      ✗ Didn&apos;t help
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {fault.triage.parts.length > 0 && <p className="text-sm text-muted">Possible parts: {fault.triage.parts.join(", ")}</p>}
        </section>
      )}

      {mode === "result" && fault && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 p-4 backdrop-blur">
          <div className="mx-auto grid max-w-md gap-2">
            {done ? (
              <p className="rounded-xl bg-ok/15 py-4 text-center font-semibold text-ok">Resolved: {machine.name} is back running</p>
            ) : escalated ? (
              <p className="rounded-xl bg-tech/15 py-4 text-center font-semibold text-tech">Work order sent: a technician is on the way</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => dispatch({ type: "resolve", faultId: fault.id })} className="rounded-xl bg-ok py-4 font-semibold text-black">
                  Resolved
                </button>
                <button type="button" onClick={() => dispatch({ type: "escalate", faultId: fault.id })} className="rounded-xl bg-tech py-4 font-semibold text-white">
                  Escalate
                </button>
              </div>
            )}
            {(done || escalated) && (
              <button type="button" onClick={() => { setMode("idle"); setText(""); setPhoto(null); setFaultId(null); }} className="text-sm text-muted underline">
                Report another fault
              </button>
            )}
          </div>
        </div>
      )}

      {sheet && <ManualSheet manual={machine.manual} page={sheet.page} quote={sheet.quote} onClose={() => setSheet(null)} />}
    </main>
  );
}
