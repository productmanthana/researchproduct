import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetStudioItem, getGetStudioItemQueryKey, getListStudioItemsQueryKey, useListStudioItems } from "@workspace/api-client-react";
import { isWorking } from "@/lib/studio";

/** Index states that will change on their own; keep polling until they settle. */
const INDEX_PENDING = new Set(["pending", "indexing", "queued", "running", "processing"]);
const unsettled = (i?: { status?: string; indexStatus?: string } | null) => !!i && (isWorking(i.status) || INDEX_PENDING.has(i.indexStatus ?? ""));

export function useStudioItem(id: string | null) {
  const qc = useQueryClient();
  const q = useGetStudioItem(id ?? "", {
    query: {
      enabled: !!id,
      queryKey: getGetStudioItemQueryKey(id ?? ""),
      refetchInterval: (query) => (isWorking(query.state.data?.status) ? 2500 : unsettled(query.state.data) ? 5000 : false),
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
