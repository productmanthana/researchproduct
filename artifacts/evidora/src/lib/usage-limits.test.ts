import { test } from "node:test";
import assert from "node:assert/strict";
import { usageLimitMessage, allUsageLimitMessages } from "./usage-limits";
import { markdownSections, replaceMarkdownSection } from "../pages/draft-markdown";
import { askSendDisabled } from "../pages/ask-workspace-state";
import { visibleRevisions } from "./latest-revisions";
import { chatDocumentIntent, chatDocumentPrompt } from "./chat-document";
import { requestErrorMessage, itemLoadFailure, isTemporaryRequestFailure, studioItemRefreshInterval } from "./request-errors";

test("Completed drafts recover from temporary failures without retrying deleted or unauthorised items", () => {
  const ready = { status: "completed", indexStatus: "indexed" };
  assert.equal(studioItemRefreshInterval(ready, null), false);
  for (const error of [new TypeError("Failed to fetch"), { status: 503 }, { status: 404, data: "<!DOCTYPE html><html>Gateway unavailable</html>" }]) {
    assert.equal(isTemporaryRequestFailure(error), true);
    assert.equal(studioItemRefreshInterval(ready, error), 10000);
    assert.equal(studioItemRefreshInterval(undefined, error), 10000);
  }
  for (const error of [{ status: 404, data: { error: "Item not found" } }, { status: 401 }, { status: 403 }, { status: 429 }]) {
    assert.equal(isTemporaryRequestFailure(error), false);
    assert.equal(studioItemRefreshInterval(ready, error), false);
  }
  assert.equal(studioItemRefreshInterval({ status: "running" }, null), 2500);
  assert.equal(studioItemRefreshInterval({ ...ready, indexStatus: "indexing" }, null), 5000);
});

test("Gateway HTML is not displayed as an error, but real API explanations are preserved", () => {
  const html = 'HTTP 404 Not Found: <!DOCTYPE html><html><head><title>This project is not available right now</title>';
  assert.equal(requestErrorMessage({ message: html }), "The service could not be reached. Please try again shortly.");
  assert.equal(requestErrorMessage({ data: { error: html } }), "The service could not be reached. Please try again shortly.");
  assert.equal(requestErrorMessage({ data: { error: "This document was deleted." } }), "This document was deleted.");
  assert.equal(requestErrorMessage(null, "Retry later"), "Retry later");
  assert.equal(itemLoadFailure(true).title, "Couldn't refresh this draft");
  assert.match(itemLoadFailure(true).message!, /last loaded version/);
  assert.equal(itemLoadFailure(false).title, "Couldn't open this item");
  assert.equal(itemLoadFailure(false).message, null);
});

test("AI Chat routes real writing assignments into document generation without requiring 'my references'",()=>{
  for(const text of ["Provide a journal paper on smart grid energy management","I told to write journal paper for submitting from my side","Write a research paper with coloured diagrams","Create an IEEE journal paper","Generate a manuscript on smart grids"]){
    assert.equal(chatDocumentIntent(text)?.kind,"journal",text);
    assert.equal(chatDocumentIntent(text)?.evidenceMode,"combined");
  }
  assert.equal(chatDocumentIntent("Write a thesis on smart grids")?.kind,"thesis");
  assert.equal(chatDocumentIntent("Generate literature survey on smart grids")?.kind,"literature");
  assert.equal(chatDocumentIntent("Prepare synopsis on smart grids")?.kind,"synopsis");
  assert.equal(chatDocumentIntent("Write a journal paper using my references")?.evidenceMode,"project");
  assert.equal(chatDocumentIntent("Provide a journal paper using the same sources")?.evidenceMode,"project");
  assert.equal(chatDocumentIntent("yes",[{question:"Write a journal paper on smart grids",answer:"Here is an outline"}])?.kind,"journal");
  for(const text of ["What is a journal paper?","How to write a journal paper?","Give me an outline for a journal paper","Find papers on smart grids","Don't write a journal paper yet","yes"])
    assert.equal(chatDocumentIntent(text),null,text);
});

