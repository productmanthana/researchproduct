/** Keep gateway error pages and internal response markup out of user-facing messages. */
export function requestErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (!error) return fallback;
  const value = error as { data?: unknown; message?: unknown };
  const detail = value.data && typeof value.data === "object"
    ? (value.data as { error?: unknown }).error : undefined;
  const text = typeof detail === "string" ? detail : typeof value.message === "string" ? value.message : fallback;
  if (/<(?:!doctype|html|head|body|title|meta|script|style)\b/i.test(text))
    return "The service could not be reached. Please try again shortly.";
  return text;
}

export function itemLoadFailure(hasSavedItem: boolean) {
  return hasSavedItem
    ? { title: "Couldn't refresh this draft", message: "Showing the last loaded version. Your displayed draft is still available; retry to check for updates." }
    : { title: "Couldn't open this item", message: null };
}

export function isTemporaryRequestFailure(error: unknown): boolean {
  if (!error) return false;
  const e = error as { status?: number; message?: unknown; data?: unknown };
  if (e.status === 401 || e.status === 403) return false;
  const text = [e.message, typeof e.data === "string" ? e.data : ""].join(" ");
  // An HTML gateway 404 is not an API response saying that the document was deleted.
  if (/<(?:!doctype|html|head|body)\b/i.test(text)) return true;
  if (e.status) return [408, 500, 502, 503, 504].includes(e.status);
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(text);
}

export function studioItemRefreshInterval(item: { status?: string; indexStatus?: string } | undefined, error: unknown): number | false {
  if (error) return isTemporaryRequestFailure(error) ? 10000 : false;
  if (item?.status === "queued" || item?.status === "running") return 2500;
  if (item && ["pending", "indexing", "queued", "running", "processing"].includes(item.indexStatus ?? "")) return 5000;
  return false;
}
