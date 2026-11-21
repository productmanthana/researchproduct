/**
 * Sentences about how a draft was prepared ("abstract-based accounts cover only…", "the project synopsis",
 * "the citation numbers used here do not come from…") tell a reviewer the paper was assembled from
 * snippets. Journals never print them, so they are removed from the body before export.
 */
const PROCESS_NOTE = new RegExp([
  String.raw`\b(?:abstract-based accounts?|publication (?:extracts?|excerpts?)|(?:internet[- ])?search (?:excerpts?|snippets?)|article(?:-page)? excerpts?|bibliography-only pages?|commercial search excerpts?)\b`,
  String.raw`\bindependently (?:read|verified|checked|authenticated)\b`,
  String.raw`\bnot independently (?:established|examined|inspected)\b`,
  String.raw`\b(?:project (?:synopsis|documents?|files?|drafts?|material)|earlier project|prior project)\b`,
  String.raw`\bcitation (?:numbers?|numbering)\b[^.]*\b(?:used here|derive|come from|transferred)\b`,
  String.raw`\b(?:describes|reports|documents) no (?:systematic )?(?:database )?search\b`,
  String.raw`\bnor does it document a screening\b`,
  String.raw`\bno (?:additional|further) searches\b`,
  String.raw`\bsupplied (?:collection|material|evidence|records?|literature|excerpts?|abstracts?|text)\b`,
  String.raw`\b(?:numbered|evidence) (?:material|entries)\b`,
  String.raw`\brestricted (?:text )?access\b`,
  String.raw`\bevidence base is selective\b`,
  String.raw`\bmultiple (?:pages|excerpts)\b[^.]*\bone (?:work|publication)\b`,
  String.raw`\bdatabase-query reproducibility\b`,
].join("|"), "i");

const SENTENCE = /(?<=[.!?])\s+(?=[A-Z(“"*])/;

/** Prose paragraphs only: headings, tables, figure markers, lists and reference entries are left untouched. */
export function stripProcessNotes(content: string) {
  return content.split(/\n{2,}/).map(block => {
    if (/^\s*(?:#|\||\[\[figure:|\[\d+\]|[-*]\s|\d+\.\s)/.test(block)) return block;
    const kept = block.split(SENTENCE).filter(sentence => !PROCESS_NOTE.test(sentence));
    return kept.join(" ").trim();
  }).filter(Boolean).join("\n\n");
}
