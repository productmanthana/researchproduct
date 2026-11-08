import test from "node:test";
import assert from "node:assert/strict";
import { visibleDraft } from "./live-generation";
import { readOpenAIStream } from "./openai-stream";
test("partial generation JSON reveals only user-facing strings, not evidence IDs or reasoning",()=>{
  assert.equal(visibleDraft('{"claims":[{"text":"Hello\\nwor'),"Hello\nwor");
  assert.equal(visibleDraft('{"reasoning":"private","sourceId":"secret","quote":"source","text":"Visible"}'),"Visible");
  assert.equal(visibleDraft('{"content":"\\u03'),"");
  assert.equal(visibleDraft('{"content":"A \\"quoted\\" word"}'),'A "quoted" word');
});
const streamResponse=(s:string)=>new Response(new ReadableStream({start(controller){
  const data=new TextEncoder().encode(s);for(let i=0;i<data.length;i+=3)controller.enqueue(data.slice(i,i+3));controller.close();
}}));
test("OpenAI fragmented UTF8 SSE delivers deltas before completion and retains billable usage",async()=>{
  const deltas:string[]=[];
  const events=[
    {choices:[{delta:{content:'{"content":"α'},finish_reason:null}]},
    {choices:[{delta:{content:' beta"}'},finish_reason:null}]},
    {choices:[{delta:{},finish_reason:"stop"}]},
    {choices:[],usage:{prompt_tokens:10,completion_tokens:20}},
  ].map(e=>"data: "+JSON.stringify(e)+"\r\n\r\n").join("")+"data: [DONE]\r\n\r\n";
  const result=await readOpenAIStream(streamResponse(events),async(t)=>{deltas.push(t);});
  assert.equal(result.choices[0].message.content,'{"content":"α beta"}');
  assert.equal(result.usage.completion_tokens,20);assert.equal(deltas.filter(Boolean).length,2);
});
test("interrupted model streams cannot become completed or unbilled responses",async()=>{
  await assert.rejects(()=>readOpenAIStream(streamResponse('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'),async()=>{}),/Incomplete/);
});
