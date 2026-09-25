"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { MACHINES } from "@/lib/data";
import { useOrigin } from "@/lib/useNow";

/** Printable A4 sheet of machine QR stickers. */
export default function QrSheet() {
  const origin = useOrigin();
  return (
    <main className="mx-auto w-full max-w-4xl p-6 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <Link href="/floor" className="rounded-lg border border-line px-3 py-1.5 text-sm">
          Back to floor
        </Link>
        <p className="text-sm text-muted">Print this page and stick each code on its machine. Scanning opens the operator view.</p>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black">
          Print
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-0">
        {MACHINES.map((m) => (
          <div key={m.id} className="flex break-inside-avoid flex-col items-center rounded-2xl border-2 border-dashed border-line bg-white p-4 text-black print:rounded-none print:border-[#999]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest">Fault? Scan me</div>
            {origin && <QRCodeSVG value={`${origin}/m/${m.id}`} className="h-auto w-full max-w-44" level="M" />}
            <div className="mt-2 text-lg font-bold">{m.name}</div>
            <div className="text-center text-xs text-[#555]">{m.model}</div>
            <div className="mt-1 text-[10px] text-[#777]">FaultLine</div>
          </div>
        ))}
      </div>
    </main>
  );
}
