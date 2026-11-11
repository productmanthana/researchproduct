import test from "node:test";
import assert from "node:assert/strict";
import { customFormatSchema,customFormatContent,customFormatWarnings,customCitationExport,defaultCustomFormat } from "./custom-format";
import { documentLayout,documentLayoutFor } from "./studio-formatting";
import { importWordLayout,wordTemplateXml } from "./custom-format-import";
import { renderStudioWord } from "./studio-docx";
import { renderStudioPdf } from "./studio-pdf";
import { evaluateRequirements,boundRequirements } from "./submission-requirements";
const format=()=>defaultCustomFormat(documentLayout());
test("custom format validation rejects unsafe layout values and malformed heading changes",()=>{
  assert.equal(customFormatSchema.safeParse({...format(),fontSize:100}).success,false);
  assert.equal(customFormatSchema.safeParse({...format(),margins:{top:0,right:72,bottom:72,left:72}}).success,false);
  assert.equal(customFormatSchema.safeParse({...format(),headingRenames:[{from:"Introduction",to:""}]}).success,false);
  assert.equal(customFormatSchema.safeParse({...format(),instructions:"x".repeat(16001)}).success,false);
});
test("personal layout wins without changing the selected journal or claiming official compliance",()=>{
  const custom={...format(),size:"A4" as const,fontSize:14,columns:1 as const};
  const row={kind:"journal",content:"## Abstract\n\nA short abstract.\n",metadata:{templateId:"ieee-access",customFormat:custom,
    requirementsCheck:{status:"retrieved",templateId:"ieee-access",appliedLayout:{size:"LETTER",columns:2,fontSize:10}}}};
  assert.equal(documentLayoutFor(row).size,"A4");
  assert.equal(documentLayoutFor(row).fontSize,14);
  assert.equal(row.metadata.templateId,"ieee-access");
  assert.ok(customFormatWarnings(row,custom).some(s=>s.includes("Columns conflicts")));
  assert.ok(customFormatWarnings(row,custom).some(s=>s.includes("not automatically")));
  const source={status:"retrieved" as const,templateId:"ieee-access",text:"The manuscript must use two columns.",message:"Retrieved",coverage:"Partial"};
  const plan=boundRequirements(source,{layout:[{field:"columns",value:2,quote:"The manuscript must use two columns."}],rules:[]});
  assert.equal(evaluateRequirements(row,plan).checks.find(c=>c.label==="Number of columns")?.status,"missing");
});
test("section customisation renames and reorders existing text without deleting or inventing sections",()=>{
  const body="# My manuscript\n\n## Discussion\n\nKeep discussion.\n\n## Introduction\n\nKeep introduction.\n\n## Methods\n\nKeep methods.\n";
  const custom={...format(),sectionOrder:["Introduction","Methods","Discussion"],headingRenames:[{from:"Methods",to:"Proposed method"}]};
  const result=customFormatContent(body,custom,"My manuscript");
  assert.ok(result.startsWith("# My manuscript"));
  assert.ok(result.indexOf("## Introduction")<result.indexOf("## Proposed method"));
  assert.ok(result.indexOf("## Proposed method")<result.indexOf("## Discussion"));
  assert.ok(result.includes("Keep discussion."));
  assert.ok(result.includes("Keep introduction."));
});
test("end figures remain unique, before references, and limits warn without truncating text",()=>{
  const custom={...format(),figurePlacement:"end" as const,maxWords:100};
  const content=`## Methods\n\n${"word ".repeat(120)}\n\n[[figure:test-1]]\n\n## References\n\n[1] Source.\n`;
  const result=customFormatContent(content,custom);
  const twice=customFormatContent(result,custom);
  assert.equal((twice.match(/\[\[figure:test-1\]\]/g)??[]).length,1);
  assert.equal((twice.match(/^## Figures$/gm)??[]).length,1);
  assert.ok(twice.indexOf("[[figure:test-1]]")<twice.indexOf("## References"));
  assert.ok(customFormatWarnings({content,metadata:{}},custom).some(s=>s.includes("not truncated")));
});
test("author-year exports use only known source metadata and preserve reference URLs",()=>{
  const custom={...format(),citationStyle:"author-year" as const};
  const row={content:"## Introduction\n\nEarlier work [1].\n\n## References\n\n[1] A real source. https://example.org/paper",metadata:{customFormat:custom,sources:[{title:"A real source",authors:["Ada Smith"],year:2025,url:"https://example.org/paper"}]}};
  const result=customCitationExport(row);
  assert.ok(result.content.includes("(Smith, 2025)"));
  assert.ok(result.content.includes("https://example.org/paper"));
  assert.ok(row.content.includes("[1]."));
});
test("abstract limits still warn after the author renames the Abstract heading",()=>{
  const custom={...format(),maxAbstractWords:50,headingRenames:[{from:"Abstract",to:"Summary"}]};
  const content=`## Summary\n\n${"word ".repeat(80)}\n\n## Introduction\n\nA proposed study.`;
  assert.ok(customFormatWarnings({content,metadata:{}},custom).some(s=>s.includes("Abstract has 80 words")));
});
test("real Word and PDF exports use supported custom settings and Word import reads them",async()=>{
  const custom={...format(),size:"A4" as const,fontFamily:"sans" as const,fontSize:11,columns:2 as const,lineSpacing:1.5,
    margins:{top:50,right:60,bottom:55,left:65}};
  const row={kind:"journal",title:"Custom export",content:"## Abstract\n\nScientific text with α and β.\n\n## Introduction\n\nA proposed study, not measured findings.",metadata:{customFormat:custom,documentDetails:{author:"Test Author",affiliation:"Test Institute"}}};
  const word=await renderStudioWord(row),xml=await wordTemplateXml(word),imported=importWordLayout(xml);
  assert.equal(imported.format.size,"A4");
  assert.equal(imported.format.columns,2);
  assert.equal(imported.format.margins.left,65);
  assert.equal(imported.format.fontSize,11);
  assert.equal(imported.format.fontFamily,"sans");
  const pdf=await renderStudioPdf(row);
  assert.ok(pdf.subarray(0,8).toString().startsWith("%PDF-"));
  assert.match(pdf.toString("latin1"),/\/MediaBox\s*\[0 0 595\.28 841\.89\]/);
});
