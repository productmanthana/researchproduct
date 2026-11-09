import {test} from "node:test";
import assert from "node:assert/strict";
import {analysisReferenceEntries,parseReferences,referenceLinks,referenceSections,referenceLinkLabel,safeReferenceUrl} from "./references";

test("numbered references retain original numbers and wrapped author/title text",()=>{
  const refs=parseReferences("[2] A. Author (2025). A long\npaper title. Journal.\nhttps://doi.org/10.1234/example Evidence: Abstract only\n\n[7] Second reference https://example.com/paper.");
  assert.deepEqual(refs.map(r=>r.number),[2,7]);
  assert.equal(refs[0].citation,"A. Author (2025). A long paper title. Journal.");
  assert.equal(refs[0].href,"https://doi.org/10.1234/example");
  assert.equal(refs[0].evidence,"Abstract only");
  assert.equal(refs[1].href,"https://example.com/paper");
});
test("reference sections stop before later author-review notes without changing stored text",()=>{
  const content="# Report\n\nFindings [4].\n\n## References\n\n[4] A title. doi:10.1234/paper\n\n## Author review\n\nCheck the original.";
  const sections=referenceSections(content);
  assert.equal(sections.length,3);
  assert.equal(sections[1].kind,"references");
  assert.match(sections[2].content,/Author review/);
  assert.match(content,/\[4\] A title\. doi:10\.1234\/paper/);
});
test("Markdown, DOI-prefixed and plain links are supported, preserving valid DOI parentheses",()=>{
  const tokens=referenceLinks("Read [the paper](https://example.com/paper) and doi:10.1002/(SICI)1234. See https://example.com/x).");
  assert.equal(tokens.length,3);
  assert.equal(tokens[0].label,"the paper");
  assert.equal(tokens[1].href,"https://doi.org/10.1002/(SICI)1234");
  assert.equal(tokens[2].href,"https://example.com/x");
});
test("unsafe protocols, credential URLs and invalid links never become source actions",()=>{
  for(const url of ["javascript:alert(1)","data:text/html,hi","https://user:secret@example.com","not a URL"])
    assert.equal(safeReferenceUrl(url),undefined);
  assert.equal(referenceLinks("[bad](javascript:alert(1))").length,0);
});
test("stale source metadata cannot attach the wrong paper to an edited reference",()=>{
  assert.equal(parseReferences("[1] A newly edited reference.",[{title:"Unrelated old title",url:"https://example.com/wrong"}])[0].href,undefined);
  const ref=parseReferences("[1] Saved title.",[{title:"Saved title",url:"https://example.com/correct"}])[0];
  assert.equal(ref.title,"Saved title");
  assert.equal(ref.href,"https://example.com/correct");
});
test("a citation's actual URL takes precedence over stale metadata",()=>{
  const ref=parseReferences("[1] Saved title. https://example.com/new",[{title:"Saved title",url:"https://example.com/old"}])[0];
  assert.equal(ref.href,"https://example.com/new");
});
test("analysis references include every author and use only supplied publication details",()=>{
  const refs=analysisReferenceEntries([{title:"Actual paper",url:"https://doi.org/10.1234/p",paperId:"p",evidenceLevel:"Abstract only"}],[{id:"p",authors:["A","B","C","D","E"],year:2025,publisher:"Actual publisher"}]);
  assert.equal(refs[0].citation,"A, B, C, D, E (2025). Actual paper. Actual publisher.");
  assert.equal(refs[0].evidence,"Abstract only");
  assert.equal(analysisReferenceEntries([{title:"Unknown date",url:"bad"}])[0].citation,"Unknown date.");
});
test("malformed URI escapes cannot crash a DOI label",()=>{
  assert.equal(referenceLinkLabel("https://doi.org/10.1234/%XX"),"DOI: 10.1234/%XX");
});
test("ordered and unnumbered bibliographies remain readable without invented fields",()=>{
  assert.deepEqual(parseReferences("3. Third ref\n4. Fourth ref").map(r=>r.number),[3,4]);
  assert.equal(parseReferences("An author. A title.\n\nAnother author. Another title.").length,2);
  assert.equal(referenceSections("## References\n\n## Findings\n\nA claim.").some(s=>s.kind==="references"),false);
});
test("a diagram appended after a bibliography stays a renderable figure, not citation text",()=>{
  const sections=referenceSections("## References\n\n[1] A source https://example.com\n\n[[figure:diagram-1]]\n\nA figure caption.");
  assert.equal(sections[0].kind,"references");
  assert.equal(sections[0].content.includes("[[figure:"),false);
  assert.equal(sections[1].kind,"prose");
  assert.match(sections[1].content,/\[\[figure:diagram-1\]\]/);
});
