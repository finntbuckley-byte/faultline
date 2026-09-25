"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialState, reduce } from "./reducer";
import type { Action, FactoryState } from "./types";

const POLL_MS = 900;

/**
 * Shared factory state. Polls the in-memory server store so every screen
 * (projector, phones, technician laptop) stays in sync. Falls back to local
 * state if the API is unreachable, so the page never breaks mid-demo.
 */
export function useFactory() {
  const [state, setState] = useState<FactoryState>(initialState);
  const [online, setOnline] = useState(true);
  const latest = useRef(state.version);

  const accept = useCallback((s: FactoryState) => {
    if (s.version !== latest.current) {
      latest.current = s.version;
      setState(s);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        if (alive) {
          accept(await res.json());
          setOnline(true);
        }
      } catch {
        if (alive) setOnline(false);
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [accept]);

  const dispatch = useCallback(
    async (action: Action) => {
      // Optimistic update so taps feel instant.
      setState((s) => {
        const n = reduce(s, action, Date.now());
        return n;
      });
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        if (!res.ok) throw new Error(String(res.status));
        const s = (await res.json()) as FactoryState;
        latest.current = s.version;
        setState(s);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    },
    [],
  );

  /** Adopt a state returned by another endpoint (e.g. /api/report). */
  const replace = useCallback((s: FactoryState) => {
    latest.current = s.version;
    setState(s);
  }, []);

  return { state, dispatch, replace, online };
}

export const newId = () => Math.random().toString(36).slice(2, 10);
