import { useSyncExternalStore } from "react";

export type SelectedPaper = { id: string; title: string };

const KEY = "evidora.selection.v1";
let state: SelectedPaper[] = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
})();
const listeners = new Set<() => void>();

function emit(next: SelectedPaper[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const selection = {
  toggle(p: SelectedPaper) {
    emit(state.some((s) => s.id === p.id) ? state.filter((s) => s.id !== p.id) : [...state, p]);
  },
  addMany(ps: SelectedPaper[]) {
    const ids = new Set(state.map((s) => s.id));
    emit([...state, ...ps.filter((p) => !ids.has(p.id))]);
  },
  remove(id: string) {
    emit(state.filter((s) => s.id !== id));
  },
  clear() {
    emit([]);
  },
};

export function useSelection(): SelectedPaper[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
