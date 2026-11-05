import type { Usage } from "@workspace/api-client-react";

export type ResearchKind = "answer" | "review" | "image";
const fields = {
  answer: ["answersUsed", "answersLimit", "Answer"],
  review: ["reviewsUsed", "reviewsLimit", "Literature review"],
  image: ["imagesUsed", "imagesLimit", "Image analysis"],
} as const;

export function usageLimitMessage(usage: Usage | undefined, kind: ResearchKind): string | null {
  if (!usage) return null;
  if (typeof usage.aiServiceRemainingInr === "number" && usage.aiServiceRemainingInr <= 0)
    return "Service AI budget limit reached. New AI analyses are paused until the monthly budget resets, including for unlimited accounts. You can still read saved research.";
  const [used, limit, label] = fields[kind];
  if (usage[limit] < 0 || usage[used] < usage[limit]) return null;
  return `${label} limit reached. ${usage.period === "starter"
    ? "Your one-time trial allowance is used up; it does not reset monthly."
    : "Your allowance for this month is used up; it resets next month."} See Plans & usage for details.`;
}

export function allUsageLimitMessages(usage: Usage | undefined): string[] {
  return [...new Set((["answer", "review", "image"] as const)
    .map(kind => usageLimitMessage(usage, kind)).filter((v): v is string => !!v))];
}
