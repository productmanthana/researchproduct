import type { StudioItem } from "@workspace/api-client-react";
import { FileText } from "lucide-react";
import { isWorking, KIND_LABEL, latestItems } from "@/lib/studio";
import { ago } from "@/lib/format";
import { RowSkeleton } from "@/components/states";

export function ItemList({ items, kinds, activeId, onOpen, loading, emptyText }: { items: StudioItem[]; kinds: string[]; activeId: string | null; onOpen: (id: string) => void; loading?: boolean; emptyText: string }) {
  const list = latestItems(items.filter(i => kinds.includes(i.kind)));
  if (loading) return <RowSkeleton rows={2} />;
  if (!list.length) return <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground" data-testid="status-items-empty">{emptyText}</p>;
  return (
    <ul className="space-y-1.5" data-testid="list-studio-items">
      {list.map(i => (
        <li key={i.id}>
          <button onClick={() => onOpen(i.id)} aria-current={activeId === i.id || undefined}
            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${activeId === i.id ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.07)]" : "bg-[hsl(52_40%_98%)] hover:bg-[hsl(90_20%_93%)]"}`}
            data-testid={`button-open-item-${i.id}`}>
            <span className="flex items-start gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--teal))]" /><span className="line-clamp-2 font-medium">{i.title}</span></span>
            <span className="mt-1 flex items-center gap-1.5 pl-5 font-mono text-[10.5px] text-muted-foreground">
              {KIND_LABEL[i.kind] ?? i.kind} &middot; rev {i.revision} &middot; {ago(i.createdAt)}
              {isWorking(i.status) && <span className="pulse-dot ml-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--teal))]" />}
              {i.status === "failed" && <span className="text-vermilion">failed</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
