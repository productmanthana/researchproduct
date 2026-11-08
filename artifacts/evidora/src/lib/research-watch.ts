import { useUser } from "@clerk/react";
import type { QueryClient } from "@tanstack/react-query";
import {
  useListResearchWatches, getListResearchWatchesQueryKey,
  useListResearchAlerts, getListResearchAlertsQueryKey,
  getListStudioItemsQueryKey, getGetStudioItemQueryKey,
  type ResearchWatch,
} from "@workspace/api-client-react";
import { format } from "date-fns";

export const ACTIVE_STATUSES = new Set(["queued", "running"]);
export const isActive = (w?: Pick<ResearchWatch, "status"> | null) => !!w && ACTIVE_STATUSES.has(w.status);

/** Watches owned by the signed-in user. Key carries the user id so nothing leaks across sign-ins. Polls while any check is queued/running. */
export function useWatches() {
  const { isSignedIn, user } = useUser();
  return useListResearchWatches({ query: {
    enabled: !!isSignedIn,
    queryKey: [...getListResearchWatchesQueryKey(), user?.id ?? "anon"],
    refetchInterval: q => (q.state.data ?? []).some(w => isActive(w)) ? 4000 : 60000,
  } });
}

/** All alerts (digest) for the signed-in user, polled every 30s. */
export function useAlerts() {
  const { isSignedIn, user } = useUser();
  return useListResearchAlerts(undefined, { query: {
    enabled: !!isSignedIn,
    queryKey: [...getListResearchAlertsQueryKey(), user?.id ?? "anon"],
    refetchInterval: 30000,
  } });
}

export async function invalidateWatchData(qc: QueryClient, opts?: { itemId?: string | null }) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: getListResearchWatchesQueryKey() }),
    qc.invalidateQueries({ queryKey: getListResearchAlertsQueryKey() }),
    qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() }),
    ...(opts?.itemId ? [qc.invalidateQueries({ queryKey: getGetStudioItemQueryKey(opts.itemId) })] : []),
  ]);
}

export function fmtDate(iso?: string | null, withTime = false, empty = "never"): string {
  if (!iso) return empty;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy");
}

export function proposeTopic(src: { title?: string; content?: string; name?: string; description?: string }): string {
  const head = (src.title || src.name || "").trim();
  const body = (src.content || src.description || "").replace(/[#*_>`]/g, " ").replace(/\s+/g, " ").trim();
  const text = [head, body.slice(0, 420)].filter(Boolean).join(": ");
  return text.slice(0, 600);
}

export const STATUS_LABEL: Record<string, string> = {
  queued: "Check queued", running: "Checking now", partial: "Checked \u00b7 partial coverage",
  completed: "Watching", paused: "Paused", error: "Last check failed",
};

/** Topic/age fields arriving in the regenerated schema; read defensively so this compiles before and after. */
export type AlertExtras = { watchedTopic?: string | null; ageLabel?: string | null };
