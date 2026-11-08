export function reviewDocument(content:string,comparison:{title:string;content:string}[]) {
  const issues:string[]=[];
  if(/\b(?:TODO|TBD|insert here|placeholder|\[.*?required.*?\])\b/i.test(content))issues.push("Unfinished placeholders or required research inputs remain.");
  if(!/^#{1,3}\s+References/im.test(content))issues.push("A references section is missing.");
  if(/\b(?:guaranteed|100% accurate|proves novelty|plagiarism.free)\b/i.test(content))issues.push("An absolute assurance needs qualification.");
  const body=content.split(/^#{1,3}\s+References/im)[0];
  const bibliography=content.split(/^#{1,3}\s+References/im)[1]??"";
  const citations=[...body.matchAll(/\[(\d+)\]/g)].map(m=>m[1]);
  for(const id of new Set(citations))if(!new RegExp(`\\[${id}\\]`).test(bibliography))issues.push(`Citation [${id}] has no matching numbered reference.`);
  const sentences=body.split(/[.!?]\s+/).map(s=>s.trim()).filter(s=>s.length>100);
  if(new Set(sentences.map(s=>s.toLowerCase())).size<sentences.length)issues.push("Repeated sentences were found; review for duplication.");
  const normalize=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();
  const matches:{title:string;excerpt:string}[]=[];
  for(const source of comparison){
    const target=normalize(source.content);
    for(const sentence of sentences){
      const words=normalize(sentence).split(" ");
      for(let i=0;i+12<=words.length;i+=6){
        const phrase=words.slice(i,i+12).join(" ");
        if(target.includes(phrase)){matches.push({title:source.title,excerpt:sentence.slice(0,500)});break;}
      }
      if(matches.length>=20)break;
    }
    if(matches.length>=20)break;
  }
  return {scope:"Exact phrase screening against other current documents and accessible references in this project only. Not a web-wide plagiarism verdict or AI-authorship test. Quotations and legitimate reuse can match.",
    issues,matches,externalAvailable:false};
}
