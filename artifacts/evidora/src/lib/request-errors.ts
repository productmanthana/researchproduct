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
