/**
 * Adapted from the thesis engine in the preview-feature pull request.
 * Length targets are planning aids, never guarantees of page count or academic approval.
 */
export const THESIS_MIN_CITED = 100;
export const THESIS_PAPERS = 120;
export const THESIS_SOURCES = 150;
export const THESIS_PART_WORDS = 4000;
export const THESIS_CHAPTER_WORDS = [7500, 17000, 9000, 8000, 9000, 7000, 5000, 3500];

export const THESIS_INSTRUCTIONS = `Develop a doctoral-level thesis WORKING DRAFT, not merely an outline. Respect the requested degree, discipline, university instructions and length; do not claim Harvard, Stanford, IIT, UGC or any institution has approved it.
- Never fabricate data, completed experiments, findings, citations, authors, datasets, signatures, ethics approvals or certificates. The candidate's own results must be explicitly supplied as such, not inferred from published papers or earlier AI drafts. Otherwise use [RESULT PENDING: data, experiment and metric needed] in results paragraphs and table cells. Clearly state the manuscript is incomplete where actual results are absent.
- Cite only the supplied numbered evidence. A source excerpt or abstract is not proof that its full paper was read. Describe search counts only if they were actually recorded; never manufacture a PRISMA diagram or systematic-review coverage.
- Use precise scholarly prose. Distinguish established findings, the candidate's supplied data, proposed methods and unresolved questions. Preserve necessary qualifications near the claims they qualify.
- Use a consistent blueprint across chapters: research questions, hypotheses where appropriate, objectives, symbols, case study and terminology. A proposed dataset or tool must be labelled proposed unless the candidate confirms using it.
- Chapters use "# Chapter N: Title"; sections use "## N.M Title"; subsections use "### N.M.K Title". Open each chapter with an overview; close Chapters 1–7 with a Chapter Summary, not Chapter 8. Every table needs a caption and a preceding textual reference.
- Applicable regulations are jurisdiction- and date-specific: discuss only those relevant to the actual topic and supported by evidence. Do not impose Indian power-grid methods on other fields.
- Front matter and declarations requiring author or university action must remain labelled placeholders. Never imply a similarity certificate or supervisor approval has been obtained.
- Preserve existing scientific figure markers, but do not invent markers or claim diagrams have already been rendered. A separate evidence-grounded step creates actual figures.`;

export const THESIS_CHAPTER_GUIDE: Record<number, string> = {
  1: "Introduction: disciplinary background, supported jurisdictional context where relevant, problem, closest-work gap comparison, research questions, testable hypotheses when appropriate, measurable objectives, scope, contributions and thesis organisation.",
  2: "Literature review: actual search record and evidence limits, thematic synthesis of foundational and recent studies, competing methods, metrics, data and benchmarks, comparison table, disagreements, and candidate gaps mapped to objectives. Do not fill a citation quota with unrelated work.",
  3: "System or conceptual modelling and problem formulation: define every symbol and assumption; explain the complete proposed method, baselines, constraints and evaluation framework. Mathematical optimisation or physical models only when appropriate to the discipline.",
  4: "Data and core methodology: confirmed or explicitly proposed datasets, provenance, preprocessing, experimental factors, controls, leakage prevention, reproducibility, methods and metrics. Results only from candidate-supplied data; otherwise explicit pending-result cells.",
  5: "Main evaluation: experimental design, parameter tables with units and sourced costs, contrasts and statistical tests appropriate to the study, uncertainty and sensitivity. Every hypothesis is supported, rejected or pending based only on actual supplied results.",
  6: "Validation and robustness: appropriate external, physical, computational or empirical validation, corrected versus original outcomes if available, feasibility, failure cases and state propagation where relevant. Mark unperformed validation pending.",
  7: "Discussion: answer each research question with supported evidence or an explicit pending status; compare with cited literature, explain agreement and disagreement, implications and threats to validity.",
  8: "Conclusions and future work: supported findings, contributions tied to evidence, remaining limitations and concrete next research steps. No Chapter Summary and no claims of completed research without actual results.",
};

