import test from "node:test";
import assert from "node:assert/strict";
import { boundRequirements, requirementLayout,evaluateRequirements,invalidateRequirementsCheck,prepareRequirements } from "./submission-requirements";
import { readableRules,loadOfficialGuidelines,downloadOfficialRules,type OfficialGuidelines } from "./official-guidelines";
import { documentLayoutFor } from "./studio-formatting";
import { renderStudioPdf } from "./studio-pdf";
import { pool } from "@workspace/db";
import { aiContext } from "./ai-budget";

const source:OfficialGuidelines={status:"retrieved",templateId:"ieee-access",templateName:"IEEE Access",sourceUrl:"https://ieeeaccess.ieee.org/authors/submission-guidelines/",fetchedAt:"2026-11-10T00:00:00Z",
  text:"Use A4 paper. The font size is 11 points. The left margin is 72 points. An Abstract section is required. The abstract must contain no more than 200 words. Supply signed approval from your supervisor.",
  message:"Retrieved official instructions.",coverage:"Only the readable source was checked."};
const extracted={layout:[{field:"pageSize",value:"A4",quote:"Use A4 paper."},{field:"fontSize",value:11,quote:"The font size is 11 points."},{field:"marginLeft",value:72,quote:"The left margin is 72 points."}],
  rules:[{kind:"section",expected:"Abstract",label:"Abstract section",quote:"An Abstract section is required."},
    {kind:"abstract_max_words",expected:"200",label:"Abstract word limit",quote:"The abstract must contain no more than 200 words."},
    {kind:"manual",expected:"",label:"Supervisor approval",quote:"Supply signed approval from your supervisor."}]};
