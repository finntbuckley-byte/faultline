"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ManualSheet } from "@/components/ManualSheet";
import { Logo, SEVERITY, STATUS } from "@/components/ui";
import { cardById } from "@/lib/data";
import { newId, useFactory } from "@/lib/useFactory";
import type { TriageStep } from "@/lib/types";

type Mode = "idle" | "thinking" | "result";

/** Downscale a photo in the browser so uploads stay small and fast on mobile data. */
function downscale(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

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
  const { state, dispatch, replace } = useFactory();
  const [error, setError] = useState<string | null>(null);
  const machine = state.machines.find((m) => m.id === id);
  const [mode, setMode] = useState<Mode>("idle");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [faultId, setFaultId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [sheet, setSheet] = useState<TriageStep | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fault = state.faults.find((f) => f.id === faultId);
  const alarm = machine?.alarm ? cardById(machine.alarm) : undefined;

  useEffect(() => () => recRef.current?.stop(), []);

  if (!machine) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted">Loading machine…</p>
          <Link href="/floor" className="mt-4 inline-block text-sm text-accent underline">
            Back to floor
          </Link>
        </div>
      </main>
    );
  }

  const submit = async (report: string, photoData?: string, audioData?: string) => {
    const fid = newId();
    setFaultId(fid);
    setError(null);
    setMode("thinking");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machineId: machine.id, faultId: fid, text: report, photo: photoData, audio: audioData }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      replace(body.state);
      setMode("result");
    } catch {
      setError("Couldn't reach FaultLine. Check your connection and try again.");
      setMode("idle");
    }
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const data = await downscale(file);
      setPhoto(data);
      submit(text, data);
    } catch {
      setError("Couldn't read that photo. Try again or type what you see.");
    }
  };

  /** Fallback for browsers without live speech recognition: record, then transcribe server-side. */
  const recordAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const parts: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setListening(false);
        clearTimeout(stopTimer.current);
        const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => submit(text, undefined, String(reader.result));
        reader.readAsDataURL(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setListening(true);
      stopTimer.current = setTimeout(() => rec.state === "recording" && rec.stop(), 30_000);
    } catch {
      setError("Microphone not available. Type what's happening instead.");
    }
  };

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      recordAudio();
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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-40 pt-6">
      <div className="flex items-center justify-between text-[15px]">
        <Logo />
        <span className="flex items-center gap-1.5 text-muted">
          <span className="size-2 rounded-full" style={{ background: st.color }} aria-hidden />
          {st.label}
        </span>
      </div>

      <header className="mt-8">
        <p className="text-[15px] text-muted">
          {machine.location} · {machine.model}
        </p>
        <h1 className="mt-0.5 text-[34px] font-bold leading-tight">{machine.name}</h1>
        {alarm && mode === "idle" && (
          <p className="mt-3 rounded-2xl bg-bad/10 px-4 py-3 text-[15px] text-bad">
            The display shows <span className="font-mono font-semibold">{alarm.code ?? alarm.label}</span>
          </p>
        )}
      </header>

      {mode === "idle" && (
        <section className="mt-8 grid gap-4">
          <h2 className="text-[22px] font-semibold">What&apos;s wrong?</h2>
          {error && (
            <p role="alert" className="rounded-2xl bg-bad/10 px-4 py-3 text-[15px] text-bad">
              {error}
            </p>
          )}
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-panel shadow-card">
            <label className="flex cursor-pointer items-center gap-4 px-4 py-4 text-[17px] active:bg-panel-2">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-white"><svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
              <span className="flex-1">Photograph the screen</span>
              <Chevron />
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={toggleVoice} className="flex w-full items-center gap-4 px-4 py-4 text-left text-[17px] active:bg-panel-2">
              <span className={`grid size-10 place-items-center rounded-xl text-white ${listening ? "bg-bad" : "bg-accent"}`}><svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>
              <span className="flex-1">{listening ? "Listening… tap to stop" : "Say what's happening"}</span>
              {listening ? <span className="size-2.5 animate-pulse rounded-full bg-bad" aria-hidden /> : <Chevron />}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Or type it. For example: stopped mid-cut and beeped"
            className="rounded-[22px] bg-panel px-4 py-3.5 text-[17px] shadow-card outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="button"
            disabled={!text.trim() && !alarm}
            onClick={() => submit(text)}
            className="rounded-2xl bg-accent py-4 text-[17px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-30"
          >
            {text.trim() ? "Get the fix" : alarm ? `Report ${alarm.code ?? "this fault"}` : "Get the fix"}
          </button>
        </section>
      )}

      {mode === "thinking" && (
        <section className="mt-8 grid gap-3" aria-live="polite">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Your photo" className="max-h-44 w-full rounded-[22px] object-cover" />
          )}
          <p className="text-[15px] text-muted">Reading the {machine.manual}…</p>
          <div className="skeleton h-20" />
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
        </section>
      )}

      {mode === "result" && fault && (
        <section className="fade-in mt-8 grid gap-5">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            <span className={`rounded-full px-3 py-1 ${SEVERITY[fault.triage.severity].className}`}>{SEVERITY[fault.triage.severity].label}</span>
            <span className={`rounded-full px-3 py-1 ${fault.grounded ? "bg-panel text-muted shadow-card" : "bg-panel-2 text-muted"}`}>
              {fault.grounded ? `From the ${machine.manual}` : "Demo guidance"}
            </span>
          </div>
          <div>
            <p className="text-[22px] font-semibold leading-snug">{fault.triage.summary}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">Likely cause: {fault.triage.likelyCause}</p>
          </div>
          <div className="rounded-[22px] bg-bad/10 px-4 py-4">
            <div className="text-[13px] font-semibold text-bad">Safety first</div>
            <p className="mt-1 text-[17px] leading-snug">{fault.triage.safetyFirst}</p>
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-[22px] bg-panel shadow-card">
            {fault.triage.steps.map((s, i) => {
              const outcome = fault.steps[i];
              return (
                <li key={i} className="px-4 py-4">
                  <div className="flex gap-3">
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${outcome === "worked" ? "bg-ok text-white" : outcome === "failed" ? "bg-bad text-white" : "bg-panel-2 text-muted"}`}>
                      {outcome === "worked" ? "✓" : outcome === "failed" ? "✕" : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] leading-snug">{s.text}</p>
                      <button type="button" onClick={() => setSheet(s)} className="mt-1.5 text-[14px] font-medium text-accent">
                        See page {s.page}
                        <Chevron small />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 pl-10 text-[14px] font-medium">
                    <button type="button" onClick={() => dispatch({ type: "step", faultId: fault.id, index: i, outcome: outcome === "worked" ? null : "worked" })} className={`rounded-full px-3.5 py-1.5 transition-colors ${outcome === "worked" ? "bg-ok text-white" : "bg-panel-2"}`}>
                      Worked
                    </button>
                    <button type="button" onClick={() => dispatch({ type: "step", faultId: fault.id, index: i, outcome: outcome === "failed" ? null : "failed" })} className={`rounded-full px-3.5 py-1.5 transition-colors ${outcome === "failed" ? "bg-bad text-white" : "bg-panel-2"}`}>
                      Didn&apos;t help
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {fault.triage.parts.length > 0 && <p className="px-1 text-[15px] text-muted">Parts that may be needed: {fault.triage.parts.join(", ")}</p>}
        </section>
      )}

      {mode === "result" && fault && (
        <div className="glass fixed inset-x-0 bottom-0 border-t border-line/70 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto grid max-w-md gap-2">
            {done ? (
              <p className="py-3 text-center text-[17px] font-semibold text-ok">{machine.name} is back running.</p>
            ) : escalated ? (
              <p className="py-3 text-center text-[17px] font-semibold text-tech">Work order sent. A technician is on the way.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => dispatch({ type: "resolve", faultId: fault.id })} className="rounded-2xl bg-accent py-3.5 text-[17px] font-semibold text-white active:opacity-80">
                  It&apos;s fixed
                </button>
                <button type="button" onClick={() => dispatch({ type: "escalate", faultId: fault.id })} className="rounded-2xl bg-panel py-3.5 text-[17px] font-semibold text-accent shadow-card active:opacity-80">
                  Get a technician
                </button>
              </div>
            )}
            {(done || escalated) && (
              <button
                type="button"
                onClick={() => {
                  setMode("idle");
                  setText("");
                  setPhoto(null);
                  setFaultId(null);
                }}
                className="pb-1 text-[15px] font-medium text-accent"
              >
                Report another fault
              </button>
            )}
          </div>
        </div>
      )}

      {sheet && <ManualSheet machineId={machine.id} manual={machine.manual} page={sheet.page} quote={sheet.quote} onClose={() => setSheet(null)} />}
    </main>
  );
}

function Chevron({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 8 14" className={small ? "ml-1 inline size-2.5" : "size-3.5 text-muted"} aria-hidden>
      <path d="M1.5 1.5 6.5 7l-5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
