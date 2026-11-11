/** Pure helpers for rendering a partial, still-arriving Markdown draft without exposing raw syntax. */

const isTableLine = (l: string) => /^\s*\|/.test(l) || (l.match(/\|/g)?.length ?? 0) >= 2;
const isDivider = (l: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(l.trim());

/**
 * Makes an in-progress snapshot safe for the block renderer:
 * - drops a half-written final line of a table (no closing pipe yet) and a table header whose divider has not arrived,
 * - completes a partial divider so the header renders as a table immediately,
 * - removes a dangling heading/list marker or an unclosed `**` so no raw syntax flashes,
 * - separates headings glued to following lines into their own block.
 * Never invents words, numbers, or citations: it only removes or normalises syntax.
 */
export function stabilizeLiveMarkdown(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").replace(/^#{4,6}(?=\s)/gm, "###");
  // Headings must be standalone blocks for the renderer.
  text = text.replace(/^(#{1,6}\s+[^\n]+)\n(?!\n)/gm, "$1\n\n").replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");
  const blocks = text.split(/\n\s*\n/);
  let last = blocks[blocks.length - 1] ?? "";
  let lines = last.split("\n");
  // Partial table handling on the final (still-growing) block.
  if (lines.length && isTableLine(lines[0])) {
    const tail = lines[lines.length - 1];
    const partialDivider = lines.length === 2 && /^[\s|:-]+$/.test(tail) && tail.includes("-");
    if (lines.length > 1 && !/\|\s*$/.test(tail.trim()) && !partialDivider) lines = lines.slice(0, -1);
    if (lines.length === 1 && !/\|\s*$/.test(lines[0].trim())) lines = [];
    if (lines.length === 1) lines = []; // header without divider yet
    else if (lines.length >= 2 && !isDivider(lines[1])) {
      if (/^[\s|:-]*$/.test(lines[1])) {
        const cols = lines[0].trim().replace(/^\||\|$/g, "").split("|").length;
        lines[1] = "|" + Array(cols).fill("---").join("|") + "|";
      }
    }
  }
  // Dangling markers at the very end.
  if (lines.length) {
    const tail = lines[lines.length - 1];
    if (/^\s*(#{1,6}|[-*]|\d+[.)]|>)\s*$/.test(tail)) lines = lines.slice(0, -1);
  }
  last = lines.join("\n");
  // Unclosed bold in the growing block: hide the opening marker until it closes.
  const marks = last.match(/\*\*/g)?.length ?? 0;
  if (marks % 2 === 1) { const at = last.lastIndexOf("**"); last = last.slice(0, at) + last.slice(at + 2); }
  last = last.replace(/\*$/, "");
  blocks[blocks.length - 1] = last;
  return blocks.filter(b => b.trim()).join("\n\n").trim();
}

export type LiveStage = "waiting" | "researching" | "writing" | "checking" | "reconnecting" | "finishing";

/** Maps the server-reported stage/connection to a single honest phase. */
export function liveStage(stage: string, connection: string, hasText: boolean): LiveStage {
  if (connection === "done") return "finishing";
  if (connection === "reconnecting" || connection === "unavailable") return "reconnecting";
  const s = stage.toLowerCase();
  if (/reading|reviewing (?:papers|abstracts|sources|project|documents)/.test(s)) return "researching";
  if (/check|verif|validat|review|audit/.test(s)) return "checking";
  if (/writ|draft|compos|synth/.test(s) || hasText) return "writing";
  if (/discover|search|read|retriev|plan|running/.test(s)) return "researching";
  return "waiting";
}

const RESEARCH_LABELS: Record<string, string> = {
  discovering: "Finding relevant papers", searching: "Searching scholarly sources", reading: "Reading the evidence",
  planning: "Thinking", queued: "Waiting to start",
};

export function liveStatusLabel(phase: LiveStage, stage: string, connection: string): string {
  switch (phase) {
    case "finishing": return "Loading the checked version";
    case "reconnecting": return connection === "unavailable" ? "Live view paused; progress still refreshes" : "Reconnecting; your draft is kept";
    case "checking": return "Checking claims against sources";
    case "writing": return "Writing";
    case "researching": return RESEARCH_LABELS[stage] ?? "Reviewing your sources";
    default: return RESEARCH_LABELS[stage] ?? "Starting";
  }
}
