import { formatDistanceToNow } from "date-fns";
import { requestErrorMessage } from "./request-errors";

export function authorsShort(authors: string[], max = 3): string {
  if (!authors?.length) return "Unknown authors";
  if (authors.length <= max) return authors.join(", ");
  return `${authors.slice(0, max).join(", ")} et al.`;
}

export function ago(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function num(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n ?? 0);
}

export function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function errMessage(e: unknown, fallback = "Something went wrong"): string {
  return requestErrorMessage(e, fallback);
}

export function evidenceTone(level: string): string {
  const l = (level || "").toLowerCase();
  if (l.includes("high") || l.includes("meta") || l.includes("systematic") || l.includes("peer"))
    return "border-[hsl(var(--leaf)/0.35)] bg-[hsl(var(--leaf)/0.08)] text-leaf";
  if (l.includes("low") || l.includes("preprint") || l.includes("unverified"))
    return "border-[hsl(var(--vermilion)/0.35)] bg-[hsl(var(--vermilion)/0.07)] text-vermilion";
  return "border-[hsl(var(--turmeric)/0.6)] bg-[hsl(var(--turmeric)/0.15)] text-[hsl(30_60%_28%)]";
}

export const PROJECT_COLORS = ["#1F5A8C", "#DE4A2C", "#E0A526", "#2A7A5F", "#6B4E9B", "#B5476E", "#3D4A5C"];
