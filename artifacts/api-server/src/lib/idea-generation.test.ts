import {test} from "node:test";
import assert from "node:assert/strict";
import {IDEA_INSTRUCTIONS,IDEA_REVIEW_INSTRUCTIONS,isFreshIdeaTopic,studioSearchQuestion,invalidIdeaCitations,initialIdeaEvidence} from "./idea-generation";
import {sourcesFor} from "./research-engine";
import {makePaper} from "./catalogue";

test("initial idea evidence never downloads PDFs, renders images or embeds an already complete abstract",async()=>{
  const paper=makePaper({title:"Synthetic retrieval fixture",abstract:"Available abstract text for an initial proposal.",url:"https://example.org/paper",sources:["OpenAlex"]});
  let downloads=0,embeddings=0;
  const reader={
    getPaper:async()=>paper,
    cachedFullText:async()=>{downloads++;throw new Error("Unexpected full-text retrieval");},
    selectEvidencePages:async()=>{embeddings++;throw new Error("Unexpected page embedding");},
  };
  const sources=await sourcesFor({kind:"answer",question:"Suggest research ideas",input:{paperIds:[paper.id],abstractOnly:true,inspectFigures:false}},[],reader);
  assert.equal(downloads,0);assert.equal(embeddings,0);
  assert.equal(sources.length,1);assert.equal(sources[0].text,paper.abstract);
  assert.equal(sources[0].evidenceLevel,"Abstract only");
  assert.equal(sources[0].page,null);assert.equal(sources[0].image,undefined);
});

test("ordinary research still attempts full-text reading and abstract ranking when needed",async()=>{
  const paper=makePaper({title:"Synthetic full-reading fixture",abstract:"Abstract when a full PDF is unavailable.",url:"https://example.org/paper",sources:["OpenAlex"]});
  let downloads=0,embeddings=0;
  const sources=await sourcesFor({kind:"answer",question:"Analyse methods",input:{paperIds:[paper.id],inspectFigures:false}},[],{
    getPaper:async()=>paper,
    cachedFullText:async()=>{downloads++;return {notice:"No readable PDF",pages:undefined};},
    selectEvidencePages:async()=>{embeddings++;return [{page:1,text:paper.abstract}];},
  });
  assert.equal(downloads,1);assert.equal(embeddings,1);
  assert.equal(sources[0].evidenceLevel,"Abstract only");
});

test("initial idea cards use bounded abstracts but explicit full-text and visual requests keep deep reading",()=>{
  assert.equal(initialIdeaEvidence({kind:"ideas",prompt:"Suggest five ideas about power system generation"}),true);
  assert.equal(initialIdeaEvidence({kind:"ideas",prompt:"provide ideas on ai llm model"}),true);
  for(const prompt of ["Generate ideas from full-text papers","Read my PDFs and suggest ideas","Generate ideas using figures in this paper","Use page-by-page analysis to generate ideas"])
    assert.equal(initialIdeaEvidence({kind:"ideas",prompt}),false,prompt);
  for(const kind of ["journal","thesis","literature","answer"])
    assert.equal(initialIdeaEvidence({kind,prompt:"Power system generation"}),false,kind);
});

test("a new research topic never silently inherits a previous project idea",()=>{
  const fresh=isFreshIdeaTopic({kind:"ideas",prompt:"power system generation"},false);
  assert.equal(fresh,true);
  assert.equal(studioSearchQuestion("power system generation",{name:"Education project",description:"Rural school lessons"},"Old wind-turbine prototype",fresh),"power system generation");
});
test("explicit saved-project and parent references retain project scope",()=>{
  for(const prompt of ["Develop my idea","Suggest ideas using our references","Use this project","Explore the selected idea"])
    assert.equal(isFreshIdeaTopic({kind:"ideas",prompt},false),false);
  assert.equal(isFreshIdeaTopic({kind:"ideas",prompt:"Continue",parentId:"owned-parent"},false),false);
  assert.equal(isFreshIdeaTopic({kind:"ideas",prompt:"Known exact title"},true),false);
  assert.equal(isFreshIdeaTopic({kind:"journal",prompt:"power generation"},false),false);
});
test("contextual questions preserve the selected idea and cap discovery input",()=>{
  const q=studioSearchQuestion("Develop my idea",{name:"Grid study",description:"Power systems"},"Storage sizing",false);
  assert.match(q,/Storage sizing/);
  assert.equal(studioSearchQuestion("x".repeat(7000),{name:"",description:""},"",true).length,5000);
});
test("idea fields validate citations as well as summary text",()=>{
  const idea={problem:"Candidate gap [1]",question:"Proposed question",method:"Proposed protocol",feasibility:"Check resources"};
  assert.equal(invalidIdeaCitations([idea],1),false);
  assert.equal(invalidIdeaCitations([{...idea,method:"Unsupported reference [2]"}],1),true);
  assert.equal(invalidIdeaCitations([{...idea,question:"Invalid [0]"}],1),true);
});
test("idea writing and independent review require depth without invented research",()=>{
  assert.match(IDEA_INSTRUCTIONS,/validation/i);
  assert.match(IDEA_INSTRUCTIONS,/completed results/i);
  assert.match(IDEA_REVIEW_INSTRUCTIONS,/every field/i);
  assert.match(IDEA_REVIEW_INSTRUCTIONS,/exactly five/i);
});
