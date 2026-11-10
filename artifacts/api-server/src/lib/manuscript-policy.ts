const figure = /\b(?:figures?|diagrams?|graphs?|charts?|plots?|flowcharts?|schematics?|curves?)\b/i;

/** A full manuscript with figures is not a figure-only revision of its chat context. */
export function figureRevisionRequest(prompt: string, kind: string, parentKind?: string) {
  if (!figure.test(prompt) || kind !== parentKind) return false;
  if (/\b(?:write|generate|create|prepare|draft|provide|make)\b[\s\S]{0,100}\b(?:journal paper|research paper|manuscript|thesis|dissertation|literature review|literature survey|synopsis)\b/i.test(prompt)) return false;
  return /\b(?:add|insert|revise|replace|update|improve|draw|put|include|generate|create)\b/i.test(prompt);
}

export const JOURNAL_DRAFT_INSTRUCTIONS = `Produce the actual developed journal manuscript, not an outline, writing advice or instructions such as "consider", "contextualize", "discuss" or "summarize" addressed to the author.
Use the requested journal profile when supplied; otherwise use a conventional academic article structure without claiming a particular journal's approval. Include a specific title, abstract, keywords, introduction, related work, methodology or review approach, substantive findings/synthesis, discussion, limitations, conclusion and applicable declarations. Write analytical paragraphs, not a list of section descriptions. Aim for a substantive draft (approximately 1800–2500 words unless the user specifies another length), but never pad unsupported claims to meet a target.
Choose and explicitly label the article type from the supplied inputs. Without actual original experimental methods and results, develop a literature-based narrative review or a proposed-study manuscript. Do not claim a systematic review without a documented protocol. A review's findings are synthesis of cited studies, not new experiments. For a proposed empirical study, label the methodology as proposed and results as "Research input required", with specific missing inputs. Do not fabricate measurements, participants, validation, statistical significance, authors, affiliations or ethics approvals.
The next figure step will create appropriate source-grounded conceptual illustrations with captions; never substitute "use diagrams" advice for the actual manuscript. Numerical charts require real supplied or cited data. Leave unknown author and submission details for author completion, not invention.`;
