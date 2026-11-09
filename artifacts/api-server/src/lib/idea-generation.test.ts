import {test} from "node:test";
import assert from "node:assert/strict";
import {IDEA_INSTRUCTIONS,IDEA_REVIEW_INSTRUCTIONS,isFreshIdeaTopic,studioSearchQuestion,invalidIdeaCitations} from "./idea-generation";

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
