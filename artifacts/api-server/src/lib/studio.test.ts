import test from "node:test";
import assert from "node:assert/strict";
import { reviewDocument } from "./studio-checks";
import { studioTemplates } from "./studio-templates";
import { searchPatents } from "./studio-patents";
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
  for(const t of journals)assert.match(t.status,/Quartile not verified/);
  assert.equal(new Set(studioTemplates.map(t=>t.id)).size,studioTemplates.length);
});
test("unconfigured patent API exposes the blocker, not synthetic records",async()=>{
  if(process.env.EPO_CLIENT_ID||process.env.EPO_CLIENT_SECRET)return;
  const result=await searchPatents("wind turbine");
  assert.equal(result.available,false);
  assert.equal(result.patents.length,0);
  assert.ok(result.links.some(l=>l.label.includes("India")));
});
