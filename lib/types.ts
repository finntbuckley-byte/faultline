export type MachineStatus = "running" | "fault" | "down" | "tech";
export type Severity = "operator_fixable" | "needs_technician" | "stop_now";
export type FaultStatus = "open" | "escalated" | "in_progress" | "resolved";
export type StepOutcome = "worked" | "failed" | null;

export interface Machine {
  id: string;
  name: string;
  model: string;
  kind: "saw" | "conveyor" | "cnc" | "compressor" | "printer" | "packing" | "extractor";
  location: string;
  manual: string;
  /** Position of the tile centre on the 1000 x 600 floor. */
  x: number;
  y: number;
  status: MachineStatus;
  /** Fault card currently shown on the machine's display (set by the simulator). */
  alarm?: string;
}

export interface TriageStep {
  text: string;
  page: number;
  quote: string;
}

export interface Triage {
  summary: string;
  likelyCause: string;
  severity: Severity;
  safetyFirst: string;
  steps: TriageStep[];
  parts: string[];
}

export interface FaultCard {
  id: string;
  machineId: string;
  label: string;
  code?: string;
  symptom: string;
  /** Words that route a free-text report to this card in the simulated AI. */
  keywords: string[];
  triage: Triage;
}

export interface Fault {
  id: string;
  machineId: string;
  cardId: string;
  source: "operator" | "sim";
  /** True when the triage came from the real manual via retrieval, false for demo fallback content. */
  grounded?: boolean;
  report: string;
  code?: string;
  triage: Triage;
  steps: StepOutcome[];
  status: FaultStatus;
  assignee?: string;
  rootCause?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface FeedEvent {
  id: string;
  at: number;
  machineId: string;
  text: string;
  tone: "bad" | "warn" | "good" | "info";
}

export interface FactoryState {
  version: number;
  machines: Machine[];
  faults: Fault[];
  feed: FeedEvent[];
}

export type Action =
  | { type: "inject"; cardId: string }
  | { type: "report"; machineId: string; report: string; faultId: string; triage?: Triage; code?: string; grounded?: boolean }
  | { type: "step"; faultId: string; index: number; outcome: StepOutcome }
  | { type: "resolve"; faultId: string; note?: string }
  | { type: "escalate"; faultId: string }
  | { type: "start"; faultId: string; assignee: string }
  | { type: "close"; faultId: string; rootCause: string }
  | { type: "reset" };
