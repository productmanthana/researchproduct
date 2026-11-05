import type { ReactNode } from "react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { RowSkeleton } from "@/components/states";

export function RequireAuth({ children, what }: { children: ReactNode; what: string }) {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <RowSkeleton rows={3} />;
  if (!isSignedIn)
    return (
      <div className="blueprint rise mx-auto mt-10 max-w-xl rounded-lg p-10 text-center text-[hsl(40_30%_92%)]" data-testid="panel-signin-required">
        <Lock className="mx-auto h-7 w-7 text-turmeric" />
        <h2 className="mt-4 text-2xl font-semibold">Your {what} is private</h2>
        <p className="mt-2 text-sm text-[hsl(40_20%_78%)]">
          Sign in to keep papers, notes, documents and analyses tied to your account. Search and paper pages stay open to everyone.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sign-in" className="press rounded-md bg-turmeric px-4 py-2 text-sm font-medium text-[hsl(216_42%_13%)]" data-testid="link-signin">
            Sign in
          </Link>
          <Link href="/sign-up" className="press rounded-md border border-[hsl(40_30%_90%/0.3)] px-4 py-2 text-sm" data-testid="link-signup">
            Create account
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
