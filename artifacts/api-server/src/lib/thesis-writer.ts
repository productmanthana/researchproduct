import { z } from "zod";
import { jsonCall, longJsonCall } from "./ai-json";
import { SCIENTIFIC_MODEL } from "./ai-budget";
import { logger } from "./logger";
import { THESIS_PLAN_TASK, thesisContents, thesisPartTask, thesisParts } from "./thesis-policy";

/** Runs fn over items with at most `limit` in flight, keeping input order in the result. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

const Chapter = z.object({ number: z.coerce.number().int(), title: z.string().min(1).max(200), sections: z.array(z.string().min(1)).min(3).max(16) });
const Plan = z.object({ title: z.string().min(1).max(300), blueprint: z.string().min(200), chapters: z.array(Chapter).length(8) });
const Part = z.object({ content: z.string().min(200) });

/**
 * Plans the thesis once (blueprint and section outline of eight chapters), then writes it in about twenty
 * parts of at most 4,000 words (four at a time), so each chapter reaches its full length.
 * A part that overruns one response is retried once at a shorter target before the job fails.
 */
export async function writeThesis({ prompt, body, onPart }: {
  prompt: string; body: any[];
  onPart?: (done: number, total: number, heading: string, draft: string) => void | Promise<void>;
}) {
  const planOnce = async (extra = "") => Plan.parse((await jsonCall(`${prompt}\n${THESIS_PLAN_TASK}${extra}`, body, SCIENTIFIC_MODEL, false, 16384)).value);
  // A blueprint that overruns one response is retried once in compact form before the job fails.
  const plan = await planOnce().catch(err => {
    logger.warn({ err }, "Thesis blueprint overran; retrying compact");
    return planOnce(" Keep the blueprint under 2,500 words: short bullet points, evidence numbers as ranges.");
  });
  const parts = thesisParts(plan.chapters.map((c, i) => ({ ...c, number: i + 1 })));
  const written: (string | undefined)[] = parts.map(() => undefined);
  let done = 0;
  await mapLimit(parts, 4, async (part, i) => {
    const input = [...body, { type: "text", text: JSON.stringify({ thesisTitle: plan.title, blueprint: plan.blueprint, chapterOutline: plan.chapters }) }];
    let content: string;
    try { content = Part.parse((await longJsonCall(`${prompt}\n${thesisPartTask(part)}`, input, SCIENTIFIC_MODEL)).value).content; }
    catch (err) {
      logger.warn({ err, part: part.id }, "Thesis part overran; retrying shorter");
      content = Part.parse((await longJsonCall(`${prompt}\n${thesisPartTask({ ...part, words: Math.round(part.words * 0.6) })}`, input, SCIENTIFIC_MODEL)).value).content;
    }
    written[i] = content.trim();
    done++;
    await onPart?.(done, parts.length, part.heading, written.filter(Boolean).join("\n\n"));
  });
  let content = written.join("\n\n");
  const contents = thesisContents(content);
  content = content.includes("[[contents]]") ? content.replace(/^.*\[\[contents\]\].*$/m, contents)
    : content.replace(/^# Chapter 1\b/m, m => `${contents}\n\n${m}`);
  return { title: plan.title, content };
}
