import { test } from "node:test";
import assert from "node:assert/strict";
import { usageLimitMessage, allUsageLimitMessages } from "./usage-limits";
import { markdownSections, replaceMarkdownSection } from "../pages/draft-markdown";
import { askSendDisabled } from "../pages/ask-workspace-state";
import { visibleRevisions } from "./latest-revisions";

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
