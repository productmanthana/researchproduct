import type { StudioItem } from "@workspace/api-client-react";

/**
 * Project conversations on every workspace, rebuilt only from saved server records.
 *
 * Two different links exist and must never be confused:
 *  - StudioItem.parentId (and metadata.figureRevisionOf) = document revision lineage. Revisions collapse into ONE turn.
 *  - metadata.request.parentId = the item a question was asked about (chat ancestry). This makes turns.
 */

export type ConvItem = Pick<StudioItem, "id" | "projectId" | "kind" | "title" | "status" | "createdAt" | "revision" | "parentId" | "metadata">;

export type Turn<T extends ConvItem = ConvItem> = {
  /** Revision root id: stable identity of this turn. */
  id: string;
  /** Original question as typed (metadata.request.prompt of the first revision); null for a seed without one. */
  prompt: string | null;
  /** All revisions, oldest first. */
  revisions: T[];
  /** Latest saved revision: what the turn displays by default. */
  latest: T;
  /** True for an idea / idea set that opened the conversation. */
  seed: boolean;
  createdAt: string;
};

export type Conversation<T extends ConvItem = ConvItem> = { rootId: string; projectId: string; title: string; turns: Turn<T>[]; updatedAt: string };

const SEED_KINDS = new Set(["idea", "ideas"]);
const rec = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const request = (i: ConvItem) => rec(rec(i.metadata)?.request);
export const requestPrompt = (i: ConvItem) => str(request(i)?.prompt);
export const requestParent = (i: ConvItem) => str(request(i)?.parentId);
/** Revision parent: actual parentId, or the figure revision link stored by the generator. */
const revisionParent = (i: ConvItem) => i.parentId ?? str(rec(i.metadata)?.figureRevisionOf);
const byTime = (a: ConvItem, b: ConvItem) => a.createdAt.localeCompare(b.createdAt) || a.revision - b.revision;

/** Build every conversation within one project. Items from other projects are ignored. */
export function buildConversations<T extends ConvItem>(items: T[], projectId: string): Conversation<T>[] {
  const inProject = items.filter(i => i.projectId === projectId);
  const byId = new Map(inProject.map(i => [i.id, i]));

  // 1. Revision roots (cycle-guarded; a missing parent makes the item its own root).
  const revRoot = new Map<string, string>();
  const rootOf = (id: string): string => {
    const known = revRoot.get(id); if (known) return known;
    const seen = new Set<string>(); let cur = byId.get(id)!;
    while (true) {
      seen.add(cur.id);
      const p = revisionParent(cur); const next = p ? byId.get(p) : undefined;
      if (!next || seen.has(next.id)) break;
      cur = next;
    }
    for (const s of seen) if (!revRoot.has(s)) revRoot.set(s, cur.id);
    return revRoot.get(id) ?? cur.id;
  };
  const groups = new Map<string, T[]>();
  for (const i of inProject) { const r = rootOf(i.id); groups.set(r, [...(groups.get(r) ?? []), i]); }

  // 2. Chat parent per turn (via the first revision's request), mapped to that parent's turn.
  const chatParent = new Map<string, string>();
  for (const [r] of groups) {
    const first = byId.get(r)!;
    const p = requestParent(first);
    if (p && byId.has(p)) { const pr = rootOf(p); if (pr !== r) chatParent.set(r, pr); }
  }
  // 3. Conversation root per turn (cycle-guarded).
  const convRoot = (r: string) => {
    const seen = new Set<string>([r]); let cur = r;
    while (chatParent.has(cur) && !seen.has(chatParent.get(cur)!)) { cur = chatParent.get(cur)!; seen.add(cur); }
    return cur;
  };
  const convs = new Map<string, Turn<T>[]>();
  for (const [r, revs] of groups) {
    revs.sort(byTime);
    const first = byId.get(r)!;
    const latest = revs[revs.length - 1];
    const cr = convRoot(r);
    const turn: Turn<T> = { id: r, prompt: requestPrompt(first), revisions: revs, latest, seed: r === cr && SEED_KINDS.has(first.kind), createdAt: first.createdAt };
    convs.set(cr, [...(convs.get(cr) ?? []), turn]);
  }
  return [...convs.entries()].map(([rootId, turns]) => {
    turns.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    // Root first even if clocks disagree.
    const ri = turns.findIndex(t => t.id === rootId); if (ri > 0) turns.unshift(...turns.splice(ri, 1));
    const updatedAt = turns.flatMap(t => t.revisions).map(i => i.createdAt).sort().pop() ?? "";
    return { rootId, projectId, title: turns[0].latest.title, turns, updatedAt };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** The conversation containing an item (any revision of any turn). */
export function conversationFor<T extends ConvItem>(convs: Conversation<T>[], itemId: string): Conversation<T> | undefined {
  return convs.find(c => c.turns.some(t => t.revisions.some(r => r.id === itemId)));
}

/** History "Answers": one entry per conversation that contains at least one answer turn. */
export function answerConversations<T extends ConvItem>(convs: Conversation<T>[]): Conversation<T>[] {
  return convs.filter(c => c.turns.some(t => t.revisions[0].kind === "answer"));
}

/** Count of question turns (seed excluded). */
export const questionCount = (c: Conversation) => c.turns.filter(t => !t.seed).length;

/** The id to send as parentId for a follow-up: latest revision of the last COMPLETED turn. */
export function followUpParent(c: Conversation): string | null {
  for (let i = c.turns.length - 1; i >= 0; i--) {
    const done = [...c.turns[i].revisions].reverse().find(r => r.status === "completed");
    if (done) return done.id;
  }
  return null;
}

/** Whether the conversation has a turn still being written. */
export const conversationBusy = (c: Conversation) => c.turns.some(t => t.latest.status === "queued" || t.latest.status === "running");
