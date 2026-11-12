import { useEffect, useRef, useState } from "react";

/**
 * Reveals `target` progressively, like a typist, even when the server sends large snapshots.
 * Speed adapts to the backlog so the visible text never falls far behind (≈1s to catch up).
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
        // ~60 chars/s minimum; faster when far behind so it catches up within about a second.
        const step = Math.max(1, Math.round((Math.max(60, backlog) * dt) / 1000));
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
