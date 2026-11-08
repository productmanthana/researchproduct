import test from "node:test";
import assert from "node:assert/strict";
import { locateExact,applyTextSuggestion } from "./document-review";
import { CreateDocumentReviewBody,DecideDocumentReviewBody } from "@workspace/api-zod";
test("review changes replace only a uniquely located original passage",()=>{
  const original="Introduction\n\nThe methods is described here.\n\nResults remain unchanged: 42.";
  const change={originalText:"The methods is described here.",proposedText:"The methods are described here."};
  const result=applyTextSuggestion(original,change);
  assert.equal(result,"Introduction\n\nThe methods are described here.\n\nResults remain unchanged: 42.");
  assert.match(original,/methods is/);
  assert.throws(()=>applyTextSuggestion(result,change),/changed/);
  assert.equal(locateExact("repeat repeat","repeat"),null);
  assert.throws(()=>applyTextSuggestion("repeat repeat",{originalText:"repeat",proposedText:"changed"}),/more than once/);
  assert.equal(locateExact(original,"   "),null);
});
test("review request contracts constrain visual pages and require explicit decisions",()=>{
  const body={projectId:"project",documentId:"document",prompt:"Review text and diagrams"};
  assert.equal(CreateDocumentReviewBody.safeParse(body).success,true);
  assert.equal(CreateDocumentReviewBody.safeParse({...body,pageNumbers:[0]}).success,false);
  assert.equal(CreateDocumentReviewBody.safeParse({...body,pageNumbers:[51]}).success,false);
  assert.equal(CreateDocumentReviewBody.safeParse({...body,pageNumbers:Array(13).fill(1)}).success,false);
  assert.equal(DecideDocumentReviewBody.safeParse({suggestionId:"s",action:"approve"}).success,false);
  assert.equal(DecideDocumentReviewBody.safeParse({suggestionId:"s",action:"approve",expectedDraftId:null}).success,true);
  assert.equal(DecideDocumentReviewBody.safeParse({suggestionId:"s",action:"apply-all",expectedDraftId:null}).success,false);
});
