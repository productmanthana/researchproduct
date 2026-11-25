import { z } from "zod";
import { jsonCall, longJsonCall } from "./ai-json";
import { SCIENTIFIC_MODEL } from "./ai-budget";
import { logger } from "./logger";
import { THESIS_PARTS, THESIS_PLAN_TASK, thesisContents, thesisPartTask } from "./thesis-policy";

/** Runs fn over items with at most `limit` in flight, keeping input order in the result. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

const Plan = z.object({ title: z.string().min(1).max(300), blueprint: z.string().min(200) });
const Part = z.object({ content: z.string().min(200) });

/**
 * Plans the thesis once, then writes each part against that blueprint (three at a time).
 * A part that overruns one response is retried once at a shorter target before the job fails.
 */
export async function writeThesis({ prompt, body, onPart }: {
  prompt: string; body: any[];
  onPart?: (done: number, total: number, heading: string, draft: string) => void | Promise<void>;
}) {
  const plan = Plan.parse((await jsonCall(`${prompt}\n${THESIS_PLAN_TASK}`, body, SCIENTIFIC_MODEL, false, 8192)).value);
  const written: (string | undefined)[] = THESIS_PARTS.map(() => undefined);
  let done = 0;
  await mapLimit(THESIS_PARTS, 3, async (part, i) => {
    const input = [...body, { type: "text", text: JSON.stringify({ thesisTitle: plan.title, blueprint: plan.blueprint }) }];
    let content: string;
    try { content = Part.parse((await longJsonCall(`${prompt}\n${thesisPartTask(part)}`, input, SCIENTIFIC_MODEL)).value).content; }
    catch (err) {
      logger.warn({ err, part: part.id }, "Thesis part overran; retrying shorter");
      content = Part.parse((await longJsonCall(`${prompt}\n${thesisPartTask({ ...part, words: Math.round(part.words * 0.6) })}`, input, SCIENTIFIC_MODEL)).value).content;
    }
    written[i] = content.trim();
    done++;
    await onPart?.(done, THESIS_PARTS.length, part.heading, written.filter(Boolean).join("\n\n"));
  });
  let content = written.join("\n\n");
  const contents = thesisContents(content);
  content = content.includes("[[contents]]") ? content.replace(/^.*\[\[contents\]\].*$/m, contents)
    : content.replace(/^# Chapter 1\b/m, m => `${contents}\n\n${m}`);
  return { title: plan.title, content };
}
