import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useUpdateResearchAlert } from "@workspace/api-client-react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAlerts, fmtDate, invalidateWatchData } from "@/lib/research-watch";

export function AlertBell() {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const alerts = useAlerts();
  const update = useUpdateResearchAlert();
  if (!isSignedIn) return null;
  const unread = alerts.data?.unread ?? 0;
  const latest = (alerts.data?.alerts ?? []).slice(0, 6);
  const markAll = async () => {
    await Promise.allSettled(latest.filter(a => !a.read).map(a => update.mutateAsync({ id: a.id, data: { read: true } })));
    await invalidateWatchData(qc);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="press relative rounded-lg p-2 hover:bg-[hsl(90_18%_86%)]" aria-label={`Research updates, ${unread} unread`} data-testid="button-alert-bell">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && <span key={unread} className="rise absolute -right-0.5 -top-0.5 min-w-[17px] rounded-full bg-vermilion px-1 text-center font-mono text-[10px] leading-[17px] text-white" data-testid="text-unread-count">{unread > 99 ? "99+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-0" data-testid="popover-alerts">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="sx-eyebrow">Research updates</p>
          {unread > 0 && <button className="text-xs underline" disabled={update.isPending} onClick={() => void markAll()} data-testid="button-mark-all-read">Mark shown as read</button>}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {alerts.isLoading && <div className="space-y-2 p-4">{[0, 1, 2].map(i => <div key={i} className="h-10 animate-pulse rounded bg-[hsl(66_20%_91%)]" />)}</div>}
          {alerts.isError && <p className="p-4 text-sm">Couldn't load updates. <button className="underline" onClick={() => void alerts.refetch()}>Retry</button></p>}
          {alerts.data && !latest.length && <p className="p-5 text-center text-sm text-muted-foreground">Nothing new. Watch a project to hear about new papers here.</p>}
          {latest.map(a => (
            <Link key={a.id} href="/research-updates" onClick={() => setOpen(false)} className="block border-b px-4 py-3 last:border-0 hover:bg-[hsl(90_20%_93%)]" data-testid={`link-bell-alert-${a.id}`}>
              <p className={`line-clamp-2 text-[13px] ${a.read ? "text-muted-foreground" : "font-medium"}`}>{!a.read && <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-[hsl(var(--teal))]" />}{a.title}</p>
              <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">{a.projectName} &middot; {a.kind} &middot; found {fmtDate(a.foundAt)}</p>
            </Link>
          ))}
        </div>
        <div className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">In-app only; email alerts are not enabled. <Link href="/research-updates" onClick={() => setOpen(false)} className="font-medium text-[hsl(var(--teal))] underline" data-testid="link-all-updates">Open all</Link></div>
      </PopoverContent>
    </Popover>
  );
}
