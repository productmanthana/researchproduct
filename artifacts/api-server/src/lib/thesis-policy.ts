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

/** One writing call each, in order. Word targets keep every call well inside one model response. */
export const THESIS_PARTS: { id: string; heading: string; words: number; brief: string }[] = [
  { id: "front", heading: "Preliminary pages", words: 3500, brief: `Write the preliminary pages, each as its own "# " heading, in this order: Declaration by the Candidate; Certificate from the Supervisor(s); Similarity Check Certificate (placeholder for the university's report); Acknowledgements (under one page, bracketed placeholders for names); Abstract (350–500 words: problem, gap, method, key results or [RESULT PENDING], contributions); then a line containing only [[contents]]; then List of Abbreviations (table, every acronym used in the blueprint); Nomenclature (tables for sets and indices, parameters, variables, each with units); List of Publications from this Thesis (the planned papers from the blueprint, marked "planned" or "under preparation"; never claim acceptance). Use bracketed placeholders for candidate, supervisor, university and dates unless documentDetails supplies them. Never add an AI-use statement.` },
  { id: "ch1", heading: "Chapter 1: Introduction", words: 7000, brief: `Chapter 1: Introduction. Background; national and regulatory context where relevant (for Indian power-system topics: CERC Deviation Settlement Mechanism Regulations 2024, IEGC 2023, 15-minute scheduling blocks, QCA role, SLDC operations); problem statement; research gap with a gap table comparing 10–15 closest cited studies (columns: study, system, key method, what it controls, what it leaves open); research questions RQ1–RQ4; hypotheses H1–H5 (testable, falsifiable); 5–6 measurable objectives; scope and delimitations; 4–6 numbered specific contributions; thesis organisation (one paragraph per chapter).` },
  { id: "ch2a", heading: "Chapter 2: Literature Review (first half)", words: 7500, brief: `Chapter 2: Literature Review, first half. Start with "# Chapter 2: Literature Review", the overview, and 2.1 Review Methodology reporting searchRecord exactly (databases, query strings, date range, records retrieved and read, inclusion and exclusion criteria, a PRISMA-style counts table identified → screened → full text → included). Then the first half of the thematic sections in the blueprint (foundations, methods and evaluation literature), citing as many distinct evidence items as possible, grouped by theme with quantitative comparison. No Chapter Summary yet.` },
  { id: "ch2b", heading: "Chapter 2: Literature Review (second half)", words: 7500, brief: `Chapter 2: Literature Review, second half. Do NOT repeat the chapter heading or the methodology; continue numbering from the blueprint with the remaining thematic sections (operations, optimisation, applications, recent advances, patents and deployments if present). Then a summary table of 30–40 key cited studies (method, system, data, metrics, limitation), numbered research gaps each linked to an objective, and the Chapter Summary. Prefer evidence items not cited in the first half.` },
  { id: "ch3", heading: "Chapter 3: System Modelling and Problem Formulation", words: 8000, brief: `Chapter 3: system description, the complete mathematical model with every symbol from the Nomenclature, the full baseline formulation (objective and all constraints as numbered equations), the uncertainty-aware or advanced formulation, execution scheme (for example rolling horizon), baseline and benchmark controllers, and network or physical validation model, as the blueprint fixes them.` },
  { id: "ch4", heading: "Chapter 4", words: 7000, brief: `Chapter 4 as titled in the blueprint (data, forecasting or methodological framework): named datasets with period, resolution and quality control; information sets or experimental factors; models and baselines; leakage prevention; evaluation metrics; a results section with tables and figures described from authorResults or [RESULT PENDING: …]; discussion; Chapter Summary.` },
  { id: "ch5", heading: "Chapter 5", words: 7000, brief: `Chapter 5 as titled in the blueprint (the main experimental contrasts): experimental design table, case-study parameter table with units, results for each regime from authorResults or [RESULT PENDING: …], statistical analysis (paired differences, block-bootstrap confidence intervals, multiple-comparison correction), explicit accept/reject status for each hypothesis tested here (pending when no results), sensitivity analysis, practical (for India: DSM charges in ₹) interpretation, Chapter Summary.` },
  { id: "ch6", heading: "Chapter 6", words: 6000, brief: `Chapter 6 as titled in the blueprint (validation, network or feasibility study): procedure, state selection, results from authorResults or [RESULT PENDING: …], propagation of corrected states over time where applicable, hypothesis test status, Chapter Summary.` },
  { id: "ch7", heading: "Chapter 7: Discussion", words: 5000, brief: `Chapter 7: Discussion. Synthesis across chapters answering RQ1–RQ4 explicitly (pending where results are pending), comparison with the cited literature (agreement and disagreement with reasons), practical implications for operators, utilities and regulators, threats to validity (internal, external, construct), Chapter Summary.` },
  { id: "ch8", heading: "Chapter 8: Conclusions and Future Work", words: 3500, brief: `Chapter 8: Conclusions and Future Work. Numbered summary of findings (quantitative only from authorResults, otherwise state what each experiment establishes once run), contributions mapped to the evidence that supports each, Limitations (stated once, clearly), 5–8 specific future-work directions.` },
  { id: "appendix", heading: "Appendices", words: 5000, brief: `Appendices, each as "# Appendix X: Title": A full parameter values table; B complete formulations not shown in Chapter 3; C data dictionary and preprocessing log; D additional result tables ([RESULT PENDING] cells where needed); E code repository description (repository placeholder, software and versions, solver settings, random seeds); F reproducibility checklist; G research work plan and timeline (36 months for a PhD, table by period with outputs and the planned papers). Do not add a References section.` },
];

export const THESIS_PLAN_TASK = `First produce the thesis blueprint only. Return JSON {"title":"specific thesis title","blueprint":"markdown"}. The blueprint fixes, for every later chapter writer: the title; research questions RQ1–RQ4; hypotheses H1–H5; objectives; numbered contributions; the case study or datasets and tools to name; the key symbols (sets, indices, parameters, variables, units); 2–3 planned publications; and the full outline of Chapters 1–8 and Appendices with numbered section titles and, per section, which evidence reference numbers it should draw on. Spread all evidence numbers across the chapters so that most of them are cited somewhere. Be concrete; this is a plan, not prose.`;

export const thesisPartTask = (part: (typeof THESIS_PARTS)[number]) => `Now write only this part of the thesis: ${part.heading}. Follow the blueprint exactly (title, numbering, RQs, hypotheses, symbols, case study) so the chapters fit together. ${part.brief}
Aim for about ${part.words.toLocaleString("en")} words of developed academic prose, tables and equations; never pad with repetition. Return JSON {"content":"markdown for this part only, without a bibliography"}.`;

/** Table of contents from the assembled chapter and section headings (page numbers come from the word processor). */
export function thesisContents(content: string) {
  const lines = [...content.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm)]
    .filter(m => !/^(?:Declaration|Certificate|Similarity Check|Acknowledg|Table of Contents)/i.test(m[2]))
    .map(m => `${m[1].length === 1 ? "- " : "  - "}${m[2]}`);
  return `# Table of Contents\n\n${lines.join("\n")}`;
}

/** Chapters (top-level headings) so long passes can work on one chapter at a time. */
export function splitChapters(content: string) {
  return content.split(/\n(?=# (?!#))/).filter(part => part.trim());
}
