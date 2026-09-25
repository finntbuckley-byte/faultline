"use client";

import { QRCodeSVG } from "qrcode.react";
import { LINE, cardById } from "@/lib/data";
import type { Machine } from "@/lib/types";
import { MachineIcon, STATUS } from "./ui";

const W = 1000;
const H = 600;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

interface Props {
  machines: Machine[];
  showQr: boolean;
  origin: string;
  selected?: string;
  onSelect: (id: string) => void;
}

export function FloorPlan({ machines, showQr, origin, selected, onSelect }: Props) {
  const byId = Object.fromEntries(machines.map((m) => [m.id, m]));
  const running = (id: string) => byId[id]?.status === "running";
  const compressorOn = running("compressor");
  const dustOn = running("dust");

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-[#0c1219]" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#16202b" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <rect x="16" y="16" width={W - 32} height={H - 32} rx="14" fill="none" stroke="#2a3a4d" strokeWidth="2" />

        {/* zones */}
        <rect x="30" y="100" width="940" height="200" rx="10" fill="#0f1822" stroke="#1d2a38" />
        <text x="44" y="122" className="fill-[#5b6b7c] text-[12px] tracking-[0.2em]">PRODUCTION LINE</text>
        <rect x="120" y="370" width="530" height="190" rx="10" fill="#0f1822" stroke="#1d2a38" />
        <text x="134" y="392" className="fill-[#5b6b7c] text-[12px] tracking-[0.2em]">PLANT ROOM</text>
        <rect x="760" y="370" width="210" height="190" rx="10" fill="#0f1822" stroke="#1d2a38" strokeDasharray="6 5" />
        <text x="774" y="392" className="fill-[#5b6b7c] text-[12px] tracking-[0.2em]">DISPATCH</text>
        <text x="865" y="480" textAnchor="middle" className="fill-[#3d4c5c] text-[13px]">Loading bay</text>

        {/* compressed air line */}
        <path d="M230 405V330H490V262" fill="none" stroke="#1e3a5f" strokeWidth="6" strokeLinecap="round" />
        <path d="M230 405V330H490V262" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 11" className={compressorOn ? "pipe-flow" : ""} opacity={compressorOn ? 0.9 : 0.25} />
        <path d="M230 330H110V262" fill="none" stroke="#1e3a5f" strokeWidth="6" strokeLinecap="round" />
        <path d="M230 330H110V262" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 11" className={compressorOn ? "pipe-flow" : ""} opacity={compressorOn ? 0.9 : 0.25} />
        <text x="300" y="322" className="fill-[#4f79a8] text-[11px]">compressed air</text>

        {/* dust extraction duct (flows toward the extractor) */}
        <path d="M110 262V350H520V405" fill="none" stroke="#3b2f1c" strokeWidth="9" strokeLinecap="round" />
        <path d="M110 262V350H520V405" fill="none" stroke="#d6a45c" strokeWidth="2" strokeDasharray="3 12" className={dustOn ? "pipe-flow" : ""} opacity={dustOn ? 0.85 : 0.25} />
        <text x="560" y="345" className="fill-[#8a6a3d] text-[11px]">dust extraction</text>

        {/* conveyors between line machines */}
        {LINE.slice(0, -1).map((id, i) => {
          const a = byId[id];
          const b = byId[LINE[i + 1]];
          if (!a || !b) return null;
          const x1 = a.x + 62;
          const x2 = b.x - 62;
          const flowing = running(id) && running(b.id);
          return (
            <g key={id}>
              <rect x={x1} y={193} width={x2 - x1} height={14} rx={7} fill="#1a2532" stroke="#2b3b4e" />
              <line x1={x1 + 6} y1={200} x2={x2 - 6} y2={200} stroke="#3c5068" strokeWidth="2" strokeDasharray="6 6" className={flowing ? "belt-run" : ""} />
              {flowing ? (
                [0, 1].map((k) => (
                  <rect key={k} y={189} width={14} height={10} rx={2} fill="#c89b62">
                    <animate attributeName="x" from={x1 + 2} to={x2 - 16} dur="2.4s" begin={`${k * 1.2}s`} repeatCount="indefinite" />
                  </rect>
                ))
              ) : (
                <rect x={x2 - 20} y={189} width={14} height={10} rx={2} fill="#6b5436" />
              )}
            </g>
          );
        })}

        {/* packing to dispatch */}
        <rect x="873" y="262" width="14" height="150" rx="7" fill="#1a2532" stroke="#2b3b4e" />
        {running("packing") && (
          <rect x="875" width="10" height="14" rx="2" fill="#c89b62">
            <animate attributeName="y" from="266" to="396" dur="2.2s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>

      {machines.map((m) => {
        const st = STATUS[m.status];
        const card = m.alarm ? cardById(m.alarm) : undefined;
        const isSel = selected === m.id;
        return (
          <div key={m.id} className="absolute" style={{ left: pct(m.x, W), top: pct(m.y, H) }}>
            <button
              type="button"
              onClick={() => onSelect(m.id)}
              aria-label={`${m.name}, ${st.label}`}
              className={`absolute left-0 top-0 w-[clamp(96px,12.2vw,140px)] rounded-xl border-2 bg-panel/95 px-2.5 py-2 text-left shadow-lg transition-colors ${m.status === "down" ? "shake" : "-translate-x-1/2 -translate-y-1/2"} ${m.status !== "running" ? "pulse-ring" : ""} ${isSel ? "ring-2 ring-accent" : ""}`}
              style={{ borderColor: st.color, ["--ring" as string]: st.color }}
            >
              <div className="flex items-center justify-between gap-1" style={{ color: st.color }}>
                <MachineIcon kind={m.kind} className="size-6 shrink-0" />
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `color-mix(in oklab, ${st.color} 18%, transparent)` }}>
                  {m.status === "running" ? "OK" : m.status === "tech" ? "Tech" : m.status === "down" ? "Down" : "Fault"}
                </span>
              </div>
              <div className="mt-1 truncate text-[13px] font-semibold leading-tight">{m.name}</div>
              <div className="truncate text-[11px] text-muted">{card?.code ?? card?.label ?? m.model}</div>
            </button>
            {showQr && (
              <a
                href={`/m/${m.id}`}
                target="_blank"
                rel="noreferrer"
                className={`fade-in absolute w-[clamp(64px,7vw,92px)] rounded-lg bg-white p-1.5 shadow-xl ${m.y > H / 2 ? "left-[clamp(56px,6.6vw,78px)] top-0 -translate-y-1/2" : "left-0 top-[clamp(44px,5.4vw,60px)] -translate-x-1/2"}`}
                aria-label={`Operator link for ${m.name}`}
              >
                <QRCodeSVG value={`${origin}/m/${m.id}`} className="h-auto w-full" level="M" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
