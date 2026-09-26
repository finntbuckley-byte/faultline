"use client";

import { useEffect, useRef, useState } from "react";
import { WEEK_HISTORY, type HistoryEvent } from "@/lib/data";
import type { Machine, MachineStatus } from "@/lib/types";

const DURATION_MS = 30_000;
const WEEK_H = 168;
/** Minimum on-screen time per event, in simulated hours, so short faults are visible. */
const MIN_VISIBLE_H = 4;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function useReplay(onDone: () => void) {
  const [hour, setHour] = useState<number | null>(null);
  const raf = useRef<number>(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  const start = () => {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const step = (t: number) => {
      const h = Math.min(WEEK_H, ((t - t0) / DURATION_MS) * WEEK_H);
      setHour(h);
      if (h < WEEK_H) raf.current = requestAnimationFrame(step);
      else {
        setTimeout(() => setHour(null), 1200);
        doneRef.current();
      }
    };
    raf.current = requestAnimationFrame(step);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setHour(null);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { hour, start, stop, running: hour !== null };
}

const activeAt = (e: HistoryEvent, h: number) => h >= e.hour && h < e.hour + Math.max(e.durationHours, MIN_VISIBLE_H);

export function applyReplay(machines: Machine[], h: number): Machine[] {
  return machines.map((m) => {
    const ev = WEEK_HISTORY.find((e) => e.machineId === m.id && activeAt(e, h));
    if (!ev) return { ...m, status: "running" as MachineStatus, alarm: undefined };
    const phase = (h - ev.hour) / Math.max(ev.durationHours, MIN_VISIBLE_H);
    return { ...m, status: (phase < 0.5 ? "fault" : "tech") as MachineStatus, alarm: undefined, model: ev.label };
  });
}

export function ReplayBar({ hour, onStop }: { hour: number; onStop: () => void }) {
  const day = Math.min(6, Math.floor(hour / 24));
  const hh = Math.floor(hour % 24);
  const past = WEEK_HISTORY.filter((e) => e.hour <= hour);
  const downtime = past.reduce((sum, e) => sum + Math.min(e.durationHours, hour - e.hour), 0);
  return (
    <div className="fade-in flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] bg-panel px-5 py-3.5 shadow-card">
      <span className="text-[15px] font-semibold">Last week</span>
      <span className="font-display text-[17px] tabular-nums text-muted">
        {DAYS[day]} {String(hh).padStart(2, "0")}:00
      </span>
      <div className="h-1 min-w-40 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(hour / WEEK_H) * 100}%` }} />
      </div>
      <span className="text-[14px] text-muted">
        <b className="font-semibold text-text tabular-nums">{past.length}</b> faults · <b className="font-semibold text-text tabular-nums">{downtime.toFixed(1)} h</b> down
      </span>
      <button type="button" onClick={onStop} className="text-[14px] font-medium text-accent">
        Stop
      </button>
    </div>
  );
}
