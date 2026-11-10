import test from "node:test";
import assert from "node:assert/strict";
import { boundReview, readinessScore, scorecardMarkdown } from "./paper-review";
import { renderStudioPdf } from "./studio-pdf";

test("readiness excludes unassessed categories and never invents a zero score",()=>{
  assert.deepEqual(readinessScore([{score:null},{score:8},{score:6}]),{overall:70,assessedCategories:2});
  assert.deepEqual(readinessScore([{score:null}]),{overall:null,assessedCategories:0});
});
const category=(key:string)=>({key,score:9,rationale:"Supplied evidence",location:"Methods",improvement:"Clarify details."});
test("review bounds do not score unseen figures or absent target guidelines",()=>{
  const r=boundReview({summary:"Review",categories:[category("figures"),category("requirements"),category("writing")],findings:[]},
    "Editorial reviewer",new Set(),{visuals:false,target:false,proposal:false,external:false});
  assert.equal(r.categories.find(c=>c.key==="figures")?.score,null);
  assert.equal(r.categories.find(c=>c.key==="requirements")?.score,null);
  assert.equal(r.categories.find(c=>c.key==="writing")?.score,9);
  assert.equal(r.categories.find(c=>c.key==="references")?.score,null);
});
test("candidate gaps and overlaps cannot cite invented evidence IDs",()=>{
  const r=boundReview({summary:"Review",categories:[category("literature")],
    findings:[{severity:"revision",location:"Introduction",comment:"Check",recommendation:"Verify",sourceIds:["invented"]}],
    overlaps:[{sourceId:"invented",relationship:"Similar",overlap:"x",difference:"y",improvement:"z"}],
    gaps:[{question:"Test this?",rationale:"Limited evidence",sourceIds:["paper-1"]},{question:"Invalid?",rationale:"Not supported",sourceIds:["invented"]}]},
    "Subject reviewer",new Set(["paper-1"]),{visuals:false,target:false,proposal:false,external:true});
  assert.equal(r.findings.length,0);assert.equal(r.overlaps.length,0);
  assert.equal(r.gaps.length,1);
});
test("proposal results and literature without external papers are not scored",()=>{
  const a=boundReview({summary:"Review",categories:[category("results"),category("methods")],findings:[]},"Methods reviewer",new Set(),{visuals:false,target:false,proposal:true,external:false});
  assert.equal(a.categories.find(c=>c.key==="results")?.score,null);
  assert.equal(a.categories.find(c=>c.key==="methods")?.score,9);
  const b=boundReview({summary:"Review",categories:[category("literature")],findings:[]},"Subject reviewer",new Set(),{visuals:false,target:false,proposal:false,external:false});
  assert.equal(b.categories.find(c=>c.key==="literature")?.score,null);
});
test("scorecard PDF contains substantive review content and generates without AI calls",async()=>{
  const m={originalName:"Sample manuscript",sourceRevision:2,scorecard:{overall:70,assessedCategories:1,checkedAt:"2026-11-10T00:00:00Z",documentType:"proposal",scope:"AI-assisted bounded review.",
    categories:[{label:"Methods",score:7,rationale:"Design is described.",improvement:"Add uncertainty estimates."}],
    reviewers:[{role:"Methods reviewer",summary:"Clear proposed design.",findings:[{severity:"revision",location:"Methods",comment:"Uncertainty missing.",recommendation:"State measurement uncertainty.",sourceIds:["paper-1"]}]}],overlaps:[],gaps:[]},
    reviewCoverage:{scope:"One retrieved abstract, not exhaustive."},patentStatus:{message:"No live patent results in this test fixture."},reviewWarnings:[],
    reviewSources:[{id:"paper-1",title:"Test evidence",evidenceLevel:"Abstract only",url:"https://example.org/paper"}]};
  const content=scorecardMarkdown(m);
  assert.match(content,/70\/100/);assert.match(content,/Source revision: 2/);
  assert.match(content,/State measurement uncertainty/);assert.match(content,/https:\/\/example.org/);
  const bytes=await renderStudioPdf({title:"Manuscript Readiness Report",content,metadata:{templateId:"academic-report"}});
  assert.equal(bytes.subarray(0,4).toString(),"%PDF");
  assert.ok(bytes.length>2000);
});
