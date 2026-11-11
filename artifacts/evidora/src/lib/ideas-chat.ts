/** Pure helpers for running structured idea generation inside AI Chat. No React, no network. */
import type { ChatContext } from "./chat-document";

type Meta = { id: string; kind: string; title: string; metadata?: unknown };
const rec = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export type IdeasIntent = { own: boolean; topic: string | null; prompt: string; needsTopic: boolean };

const GENERATE = /\b(suggest|generate|provide|recommend|share|give( me)?|propose|brainstorm|list|come up with|need|want|find|draft|create|more|other|new|another)\b[^.?!]{0,40}\b(research |project |thesis |study )?ideas?\b/;
const COUNTED = /\b(five|5|some|few|several|new|more|fresh|research|project|thesis) (research )?(ideas|directions|topics)\b/;
const LEAD = /^\s*(research |project |thesis )?(ideas|topics) (for|on|of|about|in|around|related to|regarding)\b/;
const NOT_GENERATE = /\b(compare|which (of|one)|rank|evaluate|explain|pros and cons|difference|selected|choose|pick|select|refine|develop|expand)\b/;
const OWN = /\b(my|our) (own )?(project|references|papers|notes|documents|uploads|sources|library|material|data|idea|ideas|draft)\b|\bfrom my\b/;
/** Explicit evidence restrictions: never silently search the web/literature. */
const RESTRICT = /\b(do not|don't|dont|without|no|never|avoid)\s+(any\s+)?(search(ing)?|internet|web|online|external|outside|new papers|literature search|google)\b|\buse only\b|\bonly (use|from|using|based on|my|our)\b|\boffline\b/;

/** True when the user restricted evidence to their own material. */
export const ownOnly = (text: string) => OWN.test(text.toLowerCase()) || RESTRICT.test(text.toLowerCase());

/** Accept ordinary wording, including "ideas of X", "ideas X", and "X ideas". */
export function ideaTopic(text: string): string | null {
  const value = text.trim();
  const idea = /\b(?:ideas?|topics?|directions?)\b/i.exec(value);
  let candidate = idea ? value.slice(idea.index + idea[0].length).trim() : "";
  candidate = candidate.replace(/^(?:(?:in the area of|related to|regarding|on|of|about|for|around|in)\s+|[:—–-]\s*)/i, "");
  if (!candidate && idea) {
    // The topic can precede the noun: "generate power system ideas".
    candidate = value.slice(0, idea.index).trim();
    const filler = /^(?:please|can|could|would|you|suggest|generate|provide|recommend|share|give|me|propose|brainstorm|list|create|find|need|want|i|some|a|few|five|5|top|best|new|more|research|project|study|interesting|innovative)\b[\s,]*/i;
    while (filler.test(candidate)) candidate = candidate.replace(filler, "").trim();
  }
  if (!idea) {
    const scope = /\b(?:on|of|about|for|around|regarding|in the area of|related to|in)\s+(.{3,})$/i.exec(value);
    candidate = scope?.[1] ?? "";
  }
  const topic = candidate.replace(/\b(please|thanks?|thank you)\b/gi, "").replace(/[\s.?!]+$/, "").trim();
  if (topic.length < 3 || /^(?:(?:from|using|based on|only)\s+)?(?:my|our) (?:own )?(?:project|references|papers|notes|documents|uploads|sources|material|data|idea|ideas|draft)$/i.test(topic)
      || /^(?:this|that|it|these|them|me|us|now|again|only|some|more)$/i.test(topic)) return null;
  return topic;
}

/**
 * Explicit request for a set of research ideas ("suggest five research ideas on solar", "generate ideas", "ideas for ...").
 * Terse requests without a topic resolve from the earlier conversation.
 */
export function ideasIntent(text: string, history: ChatContext[] = []): IdeasIntent | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  const asks = GENERATE.test(t) || COUNTED.test(t) || LEAD.test(t);
  if (!asks) return null;
  if (NOT_GENERATE.test(t) && !/\b(suggest|generate|provide|recommend|share|brainstorm|propose)\b/.test(t)) return null;
  if (/\b(journal|thesis|dissertation|synopsis|literature review|manuscript)\b/.test(t) && !/\bideas?\b/.test(t)) return null;
  const own = ownOnly(t);
  let topic = ideaTopic(text);
  if (!topic) {
    const last = [...history].reverse().find(h => h.question.trim());
    if (last) topic = last.question.trim().replace(/^selected research idea:\s*/i, "").slice(0, 400);
  }
  const needsTopic = !topic && !own;
  const prompt = topic
    ? `Suggest five structured research ideas on: ${topic}.${own ? " Use my project's own material first." : ""}${text.trim().toLowerCase() !== topic.toLowerCase() ? `\n\nRequest as written: ${text.trim()}` : ""}`
    : text.trim();
  return { own, topic, prompt: prompt.slice(0, 4900), needsTopic };
}

