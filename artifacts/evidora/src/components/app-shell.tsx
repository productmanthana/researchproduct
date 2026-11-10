import { useState, type MouseEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetUsage, getGetUsageQueryKey, useGetAccount, getGetAccountQueryKey } from "@workspace/api-client-react";
import {
  BellRing, BookMarked, BookOpenText, Compass, FlaskConical, FolderKanban, GraduationCap, Leaf, Library, Lightbulb, LineChart, LogOut, Menu,
  MessageSquareText, Newspaper, Plug, Receipt, ScanSearch, ScrollText, Stamp, X,
  ClipboardCheck,
} from "lucide-react";
import { AlertBell } from "@/components/research/alert-bell";
import { UsageMeters } from "@/components/usage-meters";
import { ProjectSwitcher } from "@/components/studio/project-switcher";
import { useSelection } from "@/lib/selection";
import { allUsageLimitMessages } from "@/lib/usage-limits";
import { confirmLeave } from "@/lib/unsaved";
import "@/components/studio/studio-ui.css";

const GROUPS = [
  { label: "Write", items: [
    { href: "/ideas", label: "Ideas", icon: Lightbulb },
    { href: "/ask", label: "AI Chat", icon: MessageSquareText },
    { href: "/literature", label: "Literature review", icon: BookOpenText },
    { href: "/synopsis", label: "Synopsis", icon: ScrollText },
    { href: "/journals", label: "Journals", icon: Newspaper },
    { href: "/thesis", label: "Thesis", icon: GraduationCap },
  ] },
  { label: "Check", items: [
    { href: "/originality", label: "Originality", icon: ScanSearch },
    { href: "/paper-review", label: "Paper Review", icon: ClipboardCheck },
    { href: "/patents", label: "Patents", icon: Stamp },
  ] },
  { label: "Evidence", items: [
    { href: "/my-library", label: "My Library", icon: Library },
    { href: "/research-updates", label: "Research updates", icon: BellRing },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/research", label: "Research", icon: FlaskConical },
    { href: "/library", label: "Saved papers", icon: BookMarked },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/landscape", label: "Landscape", icon: LineChart },
  ] },
  { label: "Account", items: [
    { href: "/sources", label: "Sources", icon: Plug },
    { href: "/plans", label: "Plans & usage", icon: Receipt },
  ] },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const guard = (e: MouseEvent) => { if (!confirmLeave()) e.preventDefault(); };

function Brand() {
  return <span className="sx-brand"><span className="mark"><Leaf className="h-4 w-4" /></span>evidora<b>.</b></span>;
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const selected = useSelection();
  const usage = useGetUsage({ query: { enabled: !!isSignedIn, queryKey: getGetUsageQueryKey() } });
  const account = useGetAccount({ query: { enabled: !!isSignedIn, queryKey: getGetAccountQueryKey() } });
  const go = (e: MouseEvent) => { guard(e); if (!e.defaultPrevented) onNavigate?.(); };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-4 pl-5 pr-3 pt-6"><Link href="/discover" onClick={go} data-testid="link-brand"><Brand /></Link>{!onNavigate && <AlertBell />}</div>
      {isSignedIn && <div className="px-3 pb-1"><ProjectSwitcher onNavigate={onNavigate} /></div>}
      <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Main">
        {GROUPS.map(g => (
          <div key={g.label}>
            <p className="sx-group">{g.label}</p>
            {g.items.map(n => {
              const active = location === n.href || location.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href} onClick={go} aria-current={active ? "page" : undefined} className="sx-link" data-testid={`link-nav-${n.href.slice(1)}`}>
                  <Icon />{n.label}
                  {n.href === "/research" && selected.length > 0 && <span className="ml-auto rounded bg-vermilion px-1.5 font-mono text-[10px] text-white" data-testid="text-selection-count">{selected.length}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-lg border border-[hsl(90_14%_82%)] bg-[hsl(52_40%_97%)] p-3">
        {isSignedIn ? (
          <>
            {usage.data && <><p className="sx-eyebrow mb-2">{usage.data.plan} &middot; {usage.data.period === "starter" ? "lifetime trial" : usage.data.period}</p><UsageMeters usage={usage.data} /></>}
            <div className="mt-3 flex items-center gap-2.5 border-t border-[hsl(90_14%_84%)] pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[hsl(120_14%_72%)] font-mono text-xs text-[hsl(var(--teal))]">
                {(user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" data-testid="text-user-email">{user?.primaryEmailAddress?.emailAddress}</p>
                {account.data && <p className="font-mono text-[10px] text-muted-foreground">{account.data.role}</p>}
              </div>
              <button onClick={() => { if (confirmLeave()) void signOut({ redirectUrl: basePath || "/" }); }} className="press rounded p-1.5 hover:bg-[hsl(90_18%_86%)]" title="Sign out" aria-label="Sign out" data-testid="button-signout"><LogOut className="h-4 w-4" /></button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Search is open. Sign in to keep projects, drafts and papers.</p>
            <Link href="/sign-in" className="sx-btn sx-primary w-full" data-testid="link-sidebar-signin">Sign in</Link>
            <Link href="/sign-up" className="sx-btn w-full" data-testid="link-sidebar-signup">Create account</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isSignedIn } = useUser();
  const usage = useGetUsage({ query: { enabled: !!isSignedIn, queryKey: getGetUsageQueryKey(), refetchInterval: 30000 } });
  const limitMessages = allUsageLimitMessages(usage.data);
  const ask = location === "/ask";
  return (
    <div className="sx-shell min-h-[100dvh]">
      <aside className="sx-side fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><SidebarBody /></aside>
      <header className="sx-side sticky top-0 z-30 flex h-[57px] items-center justify-between border-b px-4 lg:hidden">
        <Link href="/discover" onClick={guard} data-testid="link-brand-mobile"><Brand /></Link>
        <div className="flex items-center gap-1"><AlertBell /><button onClick={() => setOpen(true)} className="rounded p-2" aria-label="Open menu" data-testid="button-menu"><Menu className="h-5 w-5" /></button></div>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[hsl(174_22%_19%/0.4)]" onClick={() => setOpen(false)} />
          <aside className="sx-side absolute inset-y-0 left-0 w-72 shadow-xl animate-in slide-in-from-left duration-200">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1" aria-label="Close menu" data-testid="button-menu-close"><X className="h-5 w-5" /></button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <main className="lg:pl-64">
        {!ask && limitMessages.length > 0 && <div role="status" className="border-b border-vermilion/25 bg-vermilion/5 px-5 py-3 text-sm" data-testid="notice-usage-limits">
          {limitMessages.map(message => <p key={message}>{message}</p>)}
          <Link href="/plans" className="mt-1 inline-block font-medium underline">View Plans &amp; usage</Link>
        </div>}
        {ask ? <div className="ev-ask-host">{children}</div> : <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</div>}
      </main>
    </div>
  );
}
