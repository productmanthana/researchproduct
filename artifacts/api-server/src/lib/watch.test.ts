import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, evidenceLabel, fingerprint, lexicalScore, publicationAgeLabel, publicationKey, topicTerms, type WatchCandidate } from "./watch-matching";

const candidate:WatchCandidate={key:"paper:1",kind:"paper",title:"Interpretable wind turbine pitch control",abstract:"A fuzzy controller for turbine pitch.",url:"https://doi.org/10.123/test",publishedAt:"2026-10-20",sourceId:"1"};
test("watch identifiers normalize DOI variants and separate patents",()=>{
  assert.equal(publicationKey("paper","https://doi.org/10.123/ABC","A"),publicationKey("paper","10.123/abc","B"));
  assert.notEqual(publicationKey("paper","123","A"),publicationKey("patent","123","A"));
  assert.equal(publicationKey("paper","","Wind — turbine", "2026"),publicationKey("paper","","wind turbine","2026"));
  assert.notEqual(publicationKey("paper","","wind turbine","2026"),publicationKey("paper","","wind turbine","2025"));
});
test("watch matching does not reward generic research language",()=>{
  assert.deepEqual(topicTerms("latest research study wind turbine wind"),["wind","turbine"]);
  assert.ok(lexicalScore("wind turbine pitch control",candidate)>lexicalScore("cancer immunotherapy",candidate));
  assert.equal(lexicalScore("research study",candidate),0);
});
test("semantic matching handles empty vectors safely",()=>{
  assert.equal(cosine([1,0],[1,0]),1);
  assert.equal(cosine([1,0],[0,1]),0);
  assert.equal(cosine([0,0],[1,0]),0);
  assert.equal(cosine([1],[]),0);
});
test("watch evidence labels never imply full text review",()=>{
  assert.match(evidenceLabel(candidate),/full text not reviewed/);
  assert.match(evidenceLabel({...candidate,abstract:""}),/provisional/);
});
test("publication age is separate from discovery age",()=>{
  const now=new Date("2026-11-08T12:00:00Z");
  assert.equal(publicationAgeLabel("2026-10-20",now),"Recent publication");
  assert.equal(publicationAgeLabel("2020-01-01",now),"Older publication newly found by this watch");
  assert.equal(publicationAgeLabel("",now),"Publication date not established");
  assert.equal(publicationAgeLabel("2027-01-01",now),"Reported publication date needs verification");
});
test("watch content hashes change with source evidence",()=>{
  assert.equal(fingerprint("same"),fingerprint("same"));
  assert.notEqual(fingerprint("title abstract"),fingerprint("title revised abstract"));
});
