import { HttpError } from "./common";

export const DRAFT_PROVENANCE="Working draft seeded from a completed evidence synthesis; user edits are not checked against source evidence.";
export function withDraftPreservingAnswer(result:any,draft:{content:string;revision:number;provenance:string}) {
  return {...result,draft};
}
export function usageStatusForResult(result:any) {
  return result?.responseMode==="guidance"||result?.claims?.length ? "completed" : "refunded";
}
export function makeDraftRevision(result:any,content:string,expectedRevision:number) {
  if(typeof content!=="string"||content.length>100000) throw new HttpError(400,"Draft must be 100,000 characters or fewer.");
  const current=result?.draft?.revision??0;
  if(current!==expectedRevision) throw new HttpError(409,"This draft changed in another tab. Reload to compare, or copy your text before resolving the conflict.");
  return {content,revision:current+1,provenance:DRAFT_PROVENANCE};
}
