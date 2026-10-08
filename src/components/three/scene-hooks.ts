"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// This hook stays in the lazy renderer chunk; the shell has no Three imports.
// A scheduled demand loop gives visible motion at <=30fps and no offscreen work.
export function useReactorClock(active: boolean, onReady: () => void) {
  const invalidate = useThree((state) => state.invalidate);
  const setDpr = useThree((state) => state.setDpr);
  const time = useRef(0);
  const previous = useRef<number | null>(null);
  const ready = useRef(false);
  const cadence = useRef({
    samples: 0,
    total: 0,
    interval: 1000 / 30,
    adapted: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    previous.current = null;
    if (active) invalidate();
    return () => clearTimeout(timer.current);
  }, [active, invalidate]);
  useFrame(() => {
    if (!active) return;
    const now = performance.now();
    if (previous.current !== null) {
      const elapsed = now - previous.current;
      time.current += Math.min(elapsed / 1000, 0.1);
      const budget = cadence.current;
      if (!budget.adapted) {
        budget.total += elapsed;
        budget.samples += 1;
        if (budget.samples === 45) {
          budget.adapted = true;
          if (budget.total / budget.samples > 65) {
            setDpr(1);
            budget.interval = 1000 / 20;
          }
        }
      }
    }
    previous.current = now;
    if (!ready.current) {
      ready.current = true;
      queueMicrotask(onReady);
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(invalidate, cadence.current.interval);
  }, -2);
  return time;
}
