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
        <Link href="/floor" className="rounded-full px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent/10">
          Back to floor
        </Link>
        <p className="text-[15px] text-muted">Print this page and stick each code on its machine. Scanning opens the operator view.</p>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-full bg-accent px-4 py-1.5 text-[15px] font-medium text-white">
          Print
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-0">
        {MACHINES.map((m) => (
          <div key={m.id} className="flex break-inside-avoid flex-col items-center rounded-[28px] bg-white p-6 text-[#1d1d1f] shadow-card print:rounded-none print:shadow-none print:outline print:outline-1 print:outline-[#ccc]">
            <div className="mb-3 text-[13px] font-semibold text-[#6e6e73]">Something wrong? Scan me.</div>
            {origin && <QRCodeSVG value={`${origin}/m/${m.id}`} className="h-auto w-full max-w-44" level="M" />}
            <div className="mt-3 text-[20px] font-semibold tracking-tight">{m.name}</div>
            <div className="text-center text-[13px] text-[#6e6e73]">{m.model}</div>
            <div className="mt-2 text-[11px] font-semibold text-[#1d1d1f]">FaultLine</div>
          </div>
        ))}
      </div>
    </main>
  );
}
