import { iso } from "./common";
export const analysisView=(r:any)=>({id:r.id,kind:r.kind,question:r.question,status:r.status,content:r.result?.content??"",claims:r.result?.claims??[],sources:r.result?.sources??[],comparisonRows:r.result?.comparisonRows??[],warnings:r.result?.warnings??[],error:r.error??"",createdAt:iso(r.created_at)});
