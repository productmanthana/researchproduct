import test from "node:test";
import assert from "node:assert/strict";
import { alignDraft, checkedText } from "./plagiarism-align";
import { keywordQueries, distinctiveSentences } from "./plagiarism-sources";

const source = "Leading-edge erosion of wind turbine blades reduces annual energy production because roughness triggers early laminar to turbulent transition across the suction side. Field campaigns in coastal sites recorded measurable losses within five years of operation.";
test("plagiarism alignment flags verbatim copying as identical",async()=>{
  const r=await alignDraft(`# Intro\n\n${source}`,[{title:"Paper",origin:"scholarly",text:source}]);
  assert.ok(r.similarityPercent>90);assert.ok(r.breakdown.identical>90);assert.equal(r.sources[0].title,"Paper");
});
test("plagiarism alignment catches lightly edited wording",async()=>{
  const edited="Leading-edge erosion on wind turbine blade surfaces reduced the annual energy production, since roughness triggered an early laminar-to-turbulent transition over the suction side.";
  const r=await alignDraft(edited,[{title:"Paper",origin:"web",text:source}]);
  assert.ok(r.matchedWords>=8,`matched ${r.matchedWords}`);assert.equal(r.breakdown.identical,0);
});
test("plagiarism alignment confirms reworded paraphrase only with semantic agreement",async()=>{
  const para="Erosion at the front edge of turbine rotors cuts yearly power output, because surface roughness makes the boundary layer turn turbulent sooner on the suction side.";
  const yes=await alignDraft(para,[{title:"P",origin:"web",text:source}],async p=>p.map(()=>0.93));
  const no=await alignDraft(para,[{title:"P",origin:"web",text:source}],async p=>p.map(()=>0.5));
  assert.ok(yes.breakdown.paraphrased>0);assert.ok(yes.similarityPercent>no.similarityPercent);
});
test("plagiarism alignment ignores quotes, citations, references and short shared phrases",async()=>{
  const r=await alignDraft(`Our new method improves wind turbine blades in tests [1]. “${source}”\n\n## References\n\n${source}`,[{title:"Paper",origin:"scholarly",text:source}]);
  assert.equal(r.similarityPercent,0);assert.ok(r.excludedWords>30);
});
test("plagiarism source queries come from the draft content",()=>{
  const {masked}=checkedText(`# Blade erosion\n\n${source} ${source}`);
  assert.ok(keywordQueries(masked,"Blade erosion study")[0]==="Blade erosion study");
  assert.ok(distinctiveSentences(masked).length>0);
});
