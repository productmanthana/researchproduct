import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { legacyIdeasUrl } from "@/lib/ideas-chat";

/** Compatibility alias: Ideas now live inside AI Chat. Replaces history so Back never bounces into a loop. */
export default function Ideas() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(legacyIdeasUrl(search), { replace: true }); }, [search, setLocation]);
  return <div className="p-6 text-sm text-muted-foreground" role="status" data-testid="status-ideas-redirect">Opening AI Chat...</div>;
}
