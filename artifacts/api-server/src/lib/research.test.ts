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
import { allowanceReached, entitlement } from "./common";
import { paperScopeFromQuestion, matchesPaperScope, publisherName } from "./paper-scope";
import { academicContent, scientificLimitations, readableResearchText } from "./research-writing";
test("Academic synthesis separates scientific limitations from infrastructure and preserves citation numbering",()=>{
  const id=randomUUID(),other=randomUUID();
  const sources=[{id:`${id}-oa-p2`,paperId:id,title:"IEEE study",evidenceLevel:"Selected PDF text"}];
  const warnings=["Weaviate retained 42 records.","Where readable text was available, evidence pages were ranked using full-size OpenAI embeddings.","Paper: Reused a retained licensed PDF and its extracted text.",`Only simulations were available (see ${id}-oa-p2).`,`A comparison was not reported (${other}).`];
  const claims=[{text:"Simulation evidence supports the controller.",section:"Overview",evidence:[{sourceId:sources[0].id},{sourceId:sources[0].id}]},{text:"Real-world validation was not reported.",section:"Conclusion",evidence:[{sourceId:sources[0].id}]}];
  const text=academicContent({kind:"answer",claims,sources,limitations:warnings});
  assert.match(text,/# Research synthesis/);
  assert.match(text,/## 1\. Overview/);
  assert.match(text,/## 2\. Conclusion/);
  assert.match(text,/Only simulations were available \(see \[1\]\)|Only simulations were available \(\[1\]\)/);
  assert.doesNotMatch(text,/Weaviate|embeddings|retained licensed|[0-9a-f]{8}-[0-9a-f]{4}|\[1\] \[1\]/);
  assert.equal(scientificLimitations(warnings,sources).length,2);
  assert.equal(readableResearchText(id,sources),"[1]");
  assert.doesNotMatch(text,/Critical discussion|No verified findings available/);
});
test("Legacy presentation upgrades preserve claims and stored text, and never reformat user-edited drafts",()=>{
  const sourceId=randomUUID();
  const result={content:"# Research answer\n\n## Findings\n\nA verified claim. [1]\n\n## Evidence and limitations\n\n- Weaviate retained 42 records.",claims:[{text:"A verified claim.",section:"Findings",evidence:[{sourceId}]}],sources:[{id:sourceId,title:"A study",evidenceLevel:"Abstract only"}],warnings:["Weaviate retained 42 records."]};
  const row={id:randomUUID(),kind:"answer",status:"completed",question:"Research question",created_at:new Date(),input:{},result};
  const original=JSON.stringify(row);
  const view=analysisView(row);
  assert.match(view.content,/## 1\. Evidence-based findings/);
  assert.match(view.content,/Some cited evidence is available only as abstracts/);
  assert.doesNotMatch(view.content,/Weaviate/);
  assert.ok(view.warnings.some(w=>w.includes("Weaviate")));
  assert.equal(JSON.stringify(row),original);
  assert.deepEqual(view.claims,result.claims);
  assert.equal(analysisView({...row,result:{...result,warnings:[...result.warnings,"Edited by the user. Changes have not been checked against sources."]}}).content,result.content);
  assert.match(academicContent({kind:"answer",claims:[],sources:[]}),/No scientific conclusion is drawn/);
});
test("IEEE publication scope excludes MDPI, old dates, unknown publishers and IEEE mentions in abstracts",()=>{
  const scope=paperScopeFromQuestion("What methods improve wind turbine efficiency using AI-based pitch control? Focus on IEEE publications from 2020 onward. Cite each finding.");
  assert.deepEqual(scope,{publishers:["IEEE"],fromYear:2020});
  const ieee=paper({doi:"10.1109/real.2024.1",publisher:"",year:2024});
  const mdpi=paper({doi:"10.3390/pr14071084",publisher:"IEEE",year:2026,abstract:"We cite IEEE studies."});
  assert.equal(matchesPaperScope(ieee,scope),true);
  assert.equal(publisherName(mdpi),"MDPI");
  assert.equal(matchesPaperScope(mdpi,scope),false);
  assert.equal(matchesPaperScope({...ieee,year:2019},scope),false);
  assert.equal(matchesPaperScope({...ieee,year:0},scope),false);
  assert.equal(matchesPaperScope({...ieee,doi:"",publisher:"",abstract:"IEEE pitch control."},scope),false);
  assert.equal(matchesPaperScope({...ieee,doi:"",publisher:"Institute of Electrical and Electronics Engineers (IEEE)"},scope),true);
  const warmIndex=[mdpi,ieee,{...ieee,id:randomUUID(),year:2018}];
  assert.deepEqual(questionCandidates([], [warmIndex]).filter(p=>matchesPaperScope(p,scope)).map(p=>p.id),[ieee.id]);
});
test("Publisher unions and year ranges preserve mixed-source requests",()=>{
  const scope=paperScopeFromQuestion("Compare methods reported in Springer Nature and Elsevier publications between 2020 and 2024.");
  assert.deepEqual(scope,{publishers:["Springer Nature","Elsevier"],fromYear:2020,toYear:2024});
  assert.equal(matchesPaperScope(paper({doi:"10.1007/s123",year:2022}),scope),true);
  assert.equal(matchesPaperScope(paper({doi:"10.1016/j.example",year:2025}),scope),false);
  assert.equal(paperScopeFromQuestion("IEEE standards discussed in research papers").publishers.length,0);
  assert.equal(paperScopeFromQuestion("Research from IEEE, Springer Nature, Elsevier and open-access journals.").publishers.length,0);
});
test("Historical restricted answers are flagged rather than silently rewritten",()=>{
  const base={id:randomUUID(),created_at:new Date(),question:"Focus on IEEE publications from 2020 onward.",status:"completed",input:{autoDiscover:true},result:{content:"Saved original answer.",warnings:[]}};
  const old=analysisView(base);
  assert.equal(old.content,"Saved original answer.");
  assert.match(old.warnings.join(" "),/predates enforced publisher\/year filtering/);
  assert.equal(analysisView({...base,input:{...base.input,scopeFiltersApplied:true}}).warnings.length,0);
});
test("Unlimited entitlement bypasses only request-count limits and leaves trials unchanged",async()=>{
  const owner=`quota-test-${randomUUID()}`,other=`quota-test-${randomUUID()}`;
  try{
    await pool.query("INSERT INTO research_accounts(id,plan) VALUES($1,'unlimited'),($2,'trial')",[owner,other]);
    const un=await entitlement(owner),trialPlan=await entitlement(other);
    assert.equal(un.id,"unlimited");
    for(const key of ["answers","reviews","images"] as const){
      assert.equal(un[key],-1);
      assert.equal(allowanceReached(1000000,un[key]),false);
    }
    assert.equal(trialPlan.answers,3);
    assert.equal(allowanceReached(3,trialPlan.answers),true);
    assert.equal(allowanceReached(2,trialPlan.answers),false);
  }finally{await pool.query("DELETE FROM research_accounts WHERE id=ANY($1::text[])",[[owner,other]]);}
});
import { chunkPages, rankPages, selectEvidencePages, retrievalContext } from "./semantic-retrieval";
import { aiContext, paidOpenAI, priceMicros, EMBEDDING_MODEL, CHAT_MODEL } from "./ai-budget";
import { analysisSnapshot } from "./analysis-input";
import { scholarlyTerms, doajTerms } from "./search-query";
import { SourceUnavailable, sourceFailure } from "./source-registry";
import { questionCandidates, conversationContext, reuseRequested, discoverySnapshot } from "./ask-discovery";
import { analysisView } from "./analysis-view";
import { paperIndexDocument, initializePaperIndex, closePaperIndex, indexPublicPapers, PAPER_COLLECTION } from "./weaviate-paper-index";
const paper=(override:any={})=>makePaper({title:"A detailed study of graph neural networks",authors:["Ada Researcher"],year:2024,sources:["OpenAlex"],...override});
after(()=>pool.end());
test("Public paper index keeps stable source IDs and excludes non-catalogue fields",()=>{
  const p=paper({doi:"10.1234/vector-link",pdfUrl:"https://example.org/paper.pdf"});
  const a=paperIndexDocument({...p,privateText:"must not leave this process"} as any);
  const b=paperIndexDocument({...p,pdfUrl:"https://example.org/updated.pdf"});
  assert.equal(a.id,p.id);
  assert.equal(a.properties.paperId,p.id);
  assert.equal(a.properties.doi,p.doi);
  assert.equal(a.properties.pdfUrl,p.pdfUrl);
  assert.equal(a.properties.contentHash,b.properties.contentHash); // Link changes do not require paid re-embedding.
  assert.notEqual(a.properties.contentHash,paperIndexDocument({...p,abstract:"New scientific evidence."}).properties.contentHash);
  assert.equal(JSON.parse(a.properties.record).privateText,undefined);
});
test("Live isolated Weaviate collection is ready without modifying other collections",{skip:!process.env.LIVE_WEAVIATE_TEST},async()=>{
  try{
    const client=await initializePaperIndex();
    assert.equal(await client.isReady(),true);
    const config=await client.collections.use(PAPER_COLLECTION).config.get();
    assert.equal(config.name,PAPER_COLLECTION);
    assert.match(config.description??"",/public scholarly metadata only/);
    const collection=client.collections.use(PAPER_COLLECTION);
    const sample=await collection.query.fetchObjects({limit:3,includeVector:true,returnProperties:["record","paperId","contentHash"]});
    if(sample.objects.length){
      const records=sample.objects.map(o=>JSON.parse(String(o.properties.record)));
      for(const o of sample.objects){
        assert.equal(o.uuid,o.properties.paperId);
        assert.equal(o.vectors.paper.length,3072);
      }
      // No AI context is installed: a paid embedding request here would fail.
      const reuse=await indexPublicPapers(records);
      assert.equal(reuse.inserted,0);
      assert.equal(reuse.cached,records.length);
      const hit=await collection.query.hybrid(records[0].title,{
        vector:sample.objects[0].vectors.paper as number[],targetVector:"paper",
        queryProperties:["title","abstract"],alpha:0.65,limit:3,
      });
      assert.ok(hit.objects.some(o=>o.uuid===records[0].id));
      console.log(`Verified ${sample.objects.length} linked 3072-dimensional records, zero-charge reuse, and a hybrid-search match.`);
    }
  }finally{await closePaperIndex();}
});
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
