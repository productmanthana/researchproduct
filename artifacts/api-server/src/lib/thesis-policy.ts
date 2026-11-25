/**
 * A doctoral thesis is 150–250 pages: far more than one model response can hold. It is planned once
 * (a blueprint fixing title, questions, hypotheses, symbols and chapter outline) and then written part
 * by part against that blueprint, so chapters agree with each other and each gets its full length.
 */

/** Distinct works a thesis is expected to cite; fewer triggers a warning. */
export const THESIS_MIN_CITED = 100;
/** Papers carried into a thesis reference base (catalogue + saved + earlier drafts). */
export const THESIS_PAPERS = 120;
/** Evidence items passed to the writer. */
export const THESIS_SOURCES = 150;

export const THESIS_INSTRUCTIONS = `Write a complete doctoral thesis (PhD standard of Stanford, Harvard, IIT; UGC (Minimum Standards and Procedures for Award of Ph.D. Degree) Regulations, 2022 where an Indian university applies). It is a thesis, not a proposal, synopsis or review: never label it "Thesis proposal", never write "this proposal", and never say the document reports no results.
Absolute rules:
- Never fabricate data, results, numbers, citations, DOIs, authors or quotes. authorResults is the only source of the candidate's own results. Where a result is not in authorResults, write a placeholder of the exact form [RESULT PENDING: the experiment, data and metric that produce this], and give results tables their real column headings with [RESULT PENDING] cells. Describe the method fully so the experiment can be run.
- Cite only the numbered evidence. Never cite a predatory or off-discipline venue.
- Never print tool or drafting leftovers: "the user's proposed", "project synopsis", "project literature", "earlier project drafts", "search excerpt", "abstract-level", "the excerpt", "View source", "[Author name required]". Write in the candidate's own academic voice.
- Third person / passive academic voice throughout ("This thesis proposes…", "The results show…"); never "we" or "I".
- State findings confidently where evidence supports them. Use "would", "may" and "does not establish" sparingly; limitations are stated once, in the Limitations section of the final chapter.
- SI units; ₹ for Indian costs (state the exchange rate when converting).
- Name concrete tools and software (language, solver, simulation and analysis packages) and real public datasets or a named case-study site; leave versions for Appendix E.
- Each chapter opens with a short overview paragraph and closes with a "Chapter Summary" section. Number sections by chapter (1.1, 1.1.1), tables and equations by chapter (Table 3.2, Eq. (3.7)). Refer to every table in the text before it appears.
- Plain Markdown: "# Chapter N: Title" for chapters, "## N.M Title" for sections, "### N.M.K" for subsections, pipe tables, equations written inline in plain text or LaTeX-style $...$.`;

/** Body words planned per chapter (about 70,000 words in all, 180–250 formatted pages with front and end matter). */
export const THESIS_CHAPTER_WORDS = [7500, 17000, 9000, 8000, 9000, 7000, 5000, 3500];
/** Most words asked of one writing call; a longer chapter is written in section groups. */
export const THESIS_PART_WORDS = 4000;

