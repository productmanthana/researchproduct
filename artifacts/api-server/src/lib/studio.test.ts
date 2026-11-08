import test from "node:test";
import assert from "node:assert/strict";
import { reviewDocument } from "./studio-checks";
import { studioTemplates } from "./studio-templates";
import { searchPatents } from "./studio-patents";
import { documentLayout,formatIssues,documentBlocks } from "./studio-formatting";
import { renderStudioWord } from "./studio-docx";
import { renderStudioPdf } from "./studio-pdf";
import mammoth from "mammoth";
test("project checks flag citation without a reference without claiming plagiarism verdict",()=>{
  const result=reviewDocument("# Findings\nA proposed research method [2].\n\n## References\n[1] Existing source.",[]);
  assert.ok(result.issues.some(s=>s.includes("[2]")));
  assert.equal(result.externalAvailable,false);
  assert.match(result.scope,/Not a web-wide plagiarism verdict/);
});
test("project similarity detects long exact phrases and does not invent percentages",()=>{
  const text="The experimentally investigated controller adjusts the blade pitch angle according to measured wind speed and generator output to maintain stable turbine operation under changing conditions.";
  const result=reviewDocument(text,[{title:"User reference",content:text}]);
  assert.ok(result.matches.length);
  assert.equal(result.matches[0].title,"User reference");
  assert.equal("score" in result,false);
});
test("short generic phrases do not count as matching evidence",()=>{
  assert.equal(reviewDocument("A new method.",[{title:"Other",content:"A new method."}]).matches.length,0);
});
test("draft profiles distinguish countries, publishers and unverified quartiles",()=>{
  const journals=studioTemplates.filter(t=>t.kind==="journal");
  assert.ok(journals.filter(t=>t.country==="India").length>=5);
  assert.ok(journals.filter(t=>t.country==="USA").length>=5);
  for(const p of ["IEEE","Springer Nature","Elsevier"])assert.ok(journals.some(t=>t.publisher===p));
  for(const t of journals)if(!t.ranking)assert.match(t.status,/Quartile not verified/);else{
    assert.equal(t.ranking.year,2025);assert.ok(t.ranking.category);assert.match(t.ranking.sourceUrl,/scimagojr/);
  }
  assert.equal(new Set(studioTemplates.map(t=>t.id)).size,studioTemplates.length);
});
test("local overlap counts shared words without counting quotations or references",()=>{
  const sentence="The experimentally investigated controller adjusts the blade pitch angle according to measured wind speed and generator output to maintain stable turbine operation under changing conditions.";
  const result=reviewDocument(`${sentence}\n\n“${sentence}”\n\n## References\n${sentence}`,[{title:"Reference",content:sentence}]);
  assert.equal(result.corpusSimilarityPercent,100);
  assert.ok(result.excludedWords>result.wordsChecked);
  assert.equal(result.comparedSources,1);
  assert.equal(result.matches[0].matchType,"Exact wording");
});
test("empty comparison corpus never returns a fabricated similarity value",()=>{
  const r=reviewDocument("This draft has research content but there are currently no reference documents.",[]);
  assert.equal(r.corpusSimilarityPercent,0);assert.equal(r.comparedSources,0);
});
test("profile layout rules are institution-specific",()=>{
  assert.equal(documentLayout("stanford").margins.left,108);
  assert.equal(documentLayout("harvard").lineSpacing,2);
  assert.equal(documentLayout("iit-bombay").size,"A4");
  assert.equal(documentLayout("ieee-access").columns,2);
  assert.equal(documentLayout("sadhana").lineSpacing,2);
});
test("format preflight flags absent authors and institution-specific pages",()=>{
  const issues=formatIssues({content:"## Copyright\nExample",metadata:{templateId:"stanford"}});
  assert.ok(issues.some(s=>s.includes("Author name")));
  assert.ok(issues.some(s=>s.includes("copyright/signature")));
});
test("tables are parsed structurally rather than exported as pipe strings",()=>{
  const b=documentBlocks("| A | B |\n| --- | --- |\n| first | second |");
  assert.equal(b[0].kind,"table");
  if(b[0].kind==="table")assert.deepEqual(b[0].rows,[["A","B"],["first","second"]]);
});
test("Word and PDF export structured thesis without duplicating its abstract",async()=>{
  const row={title:"Pitch control study",content:"# Pitch control study\n\n## Abstract\nUnique abstract sentence about controlled wind experiments.\n\n## Introduction\nProposed experimental protocol; no invented results.\n\n## Conclusions\nFurther work is required.",metadata:{templateId:"stanford",documentDetails:{author:"Example Author",affiliation:"Example University",degree:"PhD",department:"Engineering",supervisor:"Example Advisor",year:"2026"}}};
  const word=await renderStudioWord(row);
  assert.equal(word.subarray(0,2).toString(),"PK");
  const text=(await mammoth.extractRawText({buffer:word})).value;
  assert.equal(text.split("Unique abstract sentence").length-1,1);
  assert.match(text,/Example Advisor/);
  const pdf=await renderStudioPdf(row);
  assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
  assert.ok(pdf.length>5000);
  assert.equal((pdf.toString("latin1").match(/\/Type \/Page\b/g)??[]).length,5);
});
test("unconfigured patent API exposes the blocker, not synthetic records",async()=>{
  if(process.env.EPO_CLIENT_ID||process.env.EPO_CLIENT_SECRET)return;
  const result=await searchPatents("wind turbine");
  assert.equal(result.available,false);
  assert.equal(result.patents.length,0);
  assert.ok(result.links.some(l=>l.label.includes("India")));
});
