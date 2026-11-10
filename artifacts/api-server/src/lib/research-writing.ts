type Citation = { id:string; paperId?:string; title?:string };
type WrittenClaim = { text:string; section?:string; evidence:{sourceId:string}[] };

// Keep reproducibility information, but don't mistake infrastructure logs for
// limitations of the scientific findings.
export function isProcessingNotice(text:string) {
  return /^(?:Answer depth:|Research freshness:|Search scope:|Earlier answer scope:|Weaviate |Where readable text|Inspected |Automatically selected |Reused the previous|A planned search|The Weaviate|Paper indexing|Possible preprint|AI-assisted draft|Edited by the user|Some or all selected papers|PDF text analysis|Visual analysis inspects|Claims that failed|No supported answer|\d+ retrieved records|(?:OpenAlex|Crossref|arXiv|dblp|DataCite|Europe PMC|DOAJ):)/i.test(text)
    || /:\s*(?:No (?:PDF|resolvable)|Licensed PDF|Automatically retrieved|Automatic retrieval|Reused a retained|Full-text lookup|Cached |Using abstract|The (?:provider|paper|PDF)|Citation |Crossref |OpenAlex )/i.test(text)
    || /(?:could not be read|no readable text|citation metadata|DOI metadata|verification unavailable|exceeds.*(?:limit|size))/i.test(text);
}

export function readableResearchText(text:string,sources:Citation[]) {
  // Upgrade old saved operational notices without changing research titles or
  // source quotations that may legitimately discuss AI models.
  if(/^Where readable text was available/.test(text))text=text.replace(/full-size OpenAI embeddings/g,"semantic similarity");
  const refs=new Map<string,string>();
  sources.forEach((s,i)=>{
    refs.set(s.id,`[${i+1}]`);
    if(s.paperId&&!refs.has(s.paperId))refs.set(s.paperId,`[${i+1}]`);
  });
  const uuid="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:-oa-p\\d+|-p\\d+)?";
  const parenthetical=new RegExp(`\\(\\s*(?:see\\s+)?(${uuid}(?:\\s*,\\s*${uuid})*)\\s*\\)`,"gi");
  const clean=text.replace(parenthetical,(_,ids:string)=>{
    const numbers=[...new Set(ids.split(/\s*,\s*/).map(id=>refs.get(id)).filter(Boolean))];
    return numbers.length?`(${numbers.join(", ")})`:"";
  });
  return clean.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:-oa-p\d+|-p\d+)?\b/gi,
    id=>refs.get(id)??"an uncited selected study");
}

export function scientificLimitations(warnings:string[],sources:Citation[]) {
  return [...new Set(warnings.filter(w=>!isProcessingNotice(w)).map(w=>readableResearchText(w,sources).trim()).filter(Boolean))];
}

export function academicContent({kind,claims,sources,limitations=[],currency=""}:{kind:string;claims:WrittenClaim[];sources:Citation[];limitations?:string[];currency?:string}) {
  const numbering=new Map(sources.map((s,i)=>[s.id,i+1]));
  const sections=kind==="review"
    ?["Introduction","Thematic findings","Comparative analysis","Research gaps","Conclusion"]
    :kind==="image"?["Visual findings","Interpretation","Conclusion"]
    :["Overview","Evidence-based findings","Critical discussion","Conclusion"];
  const bucket=(name="")=>{
    if(kind==="review"){
      if(/intro|overview|summary/i.test(name))return sections[0];
      if(/compar|discussion|interpret/i.test(name))return sections[2];
      if(/gap/i.test(name))return sections[3];
      if(/conclu/i.test(name))return sections[4];
      return sections[1];
    }
    if(/conclu/i.test(name))return sections[sections.length-1];
    if(kind==="image")return /discuss|interpret|compar/i.test(name)?sections[1]:sections[0];
    if(/intro|overview|summary|synthesis/i.test(name))return sections[0];
    if(/discuss|interpret|compar|gap/i.test(name))return sections[2];
    return sections[1];
  };
  const chunks:string[]=[];
  for(const section of sections){
    const matching=claims.filter(c=>bucket(c.section)===section);
    if(!matching.length)continue; // Never fabricate prose to populate a heading.
    const paragraphs=matching.map(c=>{
      const numbers=[...new Set(c.evidence.map(e=>numbering.get(e.sourceId)).filter((n):n is number=>n!==undefined))];
      return `${readableResearchText(c.text,sources).trim()} ${numbers.map(n=>`[${n}]`).join(" ")}`.trim();
    });
    chunks.push(`## ${chunks.length+1}. ${section}\n\n${paragraphs.join("\n\n")}`);
  }
  const limits=scientificLimitations(limitations,sources);
  const abstractOnly=sources.some(s=>(s as any).evidenceLevel==="Abstract only");
  if(abstractOnly)limits.push("Some cited evidence is available only as abstracts. Unreported methods, datasets and numerical results could not be assessed from those sources.");
  if(limits.length)chunks.push(`## ${chunks.length+1}. Evidence limitations\n\n${[...new Set(limits)].join("\n\n")}`);
  if(!claims.length)return "# Answer could not be verified\n\nNo claims passed the source and evidence checks for this run. This does not mean that relevant research is absent. No scientific conclusion is drawn.\n\nYour answer allowance has been restored. You can retry or narrow the question to a specific method. Unverified draft conclusions and caveats are not presented as scientific findings.";
  return `# ${kind==="review"?"Literature synthesis":kind==="image"?"Visual evidence analysis":"Research synthesis"}\n\n${currency?`${currency}\n\n`:""}${chunks.join("\n\n")}`;
}
