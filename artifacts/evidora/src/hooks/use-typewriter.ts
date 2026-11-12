import { useEffect, useRef, useState } from "react";

/**
 * Reveals `target` progressively, like a typist, even when the server sends large snapshots.
 * Reveal speed adapts to the backlog: at least 90 characters per second, faster when a large
 * snapshot arrives, capped so text never dumps in one frame and never lags far behind.
 * If a snapshot rewrites earlier text, the reveal restarts from the shared prefix.
 */
export function useTypewriter(target: string, enabled = true) {
  const [shown, setShown] = useState(enabled ? "" : target);
  const pos = useRef(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduce) { pos.current = target.length; setShown(target); return; }
    // Keep the already-typed prefix only if the new snapshot still starts with it.
    let common = 0;
    const prev = shownRef.current;
    while (common < prev.length && common < target.length && prev[common] === target[common]) common++;
    pos.current = Math.min(pos.current, common);
  }, [target, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const t = targetRef.current, dt = Math.min(64, now - last);
      last = now;
      const backlog = t.length - pos.current;
      if (backlog > 0) {
        const rate = Math.min(900, Math.max(90, backlog * 2.5)); // characters per second
        const step = Math.max(1, Math.round((rate * dt) / 1000));
        let next = Math.min(t.length, pos.current + step);
        // Finish the current word so text never ends mid-word between frames.
        while (next < t.length && /\S/.test(t[next]) && next - pos.current < step + 12) next++;
        pos.current = next;
        setShown(t.slice(0, next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return enabled ? shown : target;
}
