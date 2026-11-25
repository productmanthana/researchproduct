import { z } from "zod";
import { jsonCall } from "./ai-json";
import { SCIENTIFIC_MODEL } from "./ai-budget";
import { HttpError } from "./common";
import { logger } from "./logger";
import { THESIS_PLAN_TASK, insertThesisContents, thesisPartTask, thesisParts } from "./thesis-policy";

/** Bounded concurrency, ordered output, and no new work scheduled after a failure. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Invalid concurrency limit");
  const out: R[] = new Array(items.length);
  let next = 0, failed = false;
  const workers = await Promise.allSettled(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (!failed && next < items.length) {
      const i = next++;
      try { out[i] = await fn(items[i], i); }
      catch (error) { failed = true; throw error; }
    }
  }));
  const rejected = workers.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (rejected) throw rejected.reason;
  return out;
}

const Chapter = z.object({ number: z.number().int(), title: z.string().min(1).max(200),
  sections: z.array(z.string().min(1).max(300)).min(6).max(14) });
const Plan = z.object({ title: z.string().min(1).max(300), blueprint: z.string().min(200).max(30000),
  chapters: z.array(Chapter).length(8) }).refine(p => p.chapters.every((ch, i) =>
    ch.number === i + 1 && ch.sections.every(section => section.startsWith(`${ch.number}.`))
    && new Set(ch.sections).size === ch.sections.length), "Invalid or duplicate thesis section numbering");
const Part = z.object({ content: z.string().min(200).max(100000) });
type ThesisCall = (system: string, body: any[], model: string) => Promise<{ value: unknown }>;

/** Injectable caller makes the complete planning/assembly/retry path testable without paid AI. */
export async function writeThesis({ prompt, body, targetWords, onPart, deferContents = false, call = jsonCall }: {
  prompt: string; body: any[]; targetWords?: number; deferContents?: boolean; call?: ThesisCall;
  onPart?: (done: number, total: number, heading: string, draft: string) => void | Promise<void>;
}) {
  const attempt = async <T>(run: (retry: boolean) => Promise<T>) => {
    try { return await run(false); }
    catch (error) {
      // Do not repeat rejected/budget-exhausted calls and never erase possible spend.
      if (error instanceof HttpError) throw error;
      logger.warn({ errorType: error instanceof Error ? error.name : "unknown" }, "Retrying incomplete thesis output once");
      return run(true);
    }
  };
  const plan = await attempt(async retry => Plan.parse((await call(
    `${prompt}\n${THESIS_PLAN_TASK}${retry ? "\nKeep the blueprint especially compact, with short bullets." : ""}`, body, SCIENTIFIC_MODEL)).value));
  const parts = thesisParts(plan.chapters, targetWords);
  const written: (string | undefined)[] = parts.map(() => undefined);
  let done = 0, notified = 0, lastDraft = "";
  let notifications = Promise.resolve();
  await mapLimit(parts, 4, async (part, i) => {
    const input = [...body, { type: "text", text: JSON.stringify({
      thesisTitle: plan.title, blueprint: plan.blueprint, chapterOutline: plan.chapters,
    }) }];
    const content = await attempt(async retry => Part.parse((await call(
      `${prompt}\n${thesisPartTask(retry ? { ...part, words: Math.round(part.words * 0.6) } : part)}`,
      input, SCIENTIFIC_MODEL)).value).content);
    written[i] = content.trim();
    done++;
    // Publish only the contiguous prefix, never an appendix that finished ahead of Chapter 1.
    const prefix = written.slice(0, written.findIndex(s => s === undefined) < 0
      ? written.length : written.findIndex(s => s === undefined)).join("\n\n");
    const completed = done;
    notifications = notifications.then(async () => {
      if (completed <= notified) return;
      notified = completed;
      lastDraft = prefix || lastDraft;
      await onPart?.(completed, parts.length, part.heading, lastDraft);
    });
    await notifications;
  });
  let content = written.join("\n\n");
  if (!deferContents) content = insertThesisContents(content);
  return { title: plan.title, content };
}
