import { test } from "node:test";
import assert from "node:assert/strict";
import { usageLimitMessage, allUsageLimitMessages } from "./usage-limits";

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
