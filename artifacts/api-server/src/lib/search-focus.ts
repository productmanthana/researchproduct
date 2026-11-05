/** A conservative topical floor for date-sorted batches, not semantic ranking.
 * Relevance-ranked batches and semantic index results remain available too. */
export function matchesSearchFocus(query:string,paper:{title:string;abstract:string}) {
  const stop=new Set("the and for with from into using based about what which how does research recent latest papers publications studies study methods improve improving".split(" "));
  const tokens=(text:string)=>text.normalize("NFKC").toLowerCase().match(/[\p{L}]{3,}/gu)??[];
  const stem=(word:string)=>word.length>4?word.replace(/s$/,""):word;
  const terms=[...new Set(tokens(query).filter(t=>!stop.has(t)).map(stem))];
  if(terms.length<2)return true;
  const words=new Set(tokens(`${paper.title} ${paper.abstract}`).map(stem));
  return terms.filter(t=>words.has(t)).length>=Math.min(4,Math.max(2,Math.ceil(terms.length/2)));
}
