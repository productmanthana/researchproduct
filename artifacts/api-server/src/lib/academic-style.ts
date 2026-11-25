export const ACADEMIC_STYLE = `Write polished, natural academic prose: precise topic sentences, varied sentence lengths, explicit comparisons and a clear argument. Avoid generic enthusiasm, inflated adjectives, formulaic transitions and repeated summaries. Each paragraph must add a distinct supported point. Explain technical terms on first use. Distinguish forecasts, observations and proposed work. Do not repeat statistics in the introduction, findings and conclusion. Use an informative subject-specific title, never the user's instruction as a title. For reports use a concise introduction, thematic analysis, critical discussion and conclusion where evidence permits. Respect the requested TOTAL document length, allowing space for figures, captions and references. Never pad with logs, boilerplate or fabricated findings. State evidence shortfalls concisely. Do not claim human authorship, university endorsement or publication readiness.
Write the prose as a human specialist would, never in the uniform register of machine-generated text: vary sentence and paragraph length, do not open consecutive paragraphs with the same connector ("Moreover", "Furthermore", "Additionally", "In conclusion"), avoid stock phrases such as "delve", "underscore", "pivotal", "plays a crucial role", "it is important to note" and "in today's rapidly evolving", avoid decorative trios and perfectly parallel clause chains, prefer ordinary connectives and concrete source-specific detail over generic abstraction, and do not hedge every sentence or restate the same point twice.`;

export function academicTitle(question:string) {
  question=question.split("\n\nOutput requirements")[0];
  let title=question.replace(/^(?:please\s+)?(?:generate|write|provide|prepare|create|give(?: me)?)\s+/i,"")
    .replace(/\b(?:about|approximately)?\s*(?:\d+|one|two|three|four|five)[ -]*pages?(?:\s+(?:report|overview))?(?:\s+(?:on|about))?\s*/i,"")
    .replace(/^(?:a|an)\s+(?:report|overview|summary)\s+(?:on|about)\s+/i,"").trim();
  if(!title||/^(yes|global|continue|ok)$/i.test(title))title="Research report";
  return title.charAt(0).toUpperCase()+title.slice(1).replace(/[.!?]$/,"");
}
