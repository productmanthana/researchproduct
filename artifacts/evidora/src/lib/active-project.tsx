import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { useListProjects, getListProjectsQueryKey, type Project } from "@workspace/api-client-react";
import { confirmLeave } from "@/lib/unsaved";

type Ctx = {
  project: Project | null;
  projects: Project[];
  loading: boolean;
  error: unknown;
  refetch: () => void;
  /** Explicit selection. Clears a stale ?item= (other params kept) when the project changes, unless preserveItem (deep-link alignment). */
  select: (id: string | null, opts?: { skipGuard?: boolean; preserveItem?: boolean }) => boolean;
};

const ActiveProjectContext = createContext<Ctx | null>(null);
const keyFor = (uid: string) => `evidora:active-project:${uid}`;

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const uid = user?.id ?? null;
  const list = useListProjects({ query: { enabled: !!isSignedIn, queryKey: [...getListProjectsQueryKey(), uid ?? "anon"] } });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(uid ? window.localStorage.getItem(keyFor(uid)) : null);
  }, [uid]);

  const projects = useMemo(() => (isSignedIn ? list.data ?? [] : []), [isSignedIn, list.data]);
  // A stored id that no longer exists (folder deleted or merged away) falls back to the newest folder,
  // so every project page is not left gated behind "None selected".
  const storedProject = projects.find(p => p.id === selectedId) ?? null;
  const project = storedProject ?? (selectedId && !list.isLoading ? projects[0] ?? null : null);

  const [location, setLocation] = useLocation();
  const search = useSearch();
  const routeRef = useRef({ location, search, setLocation });
  routeRef.current = { location, search, setLocation };
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const select = useCallback((id: string | null, opts?: { skipGuard?: boolean; preserveItem?: boolean }) => {
    if (!opts?.skipGuard && !confirmLeave()) return false;
    const changed = id !== selectedRef.current;
    selectedRef.current = id;
    setSelectedId(id);
    if (changed && !opts?.preserveItem) {
      const { location: loc, search: qs, setLocation: go } = routeRef.current;
      const p = new URLSearchParams(qs);
      if (p.has("item")) { p.delete("item"); const rest = p.toString(); go(`${loc}${rest ? `?${rest}` : ""}`, { replace: true }); }
    }
    if (uid) { if (id) window.localStorage.setItem(keyFor(uid), id); else window.localStorage.removeItem(keyFor(uid)); }
    return true;
  }, [uid]);

  const value: Ctx = { project, projects, loading: !!isSignedIn && list.isLoading, error: list.error, refetch: () => void list.refetch(), select };
  return <ActiveProjectContext.Provider value={value}>{children}</ActiveProjectContext.Provider>;
}

export function useActiveProject(): Ctx {
  const ctx = useContext(ActiveProjectContext);
  if (!ctx) throw new Error("useActiveProject must be used within ActiveProjectProvider");
  return ctx;
}
