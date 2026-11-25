import test from "node:test";
import assert from "node:assert/strict";
import { SaveStudioItemBody } from "@workspace/api-zod";
import { THESIS_INSTRUCTIONS, THESIS_PLAN_TASK, THESIS_PART_WORDS, thesisCheckUnits,
  thesisParts, thesisContents, thesisEvidence, thesisTargetWords } from "./thesis-policy";
import { mapLimit, writeThesis } from "./thesis-writer";
import { HttpError } from "./common";

const chapters = Array.from({length:8},(_,i)=>({number:i+1,title:`Topic ${i+1}`,
  sections:Array.from({length:i===1?12:8},(_,j)=>`${i+1}.${j+1} Section ${j+1}`)}));
const plan = {title:"Synthetic thesis",blueprint:"Consistent research questions, symbols and proposed evaluation. ".repeat(8),chapters};

test("doctoral thesis parts cover each section once with bounded chapter calls",()=>{
  const parts=thesisParts(chapters);
  assert.ok(parts.reduce((n,p)=>n+p.words,0)>=70000);
  assert.ok(parts.length>=20);
  assert.ok(parts.every(p=>p.words<=THESIS_PART_WORDS));
  assert.equal(parts[0].id,"front");
  assert.equal(parts.at(-1)?.id,"appendix");
  for(const chapter of chapters)for(const section of chapter.sections){
    const listed=parts.filter(p=>p.brief.includes(`: ${section};`)||p.brief.includes(`; ${section};`)||p.brief.includes(`; ${section}.`)||p.brief.includes(`: ${section}.`));
    assert.equal(listed.length,1,section);
  }
  assert.match(parts.filter(p=>p.id.startsWith("ch2-")).at(-1)!.brief,/2\.13 Chapter Summary/);
  assert.ok(parts.filter(p=>p.id.startsWith("ch8-")).every(p=>!p.brief.includes("Close with")));
  assert.ok(thesisParts(chapters,100000).every(p=>p.words<=THESIS_PART_WORDS));
});

test("shorter page and word assignments keep their requested targets",()=>{
  assert.equal(thesisTargetWords("Write three pages on solar storage"),1200);
  assert.equal(thesisTargetWords("Write a 20-page thesis draft"),8000);
  assert.equal(thesisTargetWords("Write 12000 words"),12000);
  assert.equal(thesisTargetWords("Write a doctoral thesis",9000),9000);
  assert.equal(thesisTargetWords("Write a doctoral thesis"),73500);
  assert.ok(thesisParts(chapters,12000).reduce((n,p)=>n+p.words,0)<=12020);
});

