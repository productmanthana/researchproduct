import type { Paper } from "./catalogue";

export type PaperScope = { publishers: string[]; fromYear?: number; toYear?: number };
export function publisherName(p: Pick<Paper,"doi"|"publisher">): string {
  // Prefer established publisher DOI prefixes over conflicting catalogue labels.
  const doi=p.doi.toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,"");
  if(doi.startsWith("10.1109/"))return "IEEE";
  if(/^10\.(1007|1038|1186|1057)\//.test(doi))return "Springer Nature";
  if(/^10\.(1016|1006)\//.test(doi))return "Elsevier";
  if(doi.startsWith("10.3390/"))return "MDPI";
  if(/\bieee\b|institute of electrical and electronics engineers/i.test(p.publisher))return "IEEE";
  if(/springer|nature (?:portfolio|publishing)|biomed central|palgrave/i.test(p.publisher))return "Springer Nature";
  if(/elsevier/i.test(p.publisher))return "Elsevier";
  return p.publisher;
}

export function paperScopeFromQuestion(question:string):PaperScope {
  const publishers:string[]=[];
  const broadMix=/(?:and|plus|including)\s+(?:other\s+)?open[- ]access\s+(?:journals|publishers)/i.test(question);
  const publicationRequest=/\b(?:papers?|publications?|journals?|articles?|studies|published|reported in)\b/i.test(question)
    || /\b(?:focus(?:ed)?\s+(?:only\s+)?on|only from|only use|use only)\b/i.test(question);
  if(publicationRequest&&!broadMix){
    const ieeeTopicOnly=/\bieee\s+standards?\b/i.test(question)&&!/\bieee\s+(?:publications?|papers?|journals?|articles?)\b/i.test(question);
    if(/\bieee\b/i.test(question)&&!ieeeTopicOnly&&!/\b(?:non[- ]|excluding\s+|except\s+)ieee\b/i.test(question))publishers.push("IEEE");
    if(/\bspringer(?:\s+nature)?\b/i.test(question))publishers.push("Springer Nature");
    if(/\belsevier\b/i.test(question))publishers.push("Elsevier");
  }
  const scope:PaperScope={publishers};
  const range=/\b(?:between|from)\s+((?:19|20)\d{2})\s*(?:and|to|through|[-–])\s*((?:19|20)\d{2})\b/i.exec(question);
  const lower=/\b(from|since|after)\s+((?:19|20)\d{2})\b/i.exec(question);
  const upper=/\b(before|until|through|up to)\s+((?:19|20)\d{2})\b/i.exec(question);
  if(range){scope.fromYear=Number(range[1]);scope.toYear=Number(range[2]);}
  else {
    if(lower)scope.fromYear=Number(lower[2])+(lower[1].toLowerCase()==="after"?1:0);
    if(upper)scope.toYear=Number(upper[2])-(upper[1].toLowerCase()==="before"?1:0);
    const inYear=/\b(?:published\s+)?in\s+((?:19|20)\d{2})\b/i.exec(question);
    if(!lower&&!upper&&inYear)scope.fromYear=scope.toYear=Number(inYear[1]);
  }
  return scope;
}
export const hasPaperScope=(scope:PaperScope)=>!!(scope.publishers.length||scope.fromYear||scope.toYear);
export function matchesPaperScope(p:Paper,scope:PaperScope) {
  return (!scope.publishers.length||scope.publishers.includes(publisherName(p)))
    && (!scope.fromYear||p.year>=scope.fromYear)
    && (!scope.toYear||(p.year>0&&p.year<=scope.toYear));
}
export function scopeDescription(scope:PaperScope) {
  return [scope.publishers.length?`${scope.publishers.join(" / ")} publications`:"",
    scope.fromYear&&scope.toYear?`${scope.fromYear}–${scope.toYear}`:scope.fromYear?`${scope.fromYear} onward`:scope.toYear?`through ${scope.toYear}`:""].filter(Boolean).join(" · ");
}
