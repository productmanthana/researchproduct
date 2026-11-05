import { test, after } from "node:test";
import assert from "node:assert/strict";
import { pool } from "@workspace/db";
import { makePaper, deduplicate, fromOpenAlex, fromCrossref, cachePapers, getPaper } from "./catalogue";
import { titlesMatch } from "./citation-verification";
import { validEvidence } from "./evidence";
import { CreateAnalysisBody, LinkDocumentBody } from "@workspace/api-zod";
import { exportResearch } from "./exports";
const paper=(override:any={})=>makePaper({title:"A detailed study of graph neural networks",authors:["Ada Researcher"],year:2024,sources:["OpenAlex"],...override});
after(()=>pool.end());
test("DOIs normalize and duplicates retain provenance and abstracts",()=>{
  const result=deduplicate([paper({doi:"https://doi.org/10.1000/TEST"}),paper({doi:"10.1000/test",abstract:"Verified abstract",sources:["Crossref"]})]);
  assert.equal(result.papers.length,1);assert.equal(result.removed,1);
  assert.equal(result.papers[0].abstract,"Verified abstract");assert.deepEqual(result.papers[0].sources,["OpenAlex","Crossref"]);
});
test("Different DOI versions and arXiv preprints are not silently merged",()=>{
  assert.equal(deduplicate([paper({doi:"10.1/one"}),paper({doi:"10.1/two"})]).papers.length,2);
  assert.equal(deduplicate([paper(),paper({sources:["arXiv"],url:"https://arxiv.org/abs/2401.12345"})]).papers.length,2);
});
test("Conservative metadata matches merge; different authors do not",()=>{
  assert.equal(deduplicate([paper(),paper({doi:"10.1/one"})]).papers.length,1);
  assert.equal(deduplicate([paper(),paper({authors:["Someone Else"]})]).papers.length,2);
});
test("Connector normalizers handle missing metadata without invented abstracts",()=>{
  assert.equal(fromCrossref({DOI:"10.1/example",title:["Title"]}).abstract,"");
  assert.equal(fromOpenAlex({display_name:"Title",abstract_inverted_index:{Evidence:[0],works:[1]}}).abstract,"Evidence works");
  assert.equal(makePaper({url:"javascript:alert(1)"}).url,"");
});
test("Citation matching and evidence checks reject mismatches and invented quotes",()=>{
  assert.equal(titlesMatch("Graph learning for medicine","Graph learning for medicine."),true);
  assert.equal(titlesMatch("Graph learning for medicine","Bird migration patterns"),false);
  const s={id:"s",title:"Source",text:"The measured accuracy was 91 percent.",url:"",evidenceLevel:"PDF text",page:2};
  assert.equal(validEvidence({sourceId:"s",quote:"accuracy was 91 percent",page:2},[s]),true);
  assert.equal(validEvidence({sourceId:"s",quote:"accuracy was 99 percent",page:2},[s]),false);
  assert.equal(validEvidence({sourceId:"s",quote:"accuracy was 91 percent",page:1},[s]),false);
});
test("AI consent is mandatory and document links support explicit unlink",()=>{
  assert.equal(CreateAnalysisBody.safeParse({kind:"answer",question:"What does this show?"}).success,false);
  assert.equal(CreateAnalysisBody.safeParse({kind:"answer",question:"What does this show?",aiConsent:false}).success,false);
  assert.equal(CreateAnalysisBody.safeParse({kind:"image",question:"What does this show?",aiConsent:true,pageNumbers:[0]}).success,false);
  assert.equal(LinkDocumentBody.parse({paperId:null}).paperId,null);
});
test("Cached weaker metadata cannot erase an abstract or source provenance",async()=>{
  const id=paper({doi:"10.99999/evidora-regression-only"}).id;
  try{
    await cachePapers([paper({doi:"10.99999/evidora-regression-only",abstract:"A persistent abstract."})]);
    await cachePapers([paper({doi:"10.99999/evidora-regression-only",sources:["Crossref"]})]);
    const result=await getPaper(id);assert.equal(result.abstract,"A persistent abstract.");assert.equal(result.sources.length,2);
  }finally{await pool.query("DELETE FROM research_papers WHERE id=$1",[id]);}
});
test("Both CSL export styles include evidence, disclosure and valid DOCX bytes",async()=>{
  const view={content:"# Research answer\n\nEvidence finding [1].",sources:[{id:"test-private-evidence",title:"Private test evidence"}],warnings:[],comparisonRows:[]};
  const apa=await exportResearch(view,"apa","md");assert.match(String(apa),/AI-use disclosure/);assert.doesNotMatch(String(apa),/Evidence finding \[1\]/);
  const ieee=await exportResearch(view,"ieee","md");assert.match(String(ieee),/\[1\]/);
  const docx=await exportResearch(view,"ieee","docx");assert.ok(Buffer.isBuffer(docx));assert.equal(docx.subarray(0,2).toString(),"PK");
});
