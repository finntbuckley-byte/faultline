"use client";

import { useEffect, useState } from "react";

interface PageData {
  title: string;
  page: number;
  content: string;
  pdfUrl: string | null;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Find the quote inside the page text (whitespace-insensitive) so it can be highlighted. */
function splitOnQuote(content: string, quote: string): [string, string, string] | null {
  const text = norm(content);
  const q = norm(quote).replace(/[.…]+$/, "");
  if (q.length < 8) return null;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return null;
  return [text.slice(Math.max(0, i - 700), i), text.slice(i, i + q.length), text.slice(i + q.length, i + q.length + 900)];
}

/** Shows the real manual page the step was drawn from, with the cited passage highlighted. */
export function ManualSheet({ machineId, manual, page, quote, onClose }: { machineId: string; manual: string; page: number; quote: string; onClose: () => void }) {
  const [data, setData] = useState<PageData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/manual-page?machineId=${encodeURIComponent(machineId)}&page=${page}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: PageData) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [machineId, page]);

  const parts = data ? splitOnQuote(data.content, quote) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-[2px]" onClick={onClose} role="dialog" aria-modal aria-label={`${manual}, page ${page}`}>
      <div className="slide-up max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-panel px-5 pb-8 pt-2 shadow-float" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 mt-1 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold">{data?.title ?? manual}</div>
            <div className="text-[13px] text-muted">Page {page}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            {data?.pdfUrl && (
              <a href={data.pdfUrl} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-[15px] font-medium text-accent hover:bg-accent/10">
                Open PDF
              </a>
            )}
            <button type="button" onClick={onClose} className="rounded-full bg-panel-2 px-3.5 py-1.5 text-[15px] font-medium">
              Close
            </button>
          </div>
        </div>
        <div className="rounded-[18px] bg-white p-6 text-[15px] leading-relaxed text-[#1d1d1f] ring-1 ring-black/5">
          <div className="mb-4 flex justify-between text-[11px] text-[#86868b]">
            <span className="truncate">{data?.title ?? manual}</span>
            <span>{page}</span>
          </div>
          {!data && !failed && (
            <div className="grid gap-2">
              {[92, 84, 97, 71].map((w, i) => (
                <div key={i} className="h-2 animate-pulse rounded bg-[#1d1d1d]/15" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
          {data &&
            (parts ? (
              <p className="whitespace-pre-wrap">
                <span className="text-[#555]">{parts[0] && "…"}{parts[0]}</span>
                <mark className="rounded bg-[#ffe066] px-0.5 font-medium text-[#1d1d1f]">{parts[1]}</mark>
                <span className="text-[#555]">{parts[2]}{parts[2] && "…"}</span>
              </p>
            ) : (
              <>
                <p className="mb-3 rounded bg-[#ffe066] px-2 py-1.5 font-medium">{quote}</p>
                <p className="whitespace-pre-wrap text-[13px] text-[#555]">{norm(data.content).slice(0, 1400)}</p>
              </>
            ))}
          {failed && <p className="rounded bg-[#ffe066] px-2 py-1.5 font-medium">{quote}</p>}
        </div>
        <p className="mt-4 px-1 text-[13px] text-muted">The highlighted text is the exact passage FaultLine used for this step.</p>
      </div>
    </div>
  );
}
