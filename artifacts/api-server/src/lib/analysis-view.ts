import { iso } from "./common";
import { paperScopeFromQuestion, hasPaperScope, scopeDescription } from "./paper-scope";
import { academicContent, readableResearchText } from "./research-writing";
import { researchCurrency } from "./publication-currency";
export function analysisView(r:any) {
  const scope=paperScopeFromQuestion(r.question??"");
  const legacy=r.input?.autoDiscover&&!r.input?.scopeFiltersApplied&&hasPaperScope(scope)&&r.status==="completed"
    ?[`Earlier answer scope: This saved answer predates enforced publisher/year filtering. Its papers may not meet your ${scopeDescription(scope)} request. Run the question again for a restricted search.`]:[];
  const sources=r.result?.sources??[];
  const edited=(r.result?.warnings??[]).some((w:string)=>w.startsWith("Edited by the user"));
  const generatedLegacy=r.status==="completed"&&!r.result?.formatVersion&&!edited&&r.result?.claims?.length
    &&/^# (?:Research answer|Literature review|Visual evidence analysis)\b/.test(r.result?.content??"");
  // Upgrade the presentation of generated legacy answers without altering their
  // verified claims, stored content, or any user-edited draft.
  const emptyGenerated=r.status==="completed"&&!edited&&Array.isArray(r.result?.claims)&&!r.result.claims.length&&/^# (?:Insufficient verified evidence|Answer could not be verified)\b/.test(r.result?.content??"");
  let content=generatedLegacy||emptyGenerated?academicContent({kind:r.kind,claims:r.result.claims,sources,limitations:r.result.warnings??[]}):r.result?.content??"";
  if(!edited&&sources.length&&!content.includes("Evidence currency (")&&/^# (?:Research synthesis|Literature synthesis|Visual evidence analysis)\b/.test(content)){
    const citedIds=new Set(sources.map((s:any)=>s.paperId??s.id));
    const found=(r.input?.discoveredPapers??[]).filter((p:any)=>citedIds.has(p.id));
    const currency=researchCurrency(found.length?found:sources,new Date(r.created_at));
    content=content.replace(/^(#[^\n]+\n\n)/,`$1${currency}\n\n`);
  }
  return {id:r.id,kind:r.kind,question:r.question,status:r.status,content,claims:r.result?.claims??[],sources,responseMode:r.result?.responseMode??"research",draftContent:r.result?.draft?.content??null,draftRevision:r.result?.draft?.revision??null,draftProvenance:r.result?.draft?.provenance??null,comparisonRows:r.result?.comparisonRows??[],warnings:[...new Set([...legacy,...(r.input?.discoveryWarnings??[]),...(r.result?.warnings??[])])].map(w=>readableResearchText(String(w),sources)),error:r.error??"",createdAt:iso(r.created_at),
  reportTitle:r.result?.reportTitle??"",figures:r.result?.figures??[],
  mode:r.input?.autoDiscover?"ask":"research",parentAnalysisId:r.input?.parentAnalysisId??null,
  conversationId:r.input?.conversationId??null,searchQueries:r.input?.searchQueries??[],
  stage:r.input?.stage??"",discoveredPapers:r.input?.discoveredPapers??[]};
}
