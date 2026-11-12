import { logger } from "./logger";

/** Independent checks by Pangram Labs (https://docs.pangram.com). Needs PANGRAM_API_KEY. */
const AI_URL = "https://text.external-api.pangram.com/task";
const PLAGIARISM_URL = "https://plagiarism.api.pangram.com";
/** Targets for a submission-ready draft: 99% human and 99% unique. */
export const EXTERNAL_TARGET = 99;

export type ExternalAiCheck = {
  humanPercent: number; aiPercent: number; aiAssistedPercent: number;
  prediction: string; flagged: { text: string; label: string; confidence: string }[];
};
export type ExternalPlagiarismCheck = {
  uniquePercent: number; plagiarizedPercent: number; totalSentences: number; plagiarizedSentences: number;
  matches: { sourceUrl: string; matchedText: string; similarity: number }[];
};
export type ExternalChecks = {
  provider: "Pangram Labs"; target: number; checkedAt: string;
  ai?: ExternalAiCheck; plagiarism?: ExternalPlagiarismCheck; errors: string[];
};

const key = () => process.env.PANGRAM_API_KEY;
const round = (v: number) => Math.round(v * 1000) / 10;

async function call(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000), headers: { "Content-Type": "application/json", "x-api-key": key()!, ...init.headers } });
  if (!res.ok) throw new Error(res.status === 401 ? "invalid API key" : res.status === 402 ? "out of credits" : `HTTP ${res.status}`);
  return res.json() as Promise<any>;
}

async function aiCheck(text: string): Promise<ExternalAiCheck> {
  const { task_id } = await call(AI_URL, { method: "POST", body: JSON.stringify({ text, model: "pangram-4" }) });
  for (let i = 0; i < 60; i++) {
    const r = await call(`${AI_URL}/${task_id}`, { method: "GET" });
    if (r.stage === "STAGE_FAILED") throw new Error(r.headline || "detection failed");
    if (r.stage === "STAGE_SUCCESS") return {
      humanPercent: round(r.fraction_human), aiPercent: round(r.fraction_ai), aiAssistedPercent: round(r.fraction_ai_assisted),
      prediction: r.prediction ?? "",
      flagged: (r.windows ?? []).filter((w: any) => w.label !== "Human Written").slice(0, 12)
        .map((w: any) => ({ text: String(w.text).slice(0, 600), label: w.label, confidence: w.confidence })),
    };
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error("detection timed out");
}

async function plagiarismCheck(text: string): Promise<ExternalPlagiarismCheck> {
  const r = await call(PLAGIARISM_URL, { method: "POST", body: JSON.stringify({ text }) });
  const plagiarized = Number(r.percent_plagiarized) || 0;
  return {
    uniquePercent: Math.round((100 - plagiarized) * 10) / 10, plagiarizedPercent: Math.round(plagiarized * 10) / 10,
    totalSentences: r.total_sentences ?? 0, plagiarizedSentences: r.plagiarized_sentences ?? 0,
    matches: (r.plagiarized_content ?? []).slice(0, 20).map((m: any) => ({ sourceUrl: m.source_url, matchedText: String(m.matched_text).slice(0, 600), similarity: m.similarity_score })),
  };
}

/** Runs both independent checks on the paper body. Returns undefined when no key is configured. */
export async function runExternalChecks(body: string): Promise<ExternalChecks | undefined> {
  if (!key()) return undefined;
  const text = body.slice(0, 60_000), errors: string[] = [];
  const [ai, plagiarism] = await Promise.allSettled([aiCheck(text), plagiarismCheck(text)]);
  const value = <T,>(r: PromiseSettledResult<T>, name: string) => {
    if (r.status === "fulfilled") return r.value;
    logger.warn({ err: r.reason }, `Pangram ${name} check failed`);
    errors.push(`${name} check unavailable: ${(r.reason as Error)?.message ?? "error"}`);
    return undefined;
  };
  return { provider: "Pangram Labs", target: EXTERNAL_TARGET, checkedAt: new Date().toISOString(), ai: value(ai, "AI-writing"), plagiarism: value(plagiarism, "Web plagiarism"), errors };
}
