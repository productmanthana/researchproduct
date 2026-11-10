import test from "node:test";
import assert from "node:assert/strict";
import { prepareExportReferences, parseExportReference } from "./export-references";
import { documentBlocks } from "./studio-formatting";
import { renderStudioPdf } from "./studio-pdf";
import { renderStudioWord } from "./studio-docx";
import mammoth from "mammoth";

const title="Study of blade overlap variation and turbine power";
const row={
  kind:"journal",title:"Reference formatting regression",
  content:`## Findings\n\nOne result [1] and another excerpt [2] come from the same paper. Compare [2, 3] and [1–3].\n\n## References\n\n[1] Nur Afni, Sudirman Syam (2026). ${title} — page 4. Media Elektro https://ejurnal.example.org/article/download/30198/10714#page=4\nEvidence: Retrieved PDF text (cc-by-sa); page 4\n\n[2] Nur Afni, Sudirman Syam (2026). ${title} — page 3. Media Elektro https://ejurnal.example.org/article/download/30198/10714#page=3\nEvidence: Retrieved PDF text (cc-by-sa); page 3\n\n[3] A. Researcher (2025). Independent turbine study. Journal of Energy https://doi.org/10.1000/example\nEvidence: Abstract only\n\n## Author review\n\nVerify the evidence.`,
  metadata:{sources:[{paperId:"same-paper",title:`${title} — page 4`},{paperId:"same-paper",title:`${title} — page 3`},{paperId:"other",title:"Independent turbine study"}],
    figures:[{id:"fig-example",kind:"diagram",caption:"Related work [2, 3]",explanation:"Refer to [2].",provenance:"Reference [3]",sourceQuote:"Original quotation [2] must remain unchanged."}]},
};

test("export bibliography merges paper pages and remaps body and figure references without changing stored evidence",()=>{
  const original=JSON.stringify(row),prepared=prepareExportReferences(row);
  assert.equal(JSON.stringify(row),original);
  assert.match(prepared.content,/One result \[1\] and another excerpt \[1\]/);
  assert.match(prepared.content,/Compare \[1, 2\] and \[1, 2\]/);
  const bibliography=prepared.content.split("## References")[1].split("## Author review")[0];
  assert.equal([...bibliography.matchAll(/^\[\d+\]/gm)].length,2);
  assert.doesNotMatch(bibliography,/Evidence:|— page|#page=/);
  assert.match(bibliography,/\[View source\]\(https:\/\/ejurnal\.example\.org/);
  assert.match(bibliography,/\[DOI: 10\.1000\/example\]/);
  assert.equal(prepared.metadata.figures[0].caption,"Related work [1, 2]");
  assert.equal(prepared.metadata.figures[0].sourceQuote,row.metadata.figures[0].sourceQuote);
  assert.deepEqual(prepared.metadata.sources,row.metadata.sources);
  assert.equal(prepareExportReferences(prepared).content,prepared.content);
});

test("bibliography parser handles flattened Markdown links and never turns unsafe URLs into hyperlinks",()=>{
  const prepared=prepareExportReferences(row);
  const block=documentBlocks(prepared.content).find(b=>b.kind==="paragraph"&&b.text.startsWith("[1]"));
  assert.ok(block&&block.kind==="paragraph");
  const entry=parseExportReference(block.text)!;
  assert.equal(entry.linkLabel,"View source");
  assert.doesNotMatch(entry.citation,/View source|https:|\(\)/);
  assert.equal(entry.href,"https://ejurnal.example.org/article/download/30198/10714");
  assert.equal(parseExportReference("[1] Paper. [View source](javascript:alert(1))")?.href,undefined);
  const distinct=prepareExportReferences({content:"## References\n\n[1] First paper. https://example.org/one\n\n[2] Second paper. https://example.org/two"});
  assert.match(distinct.content,/^\[2\]/m);
});

test("PDF and Word reference lists have real hyperlinks and no retrieval-status clutter",async()=>{
  const exportRow={...row,metadata:{...row.metadata,figures:[]}};
  const pdf=await renderStudioPdf(exportRow);
  assert.match(pdf.toString("latin1"),/\/Subtype \/Link/);
  assert.match(pdf.toString("latin1"),/https:\/\/ejurnal\.example\.org\/article\/download\/30198\/10714/);
  assert.doesNotMatch(pdf.toString("latin1"),/#page=/);
  const word=await renderStudioWord(exportRow),html=(await mammoth.convertToHtml({buffer:word})).value;
  assert.match(html,/<a href="https:\/\/doi.org\/10.1000\/example">DOI:/);
  assert.match(html,/View source<\/a>/);
  assert.doesNotMatch(html,/Evidence:|Retrieved PDF text|— page [34]/);
  assert.equal((html.match(/Nur Afni/g)??[]).length,1);
});