/** What each chapter must cover; the planner turns this into numbered sections and the writers follow it. */
export const THESIS_CHAPTER_GUIDE: Record<number, string> = {
  1: `Introduction (12–18 pages): background and why the problem matters; national and regulatory context where relevant (for Indian power-system topics: CERC Deviation Settlement Mechanism Regulations 2024, IEGC 2023, 15-minute scheduling blocks, tolerance bands, QCA role, Grid-India/SLDC operations, C&I sites with PV, battery and diesel generation on unreliable feeders); problem statement; research gap with a gap table comparing 10–15 closest cited studies (study, system, key method, what it controls, what it leaves open); research questions RQ1–RQ4; hypotheses H1–H5, testable and falsifiable; 5–6 measurable objectives; scope and delimitations; 4–6 numbered specific contributions; thesis organisation (one paragraph per chapter).`,
  2: `Literature Review (30–45 pages, 100+ cited works): review methodology first, reporting searchRecord exactly (databases, query strings, date range, inclusion and exclusion criteria, a PRISMA-style counts table identified → screened → full text → included); then 7–9 thematic sections covering foundations, methods, evaluation metrics and benchmarks, information availability, value of the method in operations, optimisation or modelling under uncertainty (classic and recent), the physical subsystem (for example storage), application settings, validation or network feasibility, and security or dynamics briefly; then a summary table of 30–40 key cited studies (method, system, data, metrics, limitation); then numbered research gaps each linked to an objective.`,
  3: `System Modelling and Problem Formulation (20–30 pages): system description with a single-line or block diagram described in text; the complete mathematical model with every symbol from the Nomenclature; the full baseline formulation (objective and every constraint as numbered equations); the uncertainty-aware formulation (for example two-stage stochastic with non-anticipativity) and an optional robust or CVaR variant; execution scheme (for example rolling horizon: forecast horizon, scheduling horizon, execution interval); a fixed-rule baseline with its exact rules; a perfect-foresight benchmark; the network or physical validation model, its solution method, correction procedure and state propagation.`,
  4: `Data and forecasting (or core methodological) framework (20–30 pages): named public datasets or the named case-study site with period, resolution, quality control, missing data and flags; information sets or experimental factors; models and baselines (quantile versions where relevant); leakage prevention (chronological splits, training-only fitting, rolling origin); scenario generation; evaluation metrics; results tables with their real column headings; discussion.`,
  5: `Main experimental contrasts (25–35 pages): experimental design table with factorial levels; case-study parameter table with units and ₹ costs where Indian; results for each regime; statistical analysis (paired differences, block-bootstrap 95% confidence intervals, multiple-comparison correction); an explicit accept / reject / pending status for each hypothesis tested here, with the evidence; sensitivity analyses; practical interpretation (for India: deviation charges in ₹ under 15-minute blocks).`,
  6: `Validation, network correction or feasibility study (20–25 pages): original versus corrected streams; the state-selection rule; results (violations, redispatch, extra curtailment, load shedding, correction cost); chronological propagation of corrected states and its effect on later intervals; hypothesis test status; dynamic checks only if suitable models exist.`,
  7: `Discussion (10–15 pages): synthesis across chapters answering RQ1–RQ4 explicitly; comparison with the cited literature (agreement and disagreement with reasons); practical implications for operators, utilities, aggregators and regulators; threats to validity (internal, external, construct).`,
  8: `Conclusions and Future Work (6–10 pages): numbered summary of findings (quantitative only from authorResults, otherwise what each experiment establishes once run); contributions mapped to the evidence for each; Limitations (stated once, clearly); 5–8 specific future-work directions. This chapter has no Chapter Summary.`,
};

export type ThesisChapter = { number: number; title: string; sections: string[] };
export type ThesisPart = { id: string; heading: string; words: number; brief: string };

export const THESIS_FRONT: ThesisPart = { id: "front", heading: "Preliminary pages", words: 3500, brief: `Write the preliminary pages, each as its own "# " heading, in this order: Cover Page (university, thesis title, "A thesis submitted in fulfilment of the requirements for the degree of Doctor of Philosophy in [discipline]", candidate, registration number, supervisor, research centre, month and year); Inner Title Page; Declaration by the Candidate; Certificate from the Supervisor(s); Similarity Check Certificate (placeholder for the university's report); Acknowledgements (under one page, bracketed placeholders for names); Abstract (350–500 words: problem, gap, method, key results or [RESULT PENDING], contributions); then a line containing only [[contents]] (the table of contents, list of figures and list of tables are generated there); then List of Abbreviations (table, every acronym in the blueprint); Nomenclature (tables for sets and indices, parameters, variables, each with units); List of Publications from this Thesis (the planned papers from the blueprint, marked "planned" or "under preparation"; never claim acceptance). Use bracketed placeholders for candidate, supervisor, university and dates unless documentDetails supplies them. Never add an AI-use statement.` };

export const THESIS_APPENDIX: ThesisPart = { id: "appendix", heading: "Appendices", words: 4500, brief: `Appendices, each as "# Appendix X: Title": A full nomenclature and parameter values table; B complete formulations not shown in Chapter 3; C data dictionary and preprocessing log; D additional result tables ([RESULT PENDING] cells where needed); E code repository description (repository placeholder, software and versions, solver settings, random seeds); F reproducibility checklist; G first pages of published papers (placeholder list of the planned papers). Then "# Curriculum Vitae" with bracketed placeholders. Do not add a References section.` };

/**
 * Front matter, then each chapter in section groups of at most THESIS_PART_WORDS, then appendices.
 * The first group opens the chapter; the last closes it with the Chapter Summary.
 */