export type ThesisChapter = { number: number; title: string; sections: string[] };
export type ThesisPart = { id: string; heading: string; words: number; brief: string };
export const THESIS_FRONT: ThesisPart = {
  id: "front", heading: "Preliminary pages", words: 3500,
  brief: 'Use separate top-level headings for a title page, declaration and supervisor-certificate PLACEHOLDERS for author completion, acknowledgements placeholders, abstract, List of Abbreviations and Nomenclature. Use only supplied author details; missing details stay bracketed. Include a line containing only [[contents]]. Publications must be supplied by the candidate or labelled planned; never claim acceptance. Do not duplicate the title page if the selected export layout supplies one.',
};
export const THESIS_APPENDIX: ThesisPart = {
  id: "appendix", heading: "Appendices", words: 4000,
  brief: 'Write appropriately labelled Appendices A–G: nomenclature and parameters, detailed formulations, data dictionary, additional results (pending where absent), software/repository/version placeholders, reproducibility checklist, and supplied or planned publications. Include a CV placeholder only if required by the institution. Never fabricate a repository, publication, certificate or personal biography. No References section.',
};

/** Explicit short assignments must not unexpectedly start a full doctoral-length run. */
export function thesisTargetWords(prompt: string, customMax?: number) {
  if (customMax !== undefined && Number.isFinite(customMax)) return Math.max(100, Math.min(100000, Math.floor(customMax)));
  const words = prompt.match(/\b(\d{3,6})[\s-]*words?\b/i);
  if (words) return Math.max(100, Math.min(100000, Number(words[1])));
  const digits = prompt.match(/\b(\d{1,3})[\s-]*pages?\b/i);
  const named = prompt.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)[\s-]*pages?\b/i);
  const count = digits ? Number(digits[1]) : named
    ? ["one","two","three","four","five","six","seven","eight","nine","ten"].indexOf(named[1].toLowerCase()) + 1 : 0;
  return count ? Math.min(100000, Math.max(100, count * 400)) : 73500;
}

export function thesisParts(chapters: ThesisChapter[], targetWords = 73500): ThesisPart[] {
  const scale = targetWords / 73500;
  const body = chapters.flatMap((ch, i) => {
    const words = Math.max(1, Math.round((THESIS_CHAPTER_WORDS[i] ?? 6000) * scale));
    const groups = Math.max(1, Math.min(ch.sections.length, Math.ceil(words / THESIS_PART_WORDS)));
    // Balanced slices avoid a tiny last group or an empty group.
    return Array.from({ length: groups }, (_, k): ThesisPart => {
      const sections = ch.sections.slice(Math.floor(k * ch.sections.length / groups), Math.floor((k + 1) * ch.sections.length / groups));
      return {
        id: `ch${ch.number}-${k + 1}`, heading: `Chapter ${ch.number}: ${ch.title} (part ${k + 1} of ${groups})`,
        words: Math.round(words / groups),
        brief: `${k === 0 ? `Start with "# Chapter ${ch.number}: ${ch.title}" and an overview.` : "Do NOT repeat the chapter heading or overview."}
Write exactly these sections, in order: ${sections.join("; ")}. Do not write sections assigned to other parts.
${k === groups - 1 && ch.number !== 8 ? `Close with "## ${ch.number}.${ch.sections.length + 1} Chapter Summary".` : "No Chapter Summary in this part."}
Chapter scope: ${THESIS_CHAPTER_GUIDE[ch.number]}`,
      };
    });
  });
  // Longer preliminary pages/appendices also need bounded calls.
  const bounded = (part: ThesisPart) => {
    const words = Math.round(part.words * scale), count = Math.max(1, Math.ceil(words / THESIS_PART_WORDS));
    return Array.from({length: count}, (_, i) => ({...part, id: count === 1 ? part.id : `${part.id}-${i + 1}`,
      words: Math.round(words / count), brief: `${part.brief}${count > 1 ? ` Write only portion ${i + 1} of ${count}; divide the requested headings evenly without repeating them.` : ""}`}));
  };
  return [...bounded(THESIS_FRONT), ...body, ...bounded(THESIS_APPENDIX)];
}

