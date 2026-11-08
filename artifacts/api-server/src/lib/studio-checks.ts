type Comparison={title:string;content:string;url?:string};
const words=(s:string)=>(s.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)??[]);
const noReferences=(s:string)=>s.split(/^#{1,3}\s+(?:\d+[.)]?\s+)?(?:References|Bibliography|Literature Cited)\s*$/im)[0];
export function reviewDocument(content:string,comparison:Comparison[]){
  const issues:string[]=[];
  if(/\b(?:TODO|TBD|insert here|placeholder)\b|\[(?:[^\]]*?required)[^\]]*\]/i.test(content))issues.push("Unfinished placeholders or required research inputs remain.");
  if(!/^#{1,3}\s+(?:References|Bibliography|Literature Cited)/im.test(content))issues.push("A references section is missing.");
  if(/\b(?:guaranteed|100% accurate|proves novelty|plagiarism.free)\b/i.test(content))issues.push("An absolute assurance needs qualification.");
  const body=noReferences(content),bibliography=content.slice(body.length);
  const citations=[...body.matchAll(/\[(\d+)\]/g)].map(m=>m[1]);
  for(const id of new Set(citations))if(!new RegExp(`\\[${id}\\]`).test(bibliography))issues.push(`Citation [${id}] has no matching numbered reference.`);
  const text=body.replace(/^>.*$/gm,"").replace(/“[^”]*”|"[^"]*"/g,"").replace(/^#{1,6}.*$/gm,"");
  const paragraphs=text.split(/\n\s*\n|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const checked=paragraphs.map(s=>({text:s,words:words(s)}));
  const seen=new Set<string>(),sources=comparison.filter(s=>{
    const key=words(s.content).join(" ");if(!key||seen.has(key))return false;seen.add(key);return true;
  }).slice(0,100);
  if(comparison.length>100)issues.push("Comparison is limited to 100 project sources in this check.");
  const coverage=checked.map(p=>new Set<number>());
  const matches:{title:string;excerpt:string;sourceExcerpt:string;matchType:string;url?:string}[]=[];
  for(const source of sources){
    const segments=noReferences(source.content).slice(0,120000).split(/\n\s*\n|(?<=[.!?])\s+/).map(s=>({text:s.trim(),words:words(s)})).filter(s=>s.words.length>=12);
    const index=new Map<string,number[]>();
    segments.forEach((p,n)=>{for(let i=0;i+5<=p.words.length;i++){const key=p.words.slice(i,i+5).join(" "),list=index.get(key)??[];if(list.at(-1)!==n&&list.length<8)list.push(n);index.set(key,list);}});
    checked.forEach((p,n)=>{
      if(p.words.length<12)return;
      const candidates=new Map<number,Set<number>>();
      for(let i=0;i+5<=p.words.length;i++)for(const sourceIndex of index.get(p.words.slice(i,i+5).join(" "))??[]){
        const positions=candidates.get(sourceIndex)??new Set<number>();
        for(let j=i;j<i+5;j++)positions.add(j);candidates.set(sourceIndex,positions);
      }
      const best=[...candidates].sort((a,b)=>b[1].size-a[1].size)[0];
      if(!best||best[1].size<12||best[1].size/p.words.length<0.55)return;
      best[1].forEach(i=>coverage[n].add(i));
      if(matches.length<40)matches.push({title:source.title,excerpt:p.text.slice(0,900),sourceExcerpt:segments[best[0]].text.slice(0,900),matchType:segments[best[0]].words.join(" ").includes(p.words.join(" "))?"Exact wording":"Shared wording with changes",url:source.url});
    });
  }
  if(new Set(paragraphs.map(p=>p.toLowerCase())).size<paragraphs.length)issues.push("Repeated passages were found; review for duplication.");
  const wordsChecked=checked.reduce((n,p)=>n+p.words.length,0),matchedWords=coverage.reduce((n,set)=>n+set.size,0);
  return {scope:"Wording-overlap screening against available text in this project's current documents, reference abstracts and retained evidence excerpts only (up to 100 sources; first 120,000 characters per source). Explicit double-quoted text, block quotes, headings and references are excluded from the draft score. Not a web-wide plagiarism verdict or AI-authorship test. Legitimate reuse and cited paraphrases can match; human review is required.",
    issues,matches,externalAvailable:false,checkedAt:new Date().toISOString(),comparedSources:sources.length,wordsChecked,matchedWords,excludedWords:Math.max(0,words(content).length-wordsChecked),corpusSimilarityPercent:wordsChecked?Math.round(matchedWords/wordsChecked*1000)/10:0};
}
