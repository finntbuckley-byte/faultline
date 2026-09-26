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
    <div className="relative w-full overflow-hidden rounded-[28px] bg-panel shadow-card" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.2" fill="var(--line)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" />

        {/* zones */}
        <rect x="30" y="96" width="940" height="208" rx="22" fill="var(--panel-2)" />
        <text x="52" y="126" fill="var(--muted)" fontSize="14" fontWeight="600">Production line</text>
        <rect x="120" y="372" width="530" height="196" rx="22" fill="var(--panel-2)" />
        <text x="142" y="402" fill="var(--muted)" fontSize="14" fontWeight="600">Plant room</text>
        <rect x="760" y="372" width="210" height="196" rx="22" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="6 6" />
        <text x="782" y="402" fill="var(--muted)" fontSize="14" fontWeight="600">Dispatch</text>
        <text x="865" y="486" textAnchor="middle" fill="var(--muted)" fontSize="13" opacity="0.7">Loading bay</text>

        {/* compressed air */}
        <g opacity={compressorOn ? 1 : 0.35}>
          <path d="M230 405V330H490V262M230 330H110V262" fill="none" stroke="var(--tech)" strokeOpacity="0.14" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M230 405V330H490V262M230 330H110V262" fill="none" stroke="var(--tech)" strokeWidth="2" strokeDasharray="3 12" strokeLinecap="round" className={compressorOn ? "pipe-flow" : ""} />
          <text x="300" y="322" fill="var(--tech)" fontSize="12">Compressed air</text>
        </g>

        {/* dust extraction */}
        <g opacity={dustOn ? 1 : 0.35}>
          <path d="M110 262V350H520V405" fill="none" stroke="var(--warn)" strokeOpacity="0.12" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M110 262V350H520V405" fill="none" stroke="var(--warn)" strokeWidth="2" strokeDasharray="3 12" strokeLinecap="round" className={dustOn ? "pipe-flow" : ""} />
          <text x="560" y="345" fill="var(--warn)" fontSize="12">Dust extraction</text>
        </g>

        {/* conveyors */}
        {LINE.slice(0, -1).map((id, i) => {
          const a = byId[id];
          const b = byId[LINE[i + 1]];
          if (!a || !b) return null;
          const x1 = a.x + 64;
          const x2 = b.x - 64;
          const flowing = running(id) && running(b.id);
          return (
            <g key={id}>
              <rect x={x1} y={194} width={x2 - x1} height={12} rx={6} fill="var(--line)" />
              <line x1={x1 + 6} y1={200} x2={x2 - 6} y2={200} stroke="var(--muted)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 8" className={flowing ? "belt-run" : ""} />
              {flowing ? (
                [0, 1].map((k) => (
                  <rect key={k} x={x1 + 2} y={191} width={14} height={9} rx={2.5} fill="#c8a27a" opacity={0}>
                    <set attributeName="opacity" to="1" begin={`${k * 1.3}s`} />
                    <animate attributeName="x" from={x1 + 2} to={x2 - 16} dur="2.6s" begin={`${k * 1.3}s`} repeatCount="indefinite" />
                  </rect>
                ))
              ) : (
                <rect x={x2 - 20} y={191} width={14} height={9} rx={2.5} fill="#c8a27a" opacity="0.5" />
              )}
            </g>
          );
        })}

        {/* packing to dispatch */}
        <rect x="874" y="262" width="12" height="150" rx="6" fill="var(--line)" />
        {running("packing") && (
          <rect x="875.5" width="9" height="14" rx="2.5" fill="#c8a27a">
            <animate attributeName="y" from="266" to="396" dur="2.4s" repeatCount="indefinite" />
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
              className={`absolute left-0 top-0 w-[clamp(100px,12.4vw,148px)] rounded-[18px] bg-panel px-3 py-2.5 text-left shadow-card transition-shadow hover:shadow-float ${m.status === "down" ? "shake" : "-translate-x-1/2 -translate-y-1/2"} ${m.status !== "running" ? "pulse-ring" : ""} ${isSel ? "ring-2 ring-accent" : m.status === "running" ? "ring-1 ring-line" : ""}`}
              style={{ ["--ring" as string]: st.color, ...(m.status !== "running" && !isSel ? { outline: `2px solid ${st.color}`, outlineOffset: 0 } : {}) }}
            >
              <div className="flex items-center justify-between gap-1">
                <MachineIcon kind={m.kind} className="size-[22px] shrink-0 text-muted" />
                <span className="size-2.5 rounded-full" style={{ background: st.color }} aria-hidden />
              </div>
              <div className="mt-1.5 truncate text-[14px] font-semibold leading-tight">{m.name}</div>
              <div className="truncate text-[12px]" style={{ color: m.status === "running" ? "var(--muted)" : st.color }}>
                {m.status === "running" ? m.model : card?.code ?? card?.label ?? st.label}
              </div>
            </button>
            {showQr && (
              <a
                href={`/m/${m.id}`}
                target="_blank"
                rel="noreferrer"
                className={`fade-in absolute w-[clamp(64px,7vw,92px)] rounded-2xl bg-white p-2 shadow-float ring-1 ring-black/5 ${m.y > H / 2 ? "left-[clamp(56px,6.6vw,78px)] top-0 -translate-y-1/2" : "left-0 top-[clamp(44px,5.4vw,60px)] -translate-x-1/2"}`}
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