export const THESIS_PLAN_TASK = `Plan a thesis blueprint, not the thesis prose. Return only JSON {"title":"specific title","blueprint":"markdown under 2500 words","chapters":[{"number":1,"title":"Introduction","sections":["1.1 Background", "..."]}]}.
List exactly eight chapters in order, each with 6–14 numbered sections, without Chapter Summary (the writers add it). Follow this guide, adapted to the actual discipline:
${Object.entries(THESIS_CHAPTER_GUIDE).map(([n, guide]) => `Chapter ${n}: ${guide}`).join("\n")}
Fix consistent research questions, appropriate hypotheses, objectives, terminology, symbols and proposed or supplied datasets/tools; assign exact evidence reference numbers to each section. Do not invent evidence or claim completed experiments.`;

export const thesisPartTask = (part: ThesisPart) => `Write only this thesis part: ${part.heading}. Follow the shared blueprint exactly. ${part.brief}
Target about ${part.words} words, with developed analysis, tables and equations when appropriate. Never pad, repeat earlier sections or invent data. Put each table caption on its own line as "**Table N.M.** Caption". Return JSON {"content":"markdown without bibliography"}.`;

export function thesisContents(content: string, figureCaptions: string[] = []) {
  const lines = [...content.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm)]
    .filter(m => !/^(?:Cover Page|Inner Title|Title Page|Declaration|Certificate|Similarity Check|Acknowledg|Table of Contents|List of (?:Figures|Tables))/i.test(m[2]))
    .map(m => `${m[1].length === 1 ? "- " : "  - "}${m[2]}`);
  const captions = (kind: string) => [...content.matchAll(new RegExp(`^(?:\\*\\*((?:${kind})\\.? \\d+(?:\\.\\d+)?)[.:]?\\*\\*[.:]?|((?:${kind})\\.? \\d+(?:\\.\\d+)?)[.:])\\s+(.+?)\\s*$`, "gm"))]
    .map(m => `- ${m[1] ?? m[2]}: ${m[3].replace(/\*+/g, "")}`);
  const figures = [...new Set([...captions("Figure|Fig"), ...figureCaptions.map(c => `- ${c}`)])], tables = captions("Table");
  return [`# Table of Contents\n\n${lines.join("\n")}`,
    figures.length ? `# List of Figures\n\n${figures.join("\n")}` : "",
    tables.length ? `# List of Tables\n\n${tables.join("\n")}` : ""].filter(Boolean).join("\n\n");
}

export function insertThesisContents(content: string, figureCaptions: string[] = []) {
  const contents = thesisContents(content, figureCaptions);
  return content.includes("[[contents]]") ? content.replace(/^.*\[\[contents\]\].*$/m, contents)
    : content.replace(/^# Chapter 1\b/m, m => `${contents}\n\n${m}`);
}

/** Reserve room for distinct works before including multiple pages of any one paper. */
export function thesisEvidence<T extends { id: string; paperId?: string }>(sources: T[], limit = THESIS_SOURCES): T[] {
  const works = new Set<string>(), first: T[] = [], extra: T[] = [];
  for (const source of sources) {
    const key = source.paperId ?? source.id;
    if (works.has(key)) extra.push(source);
    else { works.add(key); first.push(source); }
  }
  return [...first, ...extra].slice(0, limit);
}

export function splitChapters(content: string) {
  return content.split(/\n(?=# (?!#))/).filter(part => part.trim());
}

/** Hard-bounded review chunks, including sections with no usable heading boundary. */
export function thesisCheckUnits(content: string, maxWords = 3500) {
  if (!Number.isInteger(maxWords) || maxWords < 1) throw new Error("Invalid thesis review limit");
  return splitChapters(content).flatMap(chapter => {
    const units: string[] = [];
    for (const section of chapter.split(/\n(?=## (?!#))/)) {
      const tokens = section.match(/\S+\s*/g) ?? [];
      for (let i = 0; i < tokens.length; i += maxWords) {
        const text = tokens.slice(i, i + maxWords).join("");
        const last = units.length - 1;
        if (last >= 0 && units[last].split(/\s+/).filter(Boolean).length + Math.min(maxWords, tokens.length - i) <= maxWords)
          units[last] += `\n${text}`;
        else units.push(text);
      }
    }
    return units;
  });
}
