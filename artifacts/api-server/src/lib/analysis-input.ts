import { z } from "zod";
import { CreateAnalysisBody } from "@workspace/api-zod";

// Freeze the consented settings for the worker, rather than re-reading UI state.
export function analysisSnapshot(input: z.infer<typeof CreateAnalysisBody>, paperIds: string[], documentIds: string[]) {
  return {
    paperIds, documentIds,
    pageNumbers: [...new Set(input.pageNumbers ?? [])],
    inspectFigures: input.inspectFigures === true,
    aiConsent: input.aiConsent,
    autoDiscover: input.autoDiscover === true,
    guided: input.guided === true,
    parentAnalysisId: input.parentAnalysisId ?? null,
  };
}
