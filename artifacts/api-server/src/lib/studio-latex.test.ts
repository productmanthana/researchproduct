import {test} from "node:test";
import assert from "node:assert/strict";
import {inflateRawSync} from "node:zlib";
import {latexProse,renderStudioLatex} from "./studio-latex";
import {acceptableRevision} from "./peer-review-loop";

/** Reads entries from a ZIP written by zipFiles (deflate, local headers). */
function unzip(zip:Buffer){
  const files:Record<string,string>={};let at=0;
  while(zip.readUInt32LE(at)===0x04034b50){
    const size=zip.readUInt32LE(at+18),nameLength=zip.readUInt16LE(at+26),start=at+30+nameLength;
    files[zip.subarray(at+30,start).toString()]=inflateRawSync(zip.subarray(start,start+size)).toString();
    at=start+size;
  }
  return files;
}

test("escapes LaTeX specials and converts numbered citations",()=>{
  assert.equal(latexProse("50% of R&D_x costs $5 [1], see [2, 4]."),"50\\% of R\\&D\\_x costs \\$5 \\cite{ref1}, see \\cite{ref2,ref4}.");
  assert.equal(latexProse("T ≥ 40 °C"),"T \\ensuremath{\\geq} 40 \\ensuremath{^\\circ}C");
});

test("renders a draft as main.tex with abstract, sections, table and bibliography",async()=>{
  const row={kind:"journal",title:"Blade drag",metadata:{documentDetails:{author:"A. Rao"}},content:"# Blade drag\n\n## Abstract\n\nDrag falls by 12% [1].\n\n## Introduction\n\nPrior work [1].\n\n| Case | Cd |\n|---|---|\n| A | 0.3 |\n\n## References\n\n[1] Smith (2020). Wind blades. https://doi.org/10.1/x\nEvidence: abstract\n\n## Author review\n\nAI-assisted working draft."};
  const tex=unzip(await renderStudioLatex(row))["main.tex"];
  assert.match(tex,/\\begin\{abstract\}\nDrag falls by 12\\% \\cite\{ref1\}\.[\s\S]*\\end\{abstract\}/);
  assert.match(tex,/\\section\{Introduction\}/);
  assert.match(tex,/A & 0\.3 \\\\/);
  assert.match(tex,/\\bibitem\{ref1\} [^\n]*Wind blades/);
  assert.match(tex,/\\author\{A\. Rao\}/);
  assert.doesNotMatch(tex,/\\section\{(References|Author review|Blade drag)\}/);
});

test("peer-review revisions must stay complete, keep figures and cite real sources",()=>{
  const before="Text [1] and [2]. [[figure:f1]] More words here to keep length.";
  assert.equal(acceptableRevision(before,"Better text [1] and [3]. [[figure:f1]] More words here, kept.",3),true);
  assert.equal(acceptableRevision(before,"Better text [4]. [[figure:f1]] More words here to keep length.",3),false);
  assert.equal(acceptableRevision(before,"Text [1] and [2]. More words here to keep the length okay.",3),false);
  assert.equal(acceptableRevision(before,"Short [1].",3),false);
});
