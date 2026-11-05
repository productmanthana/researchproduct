import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetUsage, getGetUsageQueryKey, useGetAccount, getGetAccountQueryKey } from "@workspace/api-client-react";
import { BookMarked, Compass, FlaskConical, FolderKanban, LineChart, LogOut, Menu, MessageSquareText, Plug, Receipt, X } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { UsageMeters } from "@/components/usage-meters";
import { useSelection } from "@/lib/selection";

const NAV = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/ask", label: "Ask", icon: MessageSquareText },
  { href: "/research", label: "Research", icon: FlaskConical },
  { href: "/library", label: "Library", icon: BookMarked },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/landscape", label: "Landscape", icon: LineChart },
  { href: "/sources", label: "Sources", icon: Plug },
  { href: "/plans", label: "Plans & usage", icon: Receipt },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const selected = useSelection();
  const usage = useGetUsage({ query: { enabled: !!isSignedIn, queryKey: getGetUsageQueryKey() } });
  const account = useGetAccount({ query: { enabled: !!isSignedIn, queryKey: getGetAccountQueryKey() } });

  return (
    <div className="flex h-full flex-col">
      <Link href="/discover" className="px-5 pb-6 pt-6" onClick={onNavigate} data-testid="link-brand">
        <Wordmark light />
      </Link>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((n) => {
          const active = location === n.href || location.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onNavigate}
              data-testid={`link-nav-${n.label.split(" ")[0].toLowerCase()}`}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <span className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-turmeric transition-transform ${active ? "scale-y-100" : "scale-y-0"}`} />
              <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${active ? "text-turmeric" : ""}`} />
              {n.label}
              {n.href === "/research" && selected.length > 0 && (
                <span className="ml-auto rounded bg-vermilion px-1.5 font-mono text-[10px] text-white" data-testid="text-selection-count">
                  {selected.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-md border border-sidebar-border p-3.5">
        {isSignedIn ? (
          <>
            {usage.data && (
              <>
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-turmeric">
                  {usage.data.plan} &middot; {usage.data.period === "starter" ? "lifetime trial" : usage.data.period}
                </p>
                <UsageMeters usage={usage.data} dark />
              </>
            )}
            <div className="mt-4 flex items-center gap-2.5 border-t border-sidebar-border pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turmeric font-mono text-xs font-medium text-[hsl(216_42%_13%)]">
                {(user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" data-testid="text-user-email">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                {account.data && <p className="font-mono text-[10px] text-sidebar-foreground/60">{account.data.role}</p>}
              </div>
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="press rounded p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="Sign out"
                data-testid="button-signout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-sidebar-foreground/70">Search is open. Sign in to save papers and run analyses.</p>
            <Link href="/sign-in" className="press block rounded bg-turmeric py-1.5 text-center text-sm font-medium text-[hsl(216_42%_13%)]" data-testid="link-sidebar-signin">
              Sign in
            </Link>
            <Link href="/sign-up" className="block rounded border border-sidebar-border py-1.5 text-center text-sm" data-testid="link-sidebar-signup">
              Create account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-sidebar text-sidebar-foreground lg:block">
        <SidebarBody />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-4 py-3 lg:hidden">
        <Link href="/discover" data-testid="link-brand-mobile">
          <Wordmark light />
        </Link>
        <button onClick={() => setOpen(true)} className="rounded p-2 text-sidebar-foreground" data-testid="button-menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[hsl(216_42%_10%/0.5)]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground shadow-xl animate-in slide-in-from-left duration-200">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1 text-sidebar-foreground" data-testid="button-menu-close">
              <X className="h-5 w-5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
