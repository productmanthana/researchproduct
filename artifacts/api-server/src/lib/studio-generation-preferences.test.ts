import {test} from "node:test";
import assert from "node:assert/strict";
import {GenerateStudioDocumentBody} from "@workspace/api-zod";
import {generationCustomFormat,generationFiguresEnabled} from "./studio-generation-preferences";
import type {CustomFormat} from "./custom-format";

const format:CustomFormat={
  size:"LETTER",fontFamily:"sans",fontSize:10,lineSpacing:1.5,columns:2,
  margins:{top:54,right:54,bottom:54,left:54},citationStyle:"author-year",
  figureWidth:85,captionPosition:"below",figurePlacement:"inline",
  sectionOrder:["Abstract","Introduction","Methods","Discussion","Conclusion"],
  headingRenames:[],instructions:"Use the supplied journal's section order; do not invent research results.",
};
test("journal creation validates initial custom values and explicit figure choices",()=>{
  const request=GenerateStudioDocumentBody.parse({projectId:"project",kind:"journal",prompt:"Write a journal paper",evidenceMode:"combined",customFormat:format,includeFigures:false});
  assert.equal(request.customFormat?.columns,2);
  assert.equal(request.customFormat?.size,"LETTER");
  assert.equal(request.customFormat?.citationStyle,"author-year");
  assert.equal(request.includeFigures,false);
  assert.equal(generationCustomFormat(request,null),request.customFormat);
  assert.equal(GenerateStudioDocumentBody.parse({projectId:"project",kind:"journal",prompt:"Write a journal paper",evidenceMode:"combined"}).includeFigures,undefined);
  assert.throws(()=>GenerateStudioDocumentBody.parse({...request,customFormat:{...format,fontSize:40}}));
  assert.throws(()=>GenerateStudioDocumentBody.parse({...request,customFormat:{...format,margins:{...format.margins,left:1}}}));
});
test("follow-ups retain custom settings while explicit new target choices replace them",()=>{
  const parent={metadata:{customFormat:format,templateId:"earlier-journal"}};
  assert.deepEqual(generationCustomFormat({},parent,"earlier-journal"),format);
  assert.equal(generationCustomFormat({},parent,"different-journal"),undefined);
  const replacement={...format,columns:1 as const};
  assert.equal(generationCustomFormat({customFormat:replacement},parent,"different-journal"),replacement);
});
test("figure preference survives revisions and can be explicitly changed",()=>{
  assert.equal(generationFiguresEnabled({},null),true);
  assert.equal(generationFiguresEnabled({},{metadata:{includeFigures:false}}),false);
  assert.equal(generationFiguresEnabled({},{metadata:{request:{includeFigures:false}}}),false);
  assert.equal(generationFiguresEnabled({includeFigures:true},{metadata:{includeFigures:false}}),true);
});