test("thesis contents uses actual headings and captions, not sentences mentioning figures",()=>{
  const content="# Declaration\n\nAuthor completion required.\n\n# Chapter 1: Introduction\n\n## 1.1 Background\n\nTable 1.1 shows a result.\n\n**Table 1.1.** Actual caption\n\n# Chapter 2: Review\n\nFigure 2.1 shows a process.\n\n**Figure 2.1.** Real figure caption";
  const contents=thesisContents(content,["Figure 1: Evidence-grounded method"]);
  assert.match(contents,/# Table of Contents/);
  assert.match(contents,/  - 1\.1 Background/);
  assert.match(contents,/# List of Tables\n\n- Table 1\.1: Actual caption/);
  assert.match(contents,/- Figure 1: Evidence-grounded method/);
  assert.doesNotMatch(contents,/shows a result|shows a process|- Declaration/);
});

test("thesis claim checks have a hard bound even for a single oversized section",()=>{
  const content=`# Chapter 1: Review\n\n## 1.1 Evidence\n\n${"evidence ".repeat(11000)}\n\n# Chapter 2: Method\n\nPreserve this.`;
  const units=thesisCheckUnits(content,3500);
  assert.ok(units.length>=5);
  assert.ok(units.every(u=>u.split(/\s+/).filter(Boolean).length<=3500));
  assert.equal(units.join(" ").match(/\bevidence\b/g)?.length,11000);
  assert.match(units.join("\n"),/Preserve this\./);
  assert.throws(()=>thesisCheckUnits(content,0));
});

test("thesis evidence keeps distinct papers before multiple pages of the same paper",()=>{
  const input=[...Array.from({length:8},(_,i)=>({id:`p1-${i}`,paperId:"p1"})),
    ...Array.from({length:6},(_,i)=>({id:`other-${i}`,paperId:`paper-${i}`}))];
  const bounded=thesisEvidence(input,7);
  assert.equal(new Set(bounded.map(s=>s.paperId)).size,7);
  assert.equal(input.length,14);
  assert.match(THESIS_INSTRUCTIONS,/Never fabricate/);
  assert.match(THESIS_INSTRUCTIONS,/\[RESULT PENDING:/);
  assert.match(THESIS_INSTRUCTIONS,/incomplete/);
});

test("long thesis revisions fit the save contract without dropping chapters",()=>{
  const input={projectId:"synthetic-project",kind:"thesis",title:"Large thesis",content:"x".repeat(800000)};
  assert.ok(SaveStudioItemBody.safeParse(input).success);
  assert.equal(SaveStudioItemBody.safeParse({...input,content:"x".repeat(1000001)}).success,false);
});

test("thesis concurrency is bounded, input-ordered and stops scheduling after failure",async()=>{
  let active=0,max=0;
  const out=await mapLimit([0,1,2,3,4],2,async n=>{
    active++;max=Math.max(max,active);
    await new Promise(resolve=>setTimeout(resolve,(5-n)*2));
    active--;return n*2;
  });
  assert.deepEqual(out,[0,2,4,6,8]);
  assert.equal(max,2);
  let started=0;
  await assert.rejects(mapLimit([0,1,2,3,4],2,async n=>{
    started++;if(n===0)throw new Error("stop");
    await new Promise(resolve=>setTimeout(resolve,10));return n;
  }),/stop/);
  assert.equal(started,2);
  await assert.rejects(mapLimit([1],0,async n=>n),/Invalid concurrency/);
});

test("complete thesis orchestration assembles ordered parts and monotonic live drafts without paid calls",async()=>{
  const parts=thesisParts(chapters),snapshots:{done:number;draft:string}[]=[];
  const result=await writeThesis({prompt:"Untrusted context stays evidence.",body:[],onPart:(done,_total,_heading,draft)=>{
    snapshots.push({done,draft});
  },call:async(system)=>{
    if(system.includes(THESIS_PLAN_TASK))return {value:plan};
    const i=parts.findIndex(p=>system.includes(`Write only this thesis part: ${p.heading}.`));
    assert.ok(i>=0);
    await new Promise(resolve=>setTimeout(resolve,i===0?15:1));
    return {value:{content:`PART_${i}\n${i===0?"[[contents]]\n":""}${"Synthetic source-grounded placeholder prose. ".repeat(8)}`}};
  }});
  assert.equal(result.title,plan.title);
  assert.equal([...result.content.matchAll(/PART_(\d+)/g)].length,parts.length);
  assert.match(result.content,/# Table of Contents/);
  assert.doesNotMatch(result.content,/\[\[contents\]\]/);
  for(const snapshot of snapshots){
    const indices=[...snapshot.draft.matchAll(/PART_(\d+)/g)].map(m=>Number(m[1]));
    assert.deepEqual(indices,indices.map((_,i)=>i),"never show later chapters before the earlier ones");
  }
  assert.deepEqual(snapshots.map(s=>s.done),parts.map((_,i)=>i+1));
});

test("thesis retries malformed blueprints once, but not rejected or budget-exhausted calls",async()=>{
  let calls=0;
  await assert.rejects(writeThesis({prompt:"",body:[],call:async()=>{
    calls++;return {value:{...plan,chapters:[...chapters].reverse()}};
  }}));
  assert.equal(calls,2);
  calls=0;
  await assert.rejects(writeThesis({prompt:"",body:[],call:async()=>{
    calls++;throw new HttpError(429,"Budget exhausted");
  }}),/Budget exhausted/);
  assert.equal(calls,1);
});
