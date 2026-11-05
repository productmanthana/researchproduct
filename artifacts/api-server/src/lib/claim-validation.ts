import { validEvidence, normalize, type EvidenceSource, type Claim } from "./evidence";
import type { z } from "zod";

export function validateDraftClaims(claims:z.infer<typeof Claim>[],sources:EvidenceSource[]) {
  const counts={unknownSources:0,unmatchedQuotes:0,pageCorrections:0,rejectedClaims:0};
  const accepted:z.infer<typeof Claim>[]=[];
  for(const claim of claims){
    let valid=true;
    const evidence=claim.evidence.map(e=>{
      const source=sources.find(s=>s.id===e.sourceId);
      if(!source){counts.unknownSources++;valid=false;return e;}
      // Page numbers are metadata of the exactly identified source, not a fact
      // for the model to guess. Never resolve a source by approximate matching.
      const matched=e.quote.trim().length>=8&&!!(source.image||normalize(source.text).includes(normalize(e.quote)));
      if(!matched){counts.unmatchedQuotes++;valid=false;return e;}
      if(e.page!==source.page)counts.pageCorrections++;
      const canonical={...e,page:source.page};
      if(!validEvidence(canonical,sources))valid=false;
      return canonical;
    });
    if(valid)accepted.push({...claim,evidence});else counts.rejectedClaims++;
  }
  return {claims:accepted,counts};
}
