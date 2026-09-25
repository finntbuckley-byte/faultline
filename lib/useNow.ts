"use client";

import { useSyncExternalStore } from "react";

let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Wall clock that ticks every second; 0 during server render. */
export const useNow = () => useSyncExternalStore(subscribe, () => now, () => 0);

const noop = () => () => {};
/** window.location.origin on the client; empty during server render. */
export const useOrigin = () => useSyncExternalStore(noop, () => window.location.origin, () => "");
