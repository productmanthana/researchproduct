import {test} from "node:test";
import assert from "node:assert/strict";
import {studioConversation,validStudioContext} from "./studio-conversation";
import {loadStudioConversation} from "./studio-conversation";
import {pool} from "@workspace/db";
import {randomUUID} from "node:crypto";

const row=(id:string,previous?:string,extra:Record<string,any>={})=>({
  id,owner_id:"owner",project_id:"project",kind:"answer",title:id,status:"completed",content:`Answer ${id}`,
  metadata:{request:{prompt:`Question ${id}`,...(previous?{parentId:previous}:{})}},...extra,
});
test("saved chat context retains earlier questions and replies in order",()=>{
  const result=studioConversation([row("third","second"),row("first"),row("second","first"),row("unrelated")],"third","owner","project");
  assert.deepEqual(result.turns.map(t=>t.question),["Question first","Question second","Question third"]);
  assert.deepEqual(result.turns.map(t=>t.answer),["Answer first","Answer second","Answer third"]);
  assert.equal(result.trimmed,false);
});
test("saved edits replace the displayed answer but do not invent a new conversational turn",()=>{
  const result=studioConversation([row("first"),row("second","first"),row("edited","first",{parent_id:"second",content:"Edited second answer"}),row("third","edited")],"third","owner","project");
  assert.deepEqual(result.turns.map(t=>t.question),["Question first","Question second","Question third"]);
  assert.equal(result.turns[1].answer,"Edited second answer");
});
test("conversation ancestry never leaks another owner or project",()=>{
  for(const extra of [{owner_id:"other"},{project_id:"other"}]){
    const result=studioConversation([row("mine","foreign"),row("foreign",undefined,extra)],"mine","owner","project");
    assert.deepEqual(result.turns.map(t=>t.id),["mine"]);
    assert.equal(result.trimmed,true);
  }
});
test("cycles and missing ancestors are bounded without guessing related messages",()=>{
  const cycle=studioConversation([row("a","b"),row("b","a")],"a","owner","project");
  assert.equal(cycle.turns.length,2);
  assert.equal(cycle.trimmed,true);
  const missing=studioConversation([row("a","missing"),row("unrelated")],"a","owner","project");
  assert.deepEqual(missing.turns.map(t=>t.id),["a"]);
});
test("exact failed retries stay attached but failed scientific output is not reused",()=>{
  const failed=row("failed",undefined,{status:"failed",content:"Unchecked partial draft"});
  const request={projectId:"project",kind:"answer",prompt:"Question failed"};
  assert.equal(validStudioContext(failed,request),true);
  assert.equal(validStudioContext(failed,{...request,prompt:"Different question"}),false);
  assert.equal(validStudioContext(failed,{...request,projectId:"other"}),false);
  assert.equal(studioConversation([failed],"failed","owner","project").turns[0].answer,"");
});
test("every document kind anchors its own follow-ups and saved project screen",()=>{
  for(const kind of ["literature","synopsis","journal","thesis","patent","note"]){
    const seed=row("seed",undefined,{kind,metadata:{reviewSummary:'{"scope":"project-only","sharedWordingPercent":12}'}});
    const next=row("next","seed"),last=row("last","next");
    const {turns}=studioConversation([seed,next,last],"last","owner","project");
    assert.deepEqual(turns.map(t=>t.id),["seed","next","last"]);
    assert.match(turns[0].projectScreen!,/project-only/);
    assert.equal(turns[2].question,"Question last");
  }
});
test("AI Chat handoffs preserve earlier questions without making their answers new evidence",()=>{
  const saved=row("saved",undefined,{metadata:{analysisQuestion:"Last chat question",analysisHistory:[{question:"First chat question",answer:"Earlier reply"}]}});
  const {turns}=studioConversation([saved,row("follow","saved")],"follow","owner","project");
  assert.deepEqual(turns.map(t=>t.question),["First chat question","Last chat question","Question follow"]);
});
test("long model context is bounded without modifying persisted conversation rows",()=>{
  const rows=Array.from({length:20},(_,i)=>row(String(i),i?String(i-1):undefined,{content:"x".repeat(6000)}));
  const result=studioConversation(rows,"19","owner","project");
  assert.ok(result.turns.reduce((n,t)=>n+t.answer.length+(t.question?.length??0),0)<=20000);
  assert.equal(result.trimmed,true);
  assert.equal(rows[19].content.length,6000);
});
test("PostgreSQL reconstructs a saved chat through edited revisions and rejects wrong ownership",async()=>{
  const project=randomUUID(),owner=`conversation-test-${randomUUID()}`;
  const [first,edit,second,unrelated]=Array.from({length:4},()=>randomUUID());
  try{
    await pool.query("INSERT INTO research_accounts(id) VALUES($1)",[owner]);
    await pool.query("INSERT INTO research_projects(id,owner_id,name,description) VALUES($1,$2,'Synthetic conversation regression','Test fixture only')",[project,owner]);
    for(const [id,parent,request,content] of [
      [first,null,{prompt:"Project release requirements"},"Original release plan"],
      [edit,first,{prompt:"Project release requirements"},"Edited release requirements"],
      [second,null,{prompt:"Best M.Tech project",parentId:edit},"Project options"],
      [unrelated,null,{prompt:"Unrelated chat"},"Do not include this"],
    ]){
      await pool.query("INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,status,parent_id,metadata) VALUES($1,$2,$3,'answer','Synthetic message',$4,'completed',$5,$6)",[id,owner,project,content,parent,JSON.stringify({request})]);
    }
    const result=await loadStudioConversation(second,owner,project);
    assert.deepEqual(result.turns.map(t=>t.question),["Project release requirements","Best M.Tech project"]);
    assert.equal(result.turns[0].answer,"Edited release requirements");
    assert.equal(result.trimmed,false);
    assert.equal((await loadStudioConversation(second,"wrong-owner",project)).turns.length,0);
    assert.equal((await loadStudioConversation(second,owner,randomUUID())).turns.length,0);
  }finally{
    await pool.query("DELETE FROM research_studio_items WHERE project_id=$1 AND owner_id=$2",[project,owner]);
    await pool.query("DELETE FROM research_projects WHERE id=$1 AND owner_id=$2",[project,owner]);
    await pool.query("DELETE FROM research_accounts WHERE id=$1",[owner]);
  }
});
