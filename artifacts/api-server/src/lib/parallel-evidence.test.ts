import {test} from "node:test";
import assert from "node:assert/strict";
import {parallelEvidence} from "./parallel-evidence";

test("independent searches start together and preserve source category ordering",async()=>{
  const started:string[]=[];
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const pending=parallelEvidence({
    read:async()=>{started.push("read");await gate;return ["paper"];},
    patents:async()=>{started.push("patents");await gate;return ["patent"];},
    web:async()=>{started.push("web");await gate;return ["web"];},
  });
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(started,["read","patents","web"]);
  release();
  assert.deepEqual(await pending,{read:["paper"],patents:["patent"],web:["web"]});
});

test("failed reading waits for other searches to settle before allowance recovery",async()=>{
  let finishWeb!:()=>void,finished=false,failed=false;
  const gate=new Promise<void>(resolve=>{finishWeb=resolve;});
  const error=new Error("No readable scholarly evidence");
  const pending=parallelEvidence({
    read:async()=>{throw error;},
    patents:async()=>null,
    web:async()=>{await gate;finished=true;return {accounted:true};},
  });
  const outcome=pending.catch(e=>{failed=true;assert.equal(e,error);});
  await Promise.resolve();await Promise.resolve();
  assert.equal(failed,false);assert.equal(finished,false);
  finishWeb();await outcome;
  assert.equal(finished,true);assert.equal(failed,true);
});

test("synchronous retrieval errors cannot leave other requests unobserved",async()=>{
  let settled=false;
  await assert.rejects(parallelEvidence({
    read:()=>{throw new Error("Reader setup failed");},
    patents:async()=>{settled=true;return null;},
    web:async()=>null,
  }),/Reader setup failed/);
  assert.equal(settled,true);
});