const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, last: 5, one: 1, two: 2, three: 3, four: 4, five: 5 };

/** "select idea 2", "open the third one", "pick the second", "confirm 4": index (0-based) into the latest idea set. */
export function ideaSelection(text: string, count = 5): number | null {
  const t = text.toLowerCase().trim();
  if (!/^(please )?(select|choose|pick|confirm|open|show|take|go with|i('ll| will)? (go with|take|choose|pick))\b/.test(t)) return null;
  const m = /\b(?:idea|number|no\.?|#)?\s*([1-5])\b/.exec(t) ?? /\b(first|second|third|fourth|fifth|last|one|two|three|four|five)\b/.exec(t);
  if (!m) return null;
  const raw = m[1];
  let n = /^\d$/.test(raw) ? Number(raw) : ORDINALS[raw];
  if (raw === "last") n = count;
  if (!n || n > count) return null;
  return n - 1;
}

/** Source idea set of a selected idea: persisted metadata.ideaSetId, else persisted request.parentId when that is an idea set. */
export function ideaSetIdOf(item: Meta, sets?: Set<string>): string | null {
  const m = rec(item.metadata);
  const direct = str(m?.ideaSetId);
  if (direct) return direct;
  const p = str(rec(m?.request)?.parentId);
  return p && (!sets || sets.has(p)) ? p : null;
}

/** Ideas confirmed from THIS set. Legacy same-title selections without any ancestry still count; ones tied to another set never do. */
export function confirmedFor<T extends Meta>(set: Meta, items: T[]): T[] {
  return items.filter(i => {
    if (i.kind !== "idea") return false;
    const m = rec(i.metadata);
    const linked = str(m?.ideaSetId) ?? str(rec(m?.request)?.parentId);
    // Same-title legacy selections without ancestry stay in history but are not "selected" here.
    return linked === set.id;
  });
}

/** Earlier AI Chat turns the backend copied onto a bridged answer (metadata.analysisHistory + analysisQuestion). */
export function analysisTurnsOf(item?: Meta | null): ChatContext[] {
  const m = rec(item?.metadata);
  if (!m) return [];
  const out: ChatContext[] = [];
  const hist = Array.isArray(m.analysisHistory) ? m.analysisHistory : [];
  for (const h of hist) {
    const r = rec(h);
    const q = str(r?.question) ?? str(r?.prompt);
    const a = str(r?.answer) ?? str(r?.content);
    if (q || a) out.push({ question: q ?? "", answer: a ?? "" });
  }
  const q = str(m.analysisQuestion);
  if (q && !out.some(x => x.question === q)) out.push({ question: q, answer: "" });
  return out;
}

type CtxItem = Meta & { content?: string | null };
/** Real prior question/answer context for a project conversation, in chronological order (selection commands skipped). */
export function conversationContext<T extends CtxItem>(turns: { prompt: string | null; latest: T }[], skip: (p: string) => boolean = () => false): ChatContext[] {
  const out: ChatContext[] = [];
  for (const t of turns) {
    const it = t.latest;
    if (t.prompt && skip(t.prompt)) continue;
    const ideas = Array.isArray(rec(it.metadata)?.ideas) ? (rec(it.metadata)!.ideas as unknown[]).map((x, i) => `${i + 1}. ${str(rec(x)?.title) ?? ""}`).join("\n") : "";
    if (it.kind === "ideas") out.push({ question: t.prompt ?? it.title, answer: ideas ? `Five research ideas:\n${ideas}` : it.title });
    else if (it.kind === "idea") out.push({ question: `Selected research idea: ${it.title}`, answer: (it.content ?? "").slice(0, 6000) });
    else out.push({ question: t.prompt ?? it.title, answer: (it.content ?? "").slice(0, 6000) });
  }
  return out;
}

/** Old /ideas?... URLs -> unified AI Chat. Keeps item, q and an answer-mode hint. Never returns an /ideas URL. */
export function legacyIdeasUrl(search: string): string {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out = new URLSearchParams();
  const item = p.get("item");
  const q = p.get("q");
  if (item) out.set("item", item);
  if (q) out.set("q", q);
  if (!item && p.get("mode") === "answer") out.set("mode", "answer");
  const qs = out.toString();
  return `/ask${qs ? `?${qs}` : ""}`;
}

/** Kinds whose conversations belong in AI Chat history (documents keep their own workspaces). */
export const CHAT_KINDS = new Set(["ideas", "idea", "answer"]);
