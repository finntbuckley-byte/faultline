"use client";

import { useEffect } from "react";

/** Mock manual page viewer. Swap for react-pdf once real manuals are loaded. */
export function ManualSheet({ manual, page, quote, onClose }: { manual: string; page: number; quote: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bars = [92, 84, 97, 71, 88, 64];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal aria-label={`${manual}, page ${page}`}>
      <div className="slide-up max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-line bg-panel p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{manual}</div>
            <div className="text-xs text-muted">Page {page}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-sm">
            Close
          </button>
        </div>
        <div className="rounded-lg bg-[#f4f1ea] p-5 text-[#1d1d1d] shadow-inner">
          <div className="mb-3 flex justify-between text-[10px] uppercase tracking-widest text-[#777]">
            <span>{manual}</span>
            <span>{page}</span>
          </div>
          <div className="mb-3 h-3 w-1/2 rounded bg-[#1d1d1d]/80" />
          {bars.slice(0, 3).map((w, i) => (
            <div key={i} className="mb-2 h-2 rounded bg-[#1d1d1d]/15" style={{ width: `${w}%` }} />
          ))}
          <p className="my-3 rounded bg-yellow-300/80 px-2 py-1.5 text-sm font-medium leading-snug">{quote}</p>
          {bars.slice(3).map((w, i) => (
            <div key={i} className="mb-2 h-2 rounded bg-[#1d1d1d]/15" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Highlighted text is the exact passage FaultLine used for this step.</p>
      </div>
    </div>
  );
}
