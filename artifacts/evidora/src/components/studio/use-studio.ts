import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetStudioItem, getGetStudioItemQueryKey, getListStudioItemsQueryKey, useListStudioItems, type StudioItem } from "@workspace/api-client-react";
import { isWorking } from "@/lib/studio";
import { isTemporaryRequestFailure, studioItemRefreshInterval } from "@/lib/request-errors";

/** Index states that will change on their own; keep polling until they settle. */
const INDEX_PENDING = new Set(["pending", "indexing", "queued", "running", "processing"]);
const unsettled = (i?: { status?: string; indexStatus?: string } | null) => !!i && (isWorking(i.status) || INDEX_PENDING.has(i.indexStatus ?? ""));

export function useStudioItem(id: string | null) {
  const qc = useQueryClient();
  const q = useGetStudioItem(id ?? "", {
    query: {
      enabled: !!id,
      queryKey: getGetStudioItemQueryKey(id ?? ""),
      initialData: () => qc.getQueriesData<StudioItem[]>({ queryKey: getListStudioItemsQueryKey() })
        .flatMap(([, data]) => Array.isArray(data) ? data : []).find(item => item.id === id),
      retry: (failures, error) => failures < 3 && isTemporaryRequestFailure(error),
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
      refetchInterval: query => studioItemRefreshInterval(query.state.data, query.state.error),
    },
  });
  const prev = useRef<string | undefined>(undefined);
  useEffect(() => {
    const s = q.data?.status;
    if (prev.current && isWorking(prev.current) && !isWorking(s)) void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
    prev.current = s;
  }, [q.data?.status, qc]);
  return q;
}

export function useProjectItems(projectId: string | null | undefined) {
  return useListStudioItems({ projectId: projectId ?? "" }, {
    query: {
      enabled: !!projectId,
      queryKey: getListStudioItemsQueryKey({ projectId: projectId ?? "" }),
      refetchInterval: (query) => { const d = query.state.data ?? []; return d.some(i => isWorking(i.status)) ? 4000 : d.some(unsettled) ? 6000 : false; },
    },
  });
}
