import type { Machine, MachineStatus, Severity } from "@/lib/types";

export const STATUS: Record<MachineStatus, { label: string; color: string; text: string }> = {
  running: { label: "Running", color: "var(--ok)", text: "text-ok" },
  fault: { label: "Needs attention", color: "var(--warn)", text: "text-warn" },
  down: { label: "Down", color: "var(--bad)", text: "text-bad" },
  tech: { label: "Technician assigned", color: "var(--tech)", text: "text-tech" },
};

export const SEVERITY: Record<Severity, { label: string; className: string }> = {
  operator_fixable: { label: "You can fix this", className: "bg-ok/10 text-ok border-transparent" },
  needs_technician: { label: "Needs a technician", className: "bg-tech/10 text-tech border-transparent" },
  stop_now: { label: "Stop the machine", className: "bg-bad/10 text-bad border-transparent" },
};

export function StatusDot({ status }: { status: MachineStatus }) {
  return <span className="inline-block size-2.5 rounded-full" style={{ background: STATUS[status].color }} aria-hidden />;
}

export function MachineIcon({ kind, className = "size-7" }: { kind: Machine["kind"]; className?: string }) {
  const common = { className, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (kind) {
    case "saw":
      return (
        <svg {...common}>
          <circle cx="11" cy="16" r="6" />
          <circle cx="11" cy="16" r="1.5" />
          <path d="M4 26h24M21 8v18M17 12h8" />
        </svg>
      );
    case "conveyor":
      return (
        <svg {...common}>
          <rect x="3" y="17" width="26" height="6" rx="3" />
          <circle cx="7" cy="20" r="1.4" />
          <circle cx="25" cy="20" r="1.4" />
          <rect x="9" y="10" width="6" height="6" />
          <rect x="17" y="11" width="5" height="5" />
        </svg>
      );
    case "cnc":
      return (
        <svg {...common}>
          <rect x="4" y="22" width="24" height="5" />
          <path d="M6 22V7h20v15M6 11h20" />
          <rect x="13" y="11" width="6" height="5" />
          <path d="M16 16v3" />
        </svg>
      );
    case "compressor":
      return (
        <svg {...common}>
          <rect x="4" y="10" width="18" height="14" rx="3" />
          <circle cx="13" cy="17" r="3.5" />
          <path d="M22 14h4v6h-4M8 24v3M18 24v3" />
        </svg>
      );
    case "printer":
      return (
        <svg {...common}>
          <rect x="5" y="9" width="22" height="12" rx="2" />
          <path d="M9 21v6h14v-6M9 5h14v4" />
          <path d="M12 24h8" />
        </svg>
      );
    case "packing":
      return (
        <svg {...common}>
          <path d="M5 11l11-5 11 5v11l-11 5-11-5z" />
          <path d="M5 11l11 5 11-5M16 16v11" />
        </svg>
      );
    case "extractor":
      return (
        <svg {...common}>
          <path d="M8 27V9l8-4 8 4v18" />
          <path d="M8 14h16M8 19h16M8 24h16" />
        </svg>
      );
  }
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-[17px] font-semibold tracking-tight ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <rect width="24" height="24" rx="6.5" fill="currentColor" />
        <path d="M4.5 12.5h3.2l2.2-5 3.6 10 2.3-5h3.7" fill="none" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      FaultLine
    </span>
  );
}

export function timeAgo(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}
