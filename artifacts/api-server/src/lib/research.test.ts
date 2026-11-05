import { test, after } from "node:test";
import assert from "node:assert/strict";
import { pool } from "@workspace/db";
import { makePaper, deduplicate, fromOpenAlex, fromCrossref, cachePapers, getPaper } from "./catalogue";
import { titlesMatch } from "./citation-verification";
import { validEvidence } from "./evidence";
import { CreateAnalysisBody, LinkDocumentBody } from "@workspace/api-zod";
import { exportResearch } from "./exports";
import { publicIPv4, reusableLicense, downloadPublicPdf, retrieveFullText } from "./open-full-text";
import { randomUUID } from "node:crypto";
import { chunkPages, rankPages, selectEvidencePages, retrievalContext } from "./semantic-retrieval";
import { aiContext, paidOpenAI, priceMicros, EMBEDDING_MODEL, CHAT_MODEL } from "./ai-budget";
import { analysisSnapshot } from "./analysis-input";
import { scholarlyTerms, doajTerms } from "./search-query";
import { SourceUnavailable, sourceFailure } from "./source-registry";
import { questionCandidates, conversationContext, reuseRequested, discoverySnapshot } from "./ask-discovery";
import { analysisView } from "./analysis-view";
const paper=(override:any={})=>makePaper({title:"A detailed study of graph neural networks",authors:["Ada Researcher"],year:2024,sources:["OpenAlex"],...override});
after(()=>pool.end());
test("Natural-language queries remove Lucene syntax and conversational filler",()=>{
  assert.equal(scholarlyTerms("What are the best methods to improve wind turbine efficiency?"),"wind turbine efficiency");
  assert.equal(scholarlyTerms('wind turbine efficiency? (test) +*'),"wind turbine efficiency test");
  assert.equal(scholarlyTerms("finite element methods"),"finite element methods");
  assert.equal(scholarlyTerms("https://doi.org/10.1371/journal.pone.0000308"),"10.1371/journal.pone.0000308");
  assert.equal(doajTerms("doi:10.1371/journal.pone.0000308"),"10 1371 journal pone 0000308");
  assert.match(sourceFailure(new SourceUnavailable("challenge",202)),/bot-check/);
  assert.match(sourceFailure(new SourceUnavailable("timeout")),/time limit/);
  assert.match(sourceFailure(new Error("credentials must not surface")),/could not be read/);
  assert.equal(reuseRequested("Compare two of those methods using the same papers."),true);
  assert.equal(reuseRequested("Use only the existing sources."),true);
  assert.equal(reuseRequested("Compare them without searching again."),true);
  assert.equal(reuseRequested("Find newer studies on blade optimization."),false);
});
test("Automatic selection interleaves query results and deduplicates shared DOIs",()=>{
  const first=Array.from({length:70},(_,i)=>paper({doi:`10.1234/a${i}`}));
  const second=[paper({doi:"10.1234/second-query"}),first[0]];
  const merged=questionCandidates([], [first,second]);
  assert.equal(merged.length,70);
  assert.equal(merged[1].doi,"10.1234/second-query");
  assert.equal(merged.filter(p=>p.doi==="10.1234/a0").length,1);
  const sameRecord=questionCandidates([],[first,[{...first[0],doi:"10.1234/alternate"}]],200);
  assert.equal(sameRecord.filter(p=>p.id===first[0].id).length,1);
  const found=questionCandidates([], [first,second],200);
  assert.equal(found.length,71);
  const snapshot=discoverySnapshot(found,[found[1].id]);
  assert.equal(snapshot.length,71);
  assert.equal(snapshot.filter(p=>p.selected).length,1);
  const view=analysisView({id:"test",created_at:new Date(),input:{autoDiscover:true,stage:"selecting",discoveredPapers:snapshot}});
  assert.equal(view.stage,"selecting");
  assert.equal(view.discoveredPapers.length,71);
  assert.equal(view.sources.length,0); // Found is not the same as cited.
  assert.deepEqual(analysisView({created_at:new Date(),input:{}}).discoveredPapers,[]);
});
test("Ask ancestry cannot cross owners and preserves the selected conversation context",async()=>{
  const owner=`ask-test-${randomUUID()}`,other=`ask-test-${randomUUID()}`,parent=randomUUID();
  try{
    await pool.query("INSERT INTO research_accounts(id) VALUES($1),($2)",[owner,other]);
    await pool.query(`INSERT INTO research_analyses(id,owner_id,kind,question,status,input,result)
      VALUES($1,$2,'answer','Wind turbine efficiency','completed',$3,$4)`,[parent,owner,JSON.stringify({autoDiscover:true,paperIds:["source-a"],conversationId:parent}),JSON.stringify({content:"A verified prior answer."})]);
    const context=await conversationContext({owner_id:owner,input:{parentAnalysisId:parent}});
    assert.equal(context.history[0].question,"Wind turbine efficiency");
    assert.deepEqual(context.previous.input.paperIds,["source-a"]);
    await assert.rejects(conversationContext({owner_id:other,input:{parentAnalysisId:parent}}),/previous answer is unavailable/);
  }finally{
    await pool.query("DELETE FROM research_analyses WHERE id=$1",[parent]);
    await pool.query("DELETE FROM research_accounts WHERE id=ANY($1::text[])",[[owner,other]]);
  }
});
test("Retrieval chunks preserve page attribution and overlap; fusion does not reward duplicate chunks",()=>{
  const chunks=chunkPages([{page:7,text:"a".repeat(8000)},{page:8,text:""}]);
  assert.equal(chunks.length,3);assert.ok(chunks.every(c=>c.page===7&&c.text.length<=4000));
  const rows=[...Array.from({length:30},()=>({page:1,semantic:0.4,lexical:0})),{page:2,semantic:0.1,lexical:2}];
  assert.deepEqual(rankPages(rows,2),[2,1]);
  assert.equal(priceMicros(CHAT_MODEL,1000000,1000000),950000000);
  assert.equal(priceMicros(EMBEDDING_MODEL,1000000),12350000);
  assert.throws(()=>priceMicros("unpriced",1));
});
test("Embedding cache is scoped, reused, and deleted with private documents; uncertain spend remains charged",async()=>{
  const owner=`retrieval-test-${randomUUID()}`,other=`retrieval-test-${randomUUID()}`,doc=randomUUID(),otherDoc=randomUUID();
  const originalFetch=globalThis.fetch;
  let calls=0;
  const vector=Array.from({length:3072},(_,i)=>i===0?1:0);
  const analysisId=randomUUID();
  try {
    await pool.query("INSERT INTO research_accounts(id) VALUES($1),($2)",[owner,other]);
    for(const [id,account] of [[doc,owner],[otherDoc,other]])
      await pool.query("INSERT INTO research_documents(id,owner_id,name,content_type,size,object_path,status) VALUES($1,$2,'Test','application/pdf',1,'/objects/test','ready')",[id,account]);
    globalThis.fetch=async(_url,options)=>{
      calls++;
      const body=JSON.parse(options!.body as string);
      return new Response(JSON.stringify({data:body.input.map((_:string,index:number)=>({index,embedding:vector})),usage:{prompt_tokens:10,total_tokens:10}}),{status:200,headers:{"content-type":"application/json"}});
    };
    const run=()=>aiContext.run({owner,analysisId},()=>retrievalContext.run({},()=>selectEvidencePages(owner,doc,[{page:1,text:"Wind turbine efficiency was measured."}],"wind efficiency",2,doc)));
    assert.equal((await run())[0].page,1);
    assert.equal(calls,2); // document chunks + query
    await run();assert.equal(calls,3); // second job only embeds the new query
    const privateRows=await pool.query("SELECT * FROM research_evidence_chunks WHERE document_id=$1 AND scope=$2",[doc,other]);
    assert.equal(privateRows.rowCount,0);
    await pool.query("DELETE FROM research_documents WHERE id=$1",[doc]);
    assert.equal((await pool.query("SELECT id FROM research_evidence_chunks WHERE document_id=$1",[doc])).rowCount,0);
    globalThis.fetch=async()=>{calls++;throw new Error("Test network ambiguity");};
    await assert.rejects(aiContext.run({owner,analysisId},()=>paidOpenAI("embeddings",{model:EMBEDDING_MODEL,input:["test"]},100)));
    const uncertain=await pool.query("SELECT status,amount_micros FROM research_ai_spend WHERE owner_id=$1 AND status='uncertain'",[owner]);
    assert.equal(uncertain.rowCount,1);assert.ok(uncertain.rows[0].amount_micros>0);
    globalThis.fetch=async()=>{calls++;return new Response("Rejected",{status:401});};
    await assert.rejects(aiContext.run({owner,analysisId},()=>paidOpenAI("embeddings",{model:EMBEDDING_MODEL,input:["test"]},100)));
    assert.equal((await pool.query("SELECT amount_micros FROM research_ai_spend WHERE owner_id=$1 AND status='rejected'",[owner])).rows[0].amount_micros,0);
    const before=calls;
    await assert.rejects(aiContext.run({owner,analysisId},()=>paidOpenAI("embeddings",{model:EMBEDDING_MODEL,input:["test"]},2000000000)),/monthly AI budget limit/);
    assert.equal(calls,before);
  }finally{
    globalThis.fetch=originalFetch;
    await pool.query("DELETE FROM research_ai_spend WHERE owner_id=ANY($1::text[])",[[owner,other]]);
    await pool.query("DELETE FROM research_documents WHERE owner_id=ANY($1::text[])",[[owner,other]]);
    await pool.query("DELETE FROM research_accounts WHERE id=ANY($1::text[])",[[owner,other]]);
  }
});
test("Full-text retrieval requires reuse rights and blocks private networks",async()=>{
  for(const license of ["cc0","cc-by","cc-by-sa-4.0"])assert.equal(reusableLicense(license),true);
  for(const license of ["cc-by-nc","cc-by-nd","unknown",null])assert.equal(reusableLicense(license),false);
  for(const address of ["127.0.0.1","10.1.2.3","169.254.169.254","192.168.0.1","100.64.0.1"])assert.equal(publicIPv4(address),false);
  await assert.rejects(downloadPublicPdf("https://127.0.0.1/test.pdf"));
  await assert.rejects(downloadPublicPdf("http://example.com/test.pdf"));
  await assert.rejects(downloadPublicPdf("https://[::1]/test.pdf"));
});
test("Live licensed PDF retrieval extracts source pages",{skip:process.env.EVIDORA_LIVE_TEST!=="1"},async()=>{
  const result=await retrieveFullText(paper({doi:"10.1371/journal.pone.0000308"}));
  assert.ok(result.pages?.some(p=>p.text.length>40),result.notice);
  assert.ok(result.url?.startsWith("https://"));
  assert.ok(reusableLicense(result.license));
});
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
  const parsed=CreateAnalysisBody.parse({kind:"answer",question:"What does this show?",aiConsent:true,inspectFigures:true});
  assert.equal(analysisSnapshot(parsed,[],["private-pdf"]).inspectFigures,true);
  assert.equal(analysisSnapshot({...parsed,inspectFigures:false},[],["private-pdf"]).inspectFigures,false);
  assert.equal(analysisSnapshot({...parsed,inspectFigures:undefined},[],["private-pdf"]).inspectFigures,false);
  const ask=CreateAnalysisBody.parse({kind:"answer",question:"Which methods work?",autoDiscover:true,parentAnalysisId:randomUUID(),aiConsent:true});
  assert.equal(analysisSnapshot(ask,[],[]).autoDiscover,true);
  assert.equal(analysisSnapshot(ask,[],[]).parentAnalysisId,ask.parentAnalysisId);
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
