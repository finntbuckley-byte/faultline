import { MACHINES, cardById, matchCard } from "./data";
import type { Action, FactoryState, Fault, FeedEvent, MachineStatus } from "./types";

export function initialState(): FactoryState {
  return { version: 1, machines: MACHINES.map((m) => ({ ...m })), faults: [], feed: [] };
}

const setStatus = (s: FactoryState, machineId: string, status: MachineStatus, alarm?: string) =>
  s.machines.map((m) => (m.id === machineId ? { ...m, status, alarm: status === "running" ? undefined : (alarm ?? m.alarm) } : m));

const nameOf = (s: FactoryState, machineId: string) => s.machines.find((m) => m.id === machineId)?.name ?? machineId;

function withFeed(s: FactoryState, e: Omit<FeedEvent, "id">): FeedEvent[] {
  return [{ ...e, id: `${e.at}-${Math.random().toString(36).slice(2, 7)}` }, ...s.feed].slice(0, 40);
}

const patchFault = (s: FactoryState, id: string, patch: Partial<Fault>) =>
  s.faults.map((f) => (f.id === id ? { ...f, ...patch } : f));

/** Pure state transition shared by the server store and (later) a Supabase adapter. */
export function reduce(s: FactoryState, a: Action, now: number): FactoryState {
  const next = (patch: Partial<FactoryState>): FactoryState => ({ ...s, ...patch, version: s.version + 1 });

  switch (a.type) {
    case "reset":
      return { ...initialState(), version: s.version + 1 };

    case "inject": {
      const card = cardById(a.cardId);
      if (!card) return s;
      const status: MachineStatus = card.triage.severity === "stop_now" ? "down" : "fault";
      return next({
        machines: setStatus(s, card.machineId, status, card.id),
        feed: withFeed(s, { at: now, machineId: card.machineId, text: `${nameOf(s, card.machineId)}: ${card.code ? card.code + " · " : ""}${card.label}`, tone: "bad" }),
      });
    }

    case "report": {
      const active = s.machines.find((m) => m.id === a.machineId)?.alarm;
      const activeCard = active ? cardById(active) : undefined;
      const card = (activeCard && !a.report.trim() ? activeCard : undefined) ?? matchCard(a.machineId, a.report || active || "");
      const triage = a.triage ?? card?.triage;
      if (!triage) return s;
      const report = a.report.trim() || card?.symptom || "Fault reported";
      const fault: Fault = {
        id: a.faultId,
        machineId: a.machineId,
        cardId: card?.id ?? "ai",
        source: "operator",
        grounded: Boolean(a.grounded),
        report,
        code: a.code ?? card?.code,
        triage,
        steps: triage.steps.map(() => null),
        status: "open",
        createdAt: now,
      };
      const status: MachineStatus = triage.severity === "stop_now" ? "down" : "fault";
      return next({
        faults: [fault, ...s.faults],
        machines: setStatus(s, a.machineId, status),
        feed: withFeed(s, { at: now, machineId: a.machineId, text: `Operator reported on ${nameOf(s, a.machineId)}: "${report.slice(0, 60)}"`, tone: "warn" }),
      });
    }

    case "step":
      return next({
        faults: s.faults.map((f) =>
          f.id === a.faultId ? { ...f, steps: f.steps.map((o, i) => (i === a.index ? a.outcome : o)) } : f,
        ),
      });

    case "resolve": {
      const f = s.faults.find((x) => x.id === a.faultId);
      if (!f) return s;
      return next({
        faults: patchFault(s, f.id, { status: "resolved", resolvedAt: now, rootCause: a.note || f.triage.likelyCause }),
        machines: setStatus(s, f.machineId, "running"),
        feed: withFeed(s, { at: now, machineId: f.machineId, text: `${nameOf(s, f.machineId)} back running (fixed by operator)`, tone: "good" }),
      });
    }

    case "escalate": {
      const f = s.faults.find((x) => x.id === a.faultId);
      if (!f) return s;
      return next({
        faults: patchFault(s, f.id, { status: "escalated" }),
        machines: setStatus(s, f.machineId, "tech"),
        feed: withFeed(s, { at: now, machineId: f.machineId, text: `Work order raised for ${nameOf(s, f.machineId)}`, tone: "info" }),
      });
    }

    case "start": {
      const f = s.faults.find((x) => x.id === a.faultId);
      if (!f) return s;
      return next({
        faults: patchFault(s, f.id, { status: "in_progress", assignee: a.assignee }),
        machines: setStatus(s, f.machineId, "tech"),
        feed: withFeed(s, { at: now, machineId: f.machineId, text: `${a.assignee} is on the way to ${nameOf(s, f.machineId)}`, tone: "info" }),
      });
    }

    case "close": {
      const f = s.faults.find((x) => x.id === a.faultId);
      if (!f) return s;
      return next({
        faults: patchFault(s, f.id, { status: "resolved", resolvedAt: now, rootCause: a.rootCause }),
        machines: setStatus(s, f.machineId, "running"),
        feed: withFeed(s, { at: now, machineId: f.machineId, text: `${nameOf(s, f.machineId)} repaired: ${a.rootCause}`, tone: "good" }),
      });
    }
  }
}
