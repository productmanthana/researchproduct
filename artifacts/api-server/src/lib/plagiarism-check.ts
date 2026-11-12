import { aiContext } from "./ai-budget";
import { embed } from "./semantic-retrieval";
import { alignDraft, MIN_MATCH_WORDS, type AlignmentResult, type CandidateSource, type Confirm } from "./plagiarism-align";
import { findCandidates } from "./plagiarism-sources";
import { logger } from "./logger";

/** A submission-ready draft should be at least 99% original (at most 1% matched text). */
export const ORIGINALITY_TARGET = 99;
export type PlagiarismReport = AlignmentResult & {
  target: number; checkedAt: string; method: string;
  searched: { project: number; scholarly: number; fullText: number; web: number };
};

const cosine = (a: number[], b: number[]) => {
  let dot = 0, x = 0, y = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; }
  return dot / (Math.sqrt(x * y) || 1);
};
const confirmWithEmbeddings: Confirm = async pairs => {
  if (!aiContext.getStore()) return null;
  try {
    const texts = [...new Set(pairs.flatMap(p => [p.a, p.b]))], vectors = new Map<string, number[]>();
    for (let i = 0; i < texts.length; i += 200) {
      const batch = texts.slice(i, i + 200), out = await embed(batch);
      batch.forEach((t, k) => vectors.set(t, out[k]));
    }
    return pairs.map(p => cosine(vectors.get(p.a)!, vectors.get(p.b)!));
  } catch (err) { logger.warn({ err }, "Paraphrase embeddings unavailable"); return null; }
};

export type PlagiarismCorpus = { project: CandidateSource[]; found: Awaited<ReturnType<typeof findCandidates>> };

/** Retrieves the comparison corpus once, so a repaired draft can be re-checked without searching again. */
export async function plagiarismCorpus(input: { content: string; title: string; owner?: string; project: CandidateSource[] }): Promise<PlagiarismCorpus> {
  return { project: input.project, found: await findCandidates(input.content, input.title, input.owner) };
}

/** Aligns a draft against an already retrieved corpus. */
export async function checkAgainst(content: string, corpus: PlagiarismCorpus): Promise<PlagiarismReport> {
  const { project, found } = corpus;
  const result = await alignDraft(content, [...project, ...found.sources], confirmWithEmbeddings);
  return {
    ...result, notices: [...found.notices, ...result.notices],
    target: ORIGINALITY_TARGET, checkedAt: new Date().toISOString(),
    searched: { project: project.length, ...found.searched },
    method: `Compared against this project's documents, ${found.searched.scholarly} scholarly abstracts, ${found.searched.fullText} open-access full texts and ${found.searched.web} Internet pages. Seeds are exact 5-word sequences and stemmed content-word trigrams, merged into passages; matches under ${MIN_MATCH_WORDS} words are ignored. Paraphrases are counted when a sentence keeps most of a source sentence's content words and, unless the overlap is strong, embeddings confirm the same meaning. Quotations, citations, headings, tables, equations and the reference list are excluded. Paywalled full texts and pages the search did not return cannot be compared.`,
  };
}

/** Full plagiarism check: project material + scholarly index + open full text + Internet. */
export async function runPlagiarismCheck(input: { content: string; title: string; owner?: string; project: CandidateSource[] }): Promise<PlagiarismReport> {
  return checkAgainst(input.content, await plagiarismCorpus(input));
}
