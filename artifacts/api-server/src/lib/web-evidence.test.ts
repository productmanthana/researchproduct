import test from "node:test";
import assert from "node:assert/strict";
import { parseWebResults,webQuery,webAllowed,searchWeb } from "./web-evidence";
test("web queries remove email, URL and phone identifiers and obey provider character limit",()=>{
  const q=webQuery("Wind energy contact researcher@example.com https://private.example/a +91 1234567890 "+"turbines ".repeat(40));
  assert.ok(!q.includes("@")&&!q.includes("https")&&!q.includes("1234567890"));
  assert.ok(Array.from(q).length<=128);
});
test("web results remain distinct, bounded, safely linked and evidence-level labelled",()=>{
  const result=parseWebResults({results:[
    {url:"https://example.org/report#p1",title:"Report",content:"source text",summary:"summary"},
    {url:"https://example.org/report#p2",title:"Duplicate",content:"duplicate"},
    {url:"javascript:alert(1)",title:"Unsafe",content:"bad"},
    {url:"http://127.0.0.1/private",title:"Private",content:"bad"},
    {url:"https://example.org/abstract",title:"Search summary",content:"",summary:"Only a summary",date:"not a date"},
  ]});
  assert.equal(result.length,2);assert.match(result[0].id,/^web-/);
  assert.match(result[0].evidenceLevel,/page text/);
  assert.match(result[1].evidenceLevel,/summary only/);
  assert.equal(result[1].publishedAt,null);
  assert.throws(()=>parseWebResults({error:"provider error"}));
});
test("project-only and no-new-search instructions prevent Internet expansion",()=>{
  for(const q of ["Use the same papers","Only uploaded documents","From existing sources","Do not search","No new search","Without web search"])assert.equal(webAllowed(q),false,q);
  assert.equal(webAllowed("Find research gaps in wind turbine control"),true);
});
test("explicitly restricted search never contacts provider or database",async()=>{
  const r=await searchWeb("wind turbines","test-owner",false);
  assert.equal(r.status,"restricted");assert.equal(r.results.length,0);assert.equal(r.retrievedAt,null);
});
