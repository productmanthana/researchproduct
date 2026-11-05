import { z } from "zod";
export const Evidence=z.object({sourceId:z.string(),quote:z.string().max(3000),page:z.number().int().nullable()});
export const Claim=z.object({text:z.string().max(4000),section:z.string().max(100).optional(),evidence:z.array(Evidence).min(1).max(10)});
export type EvidenceSource={id:string;paperId?:string;title:string;url:string;evidenceLevel:string;text:string;page:number|null;image?:string;verification?:string};
export const normalize=(s:string)=>s.replace(/\s+/g," ").trim().toLowerCase();
export function validEvidence(e:z.infer<typeof Evidence>,sources:EvidenceSource[]) {
  const s=sources.find(x=>x.id===e.sourceId);
  return !!s&&e.page===s.page&&e.quote.trim().length>=8&&!!(s.image||normalize(s.text).includes(normalize(e.quote)));
}
