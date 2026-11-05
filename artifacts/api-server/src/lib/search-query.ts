const grammar=new Set("what which who how where when why is are was were do does did can could would should the a an to of for in on with about please tell me".split(" "));
const conversational=new Set("best methods method ways way improve improving explain show give".split(" "));
export function scholarlyTerms(value:string) {
  const text=value.normalize("NFKC").trim();
  const doi=text.match(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/[^\s]+)$/i);
  if(doi)return doi[1].toLowerCase();
  const question=/^(what|which|how|why|can|could|please|explain|tell)\b/i.test(text);
  const words=text.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)??[];
  const selected=words.filter(w=>!grammar.has(w.toLowerCase())&&(!question||!conversational.has(w.toLowerCase())));
  return (selected.length?selected:words).join(" ").slice(0,250);
}
// DOAJ interprets user text as Lucene rather than as a plain keyword field.
export const doajTerms=(value:string)=>scholarlyTerms(value).replace(/[^\p{L}\p{N}\s'-]/gu," ").replace(/\s+/g," ").trim();