export function thesisParts(chapters: ThesisChapter[]): ThesisPart[] {
  const body = chapters.flatMap((ch, i) => {
    const words = THESIS_CHAPTER_WORDS[i] ?? 6000;
    const groups = Math.max(1, Math.min(ch.sections.length, Math.ceil(words / THESIS_PART_WORDS)));
    const size = Math.ceil(ch.sections.length / groups);
    const chunks = Array.from({ length: groups }, (_, k) => ch.sections.slice(k * size, (k + 1) * size)).filter(c => c.length);
    return chunks.map((sections, k): ThesisPart => {
      const first = k === 0, last = k === chunks.length - 1;
      const others = ch.sections.filter(s => !sections.includes(s));
      return {
        id: `ch${ch.number}-${k + 1}`,
        heading: `Chapter ${ch.number}: ${ch.title}${chunks.length > 1 ? ` (part ${k + 1} of ${chunks.length})` : ""}`,
        words: Math.round(words / chunks.length),
        brief: `${first ? `Start with "# Chapter ${ch.number}: ${ch.title}" and a short overview paragraph.` : "Do NOT repeat the chapter heading or overview; continue the chapter directly with the sections below."} Write exactly these sections, in order, each with its "## " heading and "### " subsections as needed: ${sections.join("; ")}.${others.length ? ` Other parts of this chapter cover ${others.join("; ")}; do not write them.` : ""} ${last && ch.number !== 8 ? `Close the chapter with "## ${ch.number}.${ch.sections.length + 1} Chapter Summary".` : "No Chapter Summary in this part."}
What this chapter must cover overall: ${THESIS_CHAPTER_GUIDE[ch.number] ?? "as the blueprint fixes it."}${ch.number === 2 ? " Prefer evidence items not cited in other parts of this chapter, and cite as many distinct evidence items as the sections support." : ""}`,
      };
    });
  });
  return [THESIS_FRONT, ...body, THESIS_APPENDIX];
}

export const THESIS_PLAN_TASK = `First produce the thesis blueprint only. Return JSON {"title":"specific thesis title","blueprint":"markdown","chapters":[{"number":1,"title":"Introduction","sections":["1.1 Background","..."]}]}.
"chapters" lists exactly eight chapters in order, each with 6–12 numbered section titles (Chapter 2 with 10–14), following this guide and never listing a Chapter Summary (writers add it):
${Object.entries(THESIS_CHAPTER_GUIDE).map(([n, g]) => `Chapter ${n}: ${g}`).join("\n")}
The blueprint fixes, for every later chapter writer: the title; research questions RQ1–RQ4; hypotheses H1–H5; objectives; numbered contributions; the named case-study site or public datasets and the tools and software to name; the key symbols (sets, indices, parameters, variables, units); 2–3 planned publications; and, per section, which evidence reference numbers it should draw on. Spread all evidence numbers across the chapters so that most of them are cited somewhere. Be concrete; this is a plan, not prose.`;

export const thesisPartTask = (part: ThesisPart) => `Now write only this part of the thesis: ${part.heading}. Follow the blueprint exactly (title, numbering, RQs, hypotheses, symbols, case study) so the chapters fit together. ${part.brief}
Aim for about ${part.words.toLocaleString("en")} words of developed academic prose, tables and equations; never pad with repetition. Put a caption on its own line above every table as "**Table N.M.** Caption" and refer to the table in the text first. Return JSON {"content":"markdown for this part only, without a bibliography"}.`;

/** Table of contents, list of figures and list of tables from headings and captions (page numbers come from the word processor). */
export function thesisContents(content: string) {
  const lines = [...content.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm)]
    .filter(m => !/^(?:Cover Page|Inner Title|Declaration|Certificate|Similarity Check|Acknowledg|Table of Contents)/i.test(m[2]))
    .map(m => `${m[1].length === 1 ? "- " : "  - "}${m[2]}`);
  // "**Table 3.2.** Caption" or "Figure 4. Caption"; a sentence such as "Table 3.2 shows" is not a caption.
  const captions = (kind: string) => [...content.matchAll(new RegExp(`^(?:\\*\\*((?:${kind})\\.? \\d+(?:\\.\\d+)?)[.:]?\\*\\*[.:]?|((?:${kind})\\.? \\d+(?:\\.\\d+)?)[.:])\\s+(.+?)\\s*$`, "gm"))]
    .map(m => `- ${m[1] ?? m[2]}: ${m[3].replace(/\*+/g, "")}`);
  const figures = captions("Figure|Fig"), tables = captions("Table");
  return [`# Table of Contents\n\n${lines.join("\n")}`,
    figures.length ? `# List of Figures\n\n${figures.join("\n")}` : "",
    tables.length ? `# List of Tables\n\n${tables.join("\n")}` : ""].filter(Boolean).join("\n\n");
}

/** Chapters (top-level headings) so long passes can work on one chapter at a time. */
export function splitChapters(content: string) {
  return content.split(/\n(?=# (?!#))/).filter(part => part.trim());
}

/** Review units of at most ~maxWords: whole chapters, with long chapters cut at "## " section boundaries. */
export function thesisCheckUnits(content: string, maxWords = 3500) {
  const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
  return splitChapters(content).flatMap(chapter => {
    if (words(chapter) <= maxWords) return [chapter];
    const units: string[] = [];
    for (const section of chapter.split(/\n(?=## (?!#))/)) {
      const last = units.length - 1;
      if (last >= 0 && words(units[last]) + words(section) <= maxWords) units[last] += `\n${section}`;
      else units.push(section);
    }
    return units;
  });
}
