import { useEffect } from "react";

const dirty = new Map<string, string>();

export function setUnsaved(key: string, message: string | null) {
  if (message) dirty.set(key, message); else dirty.delete(key);
}

export function hasUnsaved() { return dirty.size > 0; }

/** Returns true when it is safe to navigate or switch context. */
export function confirmLeave(): boolean {
  if (!dirty.size) return true;
  const msg = [...dirty.values()][0];
  return window.confirm(`${msg} Leave anyway? Your unsaved edits will be lost.`);
}

export function useUnsavedGuard(key: string, isDirty: boolean, message = "You have unsaved edits.") {
  useEffect(() => {
    setUnsaved(key, isDirty ? message : null);
    return () => setUnsaved(key, null);
  }, [key, isDirty, message]);
  useEffect(() => {
    if (!isDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);
}
