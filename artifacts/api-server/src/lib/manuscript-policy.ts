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

/** Register and formatting rules for every scholarly draft (journal, thesis, literature survey, synopsis). */
export const PROFESSIONAL_ACADEMIC_STYLE = `Write in the register of a senior professor's lecture notes or a top-tier journal review (IIT, Stanford, Harvard standard): confident, precise, argument-driven prose that teaches the field, compares methods quantitatively where the evidence gives numbers, and states a clear thesis in each section.
State evidence limits once, concisely, in the Methods/Limitations sections. Do NOT repeat boilerplate hedges ("the supplied corpus does not establish...", "abstract-only", "not an exhaustive account") in every paragraph; each paragraph must advance a new point and must not restate earlier ones.
Prioritise the newest and most influential evidence in the supplied sources (latest years first), synthesise across all supplied papers and patents, and cite patents as technology-landscape evidence in their own subsection when patent records are supplied. Group sources by theme rather than summarising them one by one.
Formatting: plain Markdown only. Use # / ## / ### headings, paragraphs and pipe tables (| a | b |) for comparisons, with short cell text. NEVER output code fences (\`\`\`), ASCII-art boxes, arrows made of "+---+" or "v" characters, or text-drawn diagrams; diagrams are generated separately as figures. Do not repeat the manuscript title as a second heading.`;

/** The manuscript is the authors' paper: no tool branding or notes about how the draft was produced. */
export const SUBMISSION_VOICE = `Write the manuscript as its authors would submit it. Never mention Evidora, this tool, "the assistant", "supplied evidence", "supplied abstract/excerpt/material", "project files", "retrieved sources", "the corpus provided" or how the draft was prepared. Refer to literature the normal way ("Inuwa et al. [2] report…", "A recent review [5] finds…"). Do not add "Manuscript status", "working draft", "Author details" or similar notes; the app shows those separately. In Declarations, leave author-completed items as bracketed placeholders, including "AI-use statement: [Authors to complete as required by the target journal]".
The priorArt field lists what existing studies, commercial tools and deployed systems already do. Never present any of it as new. In the Introduction or Related Work, name the closest existing work with its citation and state precisely what this paper adds beyond it, building the contribution around priorArt.contribution and priorArt.openGaps. Novelty is relative to the cited work, never a claim of global firsts.`;

/** Strip tool branding and app-only notes the model may still add, so the export reads as a normal paper. */
export function submissionReady(content: string) {
  return content
    .replace(/[ \t]*(?:\*\*)?\b(?:Manuscript status|Author details)(?:\*\*)?:[^\n]*?(?:\.(?=\s|$)|$)/gim, "")
    .replace(/^\s*(?:\*\*)?Preparation disclosure(?:\*\*)?:.*$/gim, "AI-use statement: [Authors to complete as required by the target journal]")
    .replace(/^.*\bEvidora\b.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
