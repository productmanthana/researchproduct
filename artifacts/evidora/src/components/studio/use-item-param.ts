import { useLocation, useSearch } from "wouter";
import { confirmLeave } from "@/lib/unsaved";

/** Keeps the open studio item in ?item= so it survives reloads and is shareable within the account. */
export function useItemParam() {
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const id = params.get("item");
  const setId = (next: string | null, opts?: { guard?: boolean }) => {
    if (opts?.guard && !confirmLeave()) return;
    const p = new URLSearchParams(search);
    if (next) p.set("item", next); else p.delete("item");
    const qs = p.toString();
    setLocation(`${location}${qs ? `?${qs}` : ""}`);
  };
  return { id, setId, params };
}