test("only quoted official requirements can change supported export settings",()=>{
  const plan=boundRequirements(source,{...extracted,layout:[...extracted.layout,{field:"columns",value:2,quote:"This invented quote is not in the source."}]});
  assert.deepEqual(requirementLayout(plan),{size:"A4",fontSize:11,margins:{left:72}});
  const report=evaluateRequirements({content:"## Abstract\n\nA proposed study.",metadata:{templateId:"ieee-access",documentDetails:{author:"Test Author",affiliation:"Test University"}}},plan);
  assert.equal(report.checks.find(c=>c.label==="Abstract section")?.status,"met");
  assert.equal(report.checks.find(c=>c.label==="Supervisor approval")?.status,"manual");
  assert.equal(report.checks.find(c=>c.label==="Abstract word limit")?.status,"met");
  assert.equal(documentLayoutFor({metadata:{templateId:"ieee-access",requirementsCheck:report}}).size,"A4");
  assert.notEqual(documentLayoutFor({metadata:{templateId:"harvard",requirementsCheck:report}}).size,"A4");
});
test("numeric bounds, null optional values and one malformed item do not erase valid quoted requirements",()=>{
  const plan=boundRequirements(source,{layout:[...extracted.layout,{field:"unsupported",value:null,quote:"invalid"}],rules:[
    {...extracted.rules[1],expected:200},{...extracted.rules[2],expected:null},{kind:"wrong",label:"Bad field"}]});
  assert.equal(plan.rules.length,2);
  assert.equal(plan.rules[0].expected,"200");
  assert.equal(plan.rules[1].expected,"");
  assert.equal(requirementLayout(plan).fontSize,11);
});
test("conflicting, unsafe and author-supplied settings never silently override official layouts",()=>{
  const plan=boundRequirements({...source,text:`${source.text} Alternative size is 12 points.`},{...extracted,layout:[
    ...extracted.layout,{field:"fontSize",value:12,quote:"Alternative size is 12 points."},
    {field:"marginRight",value:0,quote:"The left margin is 72 points."}]});
  assert.equal(requirementLayout(plan).fontSize,undefined);
  assert.equal(requirementLayout(plan).margins.right,undefined);
  assert.ok(plan.rules.some(r=>r.kind==="manual"&&r.label.includes("fontSize")));
  assert.deepEqual(requirementLayout({...plan,source:{...source,status:"user_supplied"}}),{});
  const report=evaluateRequirements({content:"## Introduction\n\nText",metadata:{}},plan);
  assert.equal(report.checks.find(c=>c.label==="Abstract section")?.status,"missing");
  assert.equal(report.checks.find(c=>c.label==="Abstract word limit")?.status,"missing");
  assert.ok(report.checks.some(c=>c.label==="Author name"&&c.status==="missing"));
});
test("official retrieval detects blocked websites and rejects private destinations",async()=>{
  assert.doesNotMatch(readableRules("<script>bad()</script><p>Use A4 &amp; 12 pt.</p>"),/bad/);
  const result=await loadOfficialGuidelines("ieee-access",async()=>Buffer.from(`<html><h1>Just a moment</h1>${"Verify you are human. ".repeat(40)}</html>`));
  assert.equal(result.status,"unavailable");assert.equal(result.text,"");
  assert.match(result.message,/could not be retrieved/);
  const good=await loadOfficialGuidelines("ieee-access",async()=>Buffer.from(`<p>${source.text.repeat(4)}</p>`));
  assert.equal(good.status,"retrieved");assert.ok(good.fetchedAt);
  assert.equal((await loadOfficialGuidelines()).status,"not_selected");
  await assert.rejects(downloadOfficialRules("https://127.0.0.1/private"));
  await assert.rejects(downloadOfficialRules("http://example.org/rules"));
  await assert.rejects(downloadOfficialRules("https://[::1]/private"));
});
test("edits invalidate content checks while preserving sourced layout; changing target clears them",()=>{
  const metadata:any={requirementsCheck:evaluateRequirements({content:"Text",metadata:{}},boundRequirements(source,extracted))};
  invalidateRequirementsCheck(metadata);
  assert.equal(metadata.requirementsCheck.checks[0].status,"manual");
  assert.equal(metadata.requirementsCheck.appliedLayout.fontSize,11);
  invalidateRequirementsCheck(metadata,true);assert.equal(metadata.requirementsCheck,undefined);
});
test("actual PDF page dimensions use selected source-grounded requirements",async()=>{
  const row={title:"Requirements export",content:"## Abstract\n\nA proposed study.",metadata:{templateId:"ieee-access",documentDetails:{author:"Test",affiliation:"University"}}};
  const report=evaluateRequirements(row,boundRequirements(source,extracted));
  const pdf=await renderStudioPdf({...row,metadata:{...row.metadata,requirementsCheck:report}});
  assert.match(pdf.toString("latin1"),/\/MediaBox \[0 0 595\.28 841\.89\]/);
});
test("optional live official-source smoke check reports real retrieval or an explicit blocker",{skip:process.env.RUN_OFFICIAL_RULES_SMOKE!=="1"},async()=>{
  const result=await loadOfficialGuidelines("ieee-access");
  console.log(`Official-source smoke: ${result.templateName}: ${result.status}; ${result.text.length} readable characters${result.fetchedAt?`; fetched ${result.fetchedAt}`:""}.`);
  if(result.status==="retrieved"){assert.ok(result.text.length>=500);assert.ok(result.fetchedAt);}
  else{assert.equal(result.status,"unavailable");assert.equal(result.text,"");assert.match(result.message,/could not be retrieved/);}
});
test("optional live extraction retains actual source-quoted requirements",{skip:!process.env.RUN_REQUIREMENTS_ITEM_ID},async()=>{
  const id=process.env.RUN_REQUIREMENTS_ITEM_ID!;
  const {rows}=await pool.query("SELECT owner_id FROM research_studio_items WHERE id=$1",[id]);
  assert.ok(rows[0],"Use an isolated test-review item so AI usage remains owner-scoped and budgeted.");
  const plan=await aiContext.run({owner:rows[0].owner_id,analysisId:id},()=>prepareRequirements("ieee-access"));
  console.log(`Official rule extraction: ${plan.source.status}; ${plan.rules.length} source-quoted requirements; ${plan.layout.length} supported layout settings.`);
  assert.equal(plan.source.status,"retrieved");
  assert.ok(plan.rules.length>0,"Live source must produce actual quoted requirements, not just an unavailable-extraction fallback.");
});