test("AI Chat handoff preserves its topic and asks for an actual document with defensible diagrams",()=>{
  const prompt=chatDocumentPrompt("yes",[{question:"Write a journal paper on smart grid energy management",answer:"Use AI for load forecasting."}]);
  assert.match(prompt,/smart grid energy management/);
  assert.match(prompt,/actual developed document, not an outline/);
  assert.match(prompt,/diagrams with captions/);
  assert.match(prompt,/not fabricated empirical results/);
  assert.ok(chatDocumentPrompt("write a journal paper",Array.from({length:20},()=>({question:"q".repeat(5000),answer:"a".repeat(10000)}))).length<=5000);
});

test("library retains a Paper Review scorecard after an approved draft is created",()=>{
  const make=(id:string,parentId:string|null,kind:string,metadata:unknown={})=>({id,parentId,kind,metadata,createdAt:"2026-11-10T00:00:00Z"});
  const items=[make("report",null,"document-review",{paperReview:true}),make("draft","report","answer"),make("old",null,"journal"),make("new","old","journal")];
  const visible=visibleRevisions(items).map(i=>i.id);
  assert.ok(visible.includes("report"));assert.ok(visible.includes("draft"));
  assert.ok(!visible.includes("old"));assert.ok(visible.includes("new"));
});

test("Limit notices distinguish allowances, trials, unlimited accounts and shared budgets",()=>{
  const base={plan:"trial",period:"starter",answersUsed:3,answersLimit:3,reviewsUsed:0,reviewsLimit:1,imagesUsed:0,imagesLimit:2,paymentsEnabled:false,aiServiceRemainingInr:100};
  assert.match(usageLimitMessage(base,"answer")??"",/Answer limit reached.*one-time trial/);
  assert.equal(usageLimitMessage(base,"review"),null);
  assert.match(usageLimitMessage({...base,reviewsUsed:1},"review")??"",/Literature review limit reached/);
  assert.match(usageLimitMessage({...base,imagesUsed:2,period:"2026-11"},"image")??"",/Image analysis limit reached.*resets next month/);
  const unlimited={...base,answersLimit:-1,reviewsLimit:-1,imagesLimit:-1};
  assert.equal(allUsageLimitMessages(unlimited).length,0);
  assert.equal(allUsageLimitMessages({...unlimited,aiServiceRemainingInr:0}).length,1);
  assert.match(usageLimitMessage({...unlimited,aiServiceRemainingInr:0},"answer")??"",/including for unlimited accounts/);
  assert.equal(allUsageLimitMessages(undefined).length,0);
});
test("Editing a Markdown section preserves all unedited document and reference text byte-for-byte",()=>{
  const original="# Working research draft\n\n> Source-based draft.\n\n## Evidence-grounded synthesis\n\nFirst paragraph [1].\n\nSecond paragraph [2].\n\n## References\n\n[1] Actual source one.\n\n[2] Actual source two.";
  const sections=markdownSections(original);
  const evidence=sections.find(section=>section.title==="Evidence-grounded synthesis");
  const references=sections.find(section=>section.title==="References");
  assert.ok(evidence);assert.ok(references);
  assert.equal(replaceMarkdownSection(original,evidence,evidence.body),original);
  const edited=replaceMarkdownSection(original,evidence,`${evidence.body}\nAn authored paragraph.`);
  assert.ok(edited.startsWith(original.slice(0,evidence.bodyStart)));
  assert.ok(edited.endsWith(original.slice(evidence.bodyEnd)));
  assert.match(edited,/\[1\] Actual source one\.\n\n\[2\] Actual source two\.$/);
  assert.match(edited,/First paragraph \[1\]\.\n\nSecond paragraph \[2\]\.\nAn authored paragraph\./);
  assert.equal(original.includes("Authored paragraph"),false);
});
test("A reached answer limit remains actionable while other blocked sends stay disabled",()=>{
  assert.equal(askSendDisabled({limitReached:true,blocked:true,pending:false,loading:true}),false);
  assert.equal(askSendDisabled({limitReached:false,blocked:true,pending:false,loading:false}),true);
  assert.equal(askSendDisabled({limitReached:false,blocked:false,pending:true,loading:false}),true);
});
