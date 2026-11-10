import test from "node:test";
import assert from "node:assert/strict";
import { parseWebResults,webQuery,webAllowed,searchWeb } from "./web-evidence";
import { annotatedWebResults, requestWebSearch, webSearchRequest, webUsage, WEB_MODEL, WEB_RESERVATION_USD, WebProviderError } from "./openrouter-web";
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
test("OpenRouter search explicitly enables web retrieval with a bounded DeepSeek request",()=>{
  const request=webSearchRequest("wind turbine control");
  assert.equal(request.model,WEB_MODEL);
  assert.match(request.model,/^deepseek\//);
  assert.equal(request.plugins[0].id,"web");
  assert.equal(request.plugins[0].engine,"exa");
  assert.equal(request.plugins[0].max_results,6);
  assert.equal(request.max_tokens,8192);
  assert.equal(request.stream,false);
  assert.equal(request.reasoning.enabled,false);
  assert.ok(WEB_RESERVATION_USD>=0.007+163840*0.26/1e6+8192*0.38/1e6);
});
test("OpenRouter evidence comes only from retrieved citation excerpts, never generated answer prose",()=>{
  const data={choices:[{message:{content:"Invented answer https://invented.example",
    annotations:[
      {type:"url_citation",url_citation:{url:"https://university.example/study",title:"Original study",content:"Actual retrieved excerpt"}},
      {type:"url_citation",url_citation:{url:"https://university.example/study#duplicate",title:"Duplicate",content:"Actual excerpt"}},
      {type:"url_citation",url_citation:{url:"https://missing.example",title:"No excerpt"}},
      {type:"url_citation",url_citation:{url:"javascript:alert(1)",title:"Bad",content:"unsafe"}},
      {type:"other",url_citation:{url:"https://ignored.example",title:"Ignored",content:"ignored"}},
    ]}}]};
  const sources=parseWebResults(annotatedWebResults(data));
  assert.equal(sources.length,1);
  assert.equal(sources[0].url,"https://university.example/study");
  assert.equal(sources[0].text,"Actual retrieved excerpt");
  assert.equal(sources[0].publishedAt,null);
  assert.throws(()=>annotatedWebResults({choices:[{message:{content:"No citations"}}]}),/missing_source_annotations/);
  assert.throws(()=>annotatedWebResults({error:{message:"failure"}}),/provider_error/);
});
test("OpenRouter accounting accepts total billed cost and rejects missing or invalid usage",()=>{
  assert.deepEqual(webUsage({usage:{cost:0.009,prompt_tokens:100,completion_tokens:20}}),{usd:0.009,input:100,output:20});
  assert.deepEqual(webUsage({usage:{cost:0,prompt_tokens:0,completion_tokens:0}}),{usd:0,input:0,output:0});
  for(const usage of [{},{cost:"0.1",prompt_tokens:1,completion_tokens:1},
    {cost:-1,prompt_tokens:1,completion_tokens:1},
    {cost:Infinity,prompt_tokens:1,completion_tokens:1},
    {cost:0.1,prompt_tokens:1.5,completion_tokens:1},
    {cost:0.1,prompt_tokens:1,completion_tokens:-1}])
    assert.equal(webUsage({usage}),null);
});
test("OpenRouter transport sends the configured search and classifies failures without exposing response bodies",async(t)=>{
  let status=200,calls=0;
  t.mock.method(globalThis,"fetch",async(url:any,options:any)=>{
    calls++;
    assert.equal(url,"https://openrouter.ai/api/v1/chat/completions");
    assert.equal(options.method,"POST");
    assert.equal(JSON.parse(options.body).plugins[0].engine,"exa");
    return new Response(JSON.stringify(status===200?{choices:[],usage:{cost:0.01,prompt_tokens:100,completion_tokens:20}}:{error:{message:"sensitive provider response"}}),{
      status,headers:{"content-type":"application/json"},
    });
  });
  assert.equal(webUsage(await requestWebSearch("wind energy"))?.usd,0.01);
  for(const [code,category] of [[401,"authentication"],[403,"authentication"],[402,"credits"],[429,"rate_limit"],[500,"provider_error"]] as const){
    status=code;
    await assert.rejects(requestWebSearch("wind energy"),error=>{
      assert.ok(error instanceof WebProviderError);
      assert.equal(error.status,code);
      assert.equal(error.category,category);
      assert.ok(!error.message.includes("sensitive"));
      return true;
    });
  }
  assert.equal(calls,6); // No automatic retries that could duplicate paid searches.
});
