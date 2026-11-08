import { createHash } from "node:crypto";

export type WatchCandidate = {
  key: string; kind: "paper" | "patent"; title: string; abstract: string;
  url: string; publishedAt: string; sourceId: string;
};
export const fingerprint = (text: string) => createHash("sha256").update(text).digest("hex");
export function publicationKey(kind: "paper" | "patent", id: string, title: string, year = "") {
  const normalized = id.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
  return `${kind}:${normalized || fingerprint(title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim()+year)}`;
}
const stop = new Set("the and for with from into based research study studies project review literature thesis journal paper papers proposal idea using new recent latest what how improve want investigate".split(" "));
export function topicTerms(topic: string) {
  return [...new Set((topic.toLowerCase().match(/[\p{L}\p{N}-]{3,}/gu) ?? []).filter(t=>!stop.has(t)))];
}
export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length!==b.length) return 0;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
  return aa&&bb?dot/Math.sqrt(aa*bb):0;
}
export function lexicalScore(topic: string, candidate: WatchCandidate) {
  const terms=topicTerms(topic),text=`${candidate.title} ${candidate.abstract}`.toLowerCase();
  return terms.length?terms.filter(t=>text.includes(t)).length/terms.length:0;
}
export function evidenceLabel(candidate: WatchCandidate) {
  return candidate.abstract.trim() ? "Title and abstract only; full text not reviewed" : "Title and bibliographic metadata only; relevance is provisional";
}
export function publicationAgeLabel(date: string, now = new Date()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return "Publication date not established";
  const age=(now.getTime()-new Date(date+"T00:00:00Z").getTime())/86400000;
  if(!Number.isFinite(age)||age<0)return "Reported publication date needs verification";
  return age<=60?"Recent publication":"Older publication newly found by this watch";
}
