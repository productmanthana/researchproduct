import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFormula,validateFigure,figureCsv,referencedFigures } from "./scientific-figures";
import { figureSvg,figurePng } from "./figure-renderer";
import { documentBlocks } from "./studio-formatting";
import { renderStudioWord } from "./studio-docx";
import { renderStudioPdf } from "./studio-pdf";
import mammoth from "mammoth";

const table="Speed (m/s),Power (kW)\n3,12\n4,26\n5,45";
const sources=[{id:"request",title:"user-supplied observations",text:`Measurements:\n${table}`}];
const chart={title:"Power versus wind speed",caption:"Supplied example measurements; not independently verified.",kind:"line",sourceId:"request",sourceQuote:table,separator:",",xColumn:0,yColumns:[1],xLabel:"Speed (m/s)",yLabel:"Power (kW)"};
test("figures copy numerical cells exactly and preserve source provenance",()=>{
  const f=validateFigure(chart,sources,"fig-test");
  assert.deepEqual(f.series?.[0].points,[{x:3,y:12},{x:4,y:26},{x:5,y:45}]);
  assert.match(f.provenance,/user-supplied observations/);
  assert.match(figureCsv(f),/"3","12"/);
  assert.throws(()=>validateFigure({...chart,sourceQuote:table.replace("45","99")},sources,"bad"),/source text/);
  assert.throws(()=>validateFigure({...chart,yColumns:[0]},sources,"bad"),/column/);
});
test("missing data and unordered line inputs are rejected rather than invented",()=>{
  const bad=table.replace("4,26","4,NA");
  assert.throws(()=>validateFigure({...chart,sourceQuote:bad},[{...sources[0],text:bad}],"bad"),/Non-numeric/);
  const reversed=table.replace("3,12\n4,26","4,26\n3,12");
  assert.throws(()=>validateFigure({...chart,sourceQuote:reversed},[{...sources[0],text:reversed}],"bad"),/increasing/);
});
test("formula parser implements precedence, functions and rejects executable code and undefined values",()=>{
  assert.equal(evaluateFormula("-x^2 + 2*x",3),-3);
  assert.equal(evaluateFormula("2^3^2",0),512);
  assert.equal(evaluateFormula("sqrt(x)+abs(-2)",9),5);
  assert.ok(Math.abs(evaluateFormula("sin(pi/2)",0)-1)<1e-9);
  for(const bad of ["process.exit()","x.constructor","1/0","sqrt(-1)","x;console.log(1)","exp(99999)"])assert.throws(()=>evaluateFormula(bad,1));
});
test("theoretical curves require exact sourced equations and are calculated, not sampled by AI",()=>{
  const src=[{id:"request",title:"user equation",text:"Use y = 2*x^2 over 0 to 4."}];
  const f=validateFigure({title:"Theoretical curve",caption:"Specified polynomial.",kind:"theory",sourceId:"request",sourceQuote:src[0].text,expression:"2*x^2",range:{min:0,max:4},xLabel:"x (dimensionless)",yLabel:"y (dimensionless)"},src,"fig-theory");
  assert.equal(f.series![0].points.length,101);
  assert.equal(f.series![0].points[100].y,32);
  assert.match(f.provenance,/not measured/);
  assert.throws(()=>validateFigure({...chart,kind:"theory",expression:"3*x",range:{min:0,max:4}},sources,"bad"),/Formula must occur/);
});
test("diagram connections are validated and labels cannot inject SVG",async()=>{
  const f=validateFigure({kind:"diagram",title:"<script>alert(1)</script>",caption:"Proposed only",nodes:[{id:"a",label:"Input <data>"},{id:"b",label:"Review"}],edges:[{from:"a",to:"b"}]},[],"fig-diagram");
  assert.match(f.provenance,/Conceptual/);
  const svg=figureSvg(f);assert.ok(!svg.includes("<script>"));assert.match(svg,/&lt;script&gt;/);
  const png=await figurePng(f);assert.equal(png.subarray(1,4).toString(),"PNG");
  assert.throws(()=>validateFigure({kind:"diagram",title:"Bad",caption:"Bad",nodes:[{id:"a",label:"Input"},{id:"b",label:"Output"}],edges:[{from:"a",to:"missing"}]},[],"bad"),/connections/);
});
test("figure markers preserve order and missing figures block export",()=>{
  const f=validateFigure(chart,sources,"fig-test");
  assert.equal(documentBlocks("Before\n[[figure:fig-test]]\nAfter")[1].kind,"figure");
  assert.deepEqual(referencedFigures("[[figure:fig-test]]\n[[figure:fig-test]]",[f]),[f]);
  assert.throws(()=>referencedFigures("[[figure:missing]]",[f]),/missing/);
});
test("illustrated diagrams retain role colours, layout, feedback and escaped explanatory labels",async()=>{
  for(const layout of ["process","neural","cycle","system","taxonomy"] as const){
    const f=validateFigure({kind:"diagram",layout,title:"Proposed training <architecture>",caption:"Conceptual illustration only.",
      explanation:"Blue identifies input data; the dashed return path represents the proposed update step.",
      nodes:[{id:"input",label:"Input signals",role:"input",icon:"sensor",description:"User-supplied signals; no measured outcomes."},
        {id:"model",label:"Model learning",role:"process",icon:"network"},{id:"output",label:"Evaluation",role:"output",icon:"target"}],
      edges:[{from:"input",to:"model",label:"Input data"},{from:"model",to:"output"},{from:"output",to:"model",role:"feedback",label:"Update"}]},[],"fig-illustrated");
    assert.equal(f.layout,layout);assert.match(f.explanation!,/Blue/);
    const svg=figureSvg(f);assert.match(svg,/&lt;architecture&gt;/);assert.match(svg,/Feedback \/ revision/);
    assert.match(svg,/stroke-dasharray="8 5"/);assert.match(svg,/<polygon points=/);assert.match(svg,/#1e6683/);assert.match(svg,/#65508a/);
    assert.match(svg,/Scientific|Conceptual/);assert.doesNotMatch(svg,/<script|NaN|undefined/);
    const png=await figurePng(f);assert.equal(png.subarray(1,4).toString(),"PNG");
  }
});
test("Word and PDF contain real embedded image figures with numbered captions",async()=>{
  const f={...validateFigure(chart,sources,"fig-test"),explanation:"Supplied wind speed measurements are plotted without inferred values."};
  const row={title:"Scientific figure export",kind:"answer",content:"## Findings\nSupplied observations appear in Figure 1.\n\n[[figure:fig-test]]",metadata:{figures:[f]}};
  const word=await renderStudioWord(row);
  const converted=await mammoth.convertToHtml({buffer:word});
  assert.match(converted.value,/<img /);
  assert.match(converted.value,/Figure 1/);
  assert.match(converted.value,/without inferred values/);
  assert.doesNotMatch(converted.value,/\[\[figure:/);
  const pdf=await renderStudioPdf(row);
  assert.match(pdf.toString("latin1"),/\/Subtype \/Image/);
});
test("two-column journals export scientific figures across the full page width",async()=>{
  const f=validateFigure({kind:"diagram",layout:"system",title:"Proposed sensor system",caption:"Conceptual, not measured.",
    nodes:[{id:"a",label:"Input",role:"input"},{id:"b",label:"Output",role:"output"}],edges:[{from:"a",to:"b"}]},[],"fig-wide");
  const row={title:"Wide figure export",kind:"journal",content:"## Method\nProposed method.\n\n[[figure:fig-wide]]\n\n## Discussion\nNo experiment results.",metadata:{templateId:"ieee-access",figures:[f]}};
  const word=await renderStudioWord(row),converted=await mammoth.convertToHtml({buffer:word});
  assert.match(converted.value,/<img /);assert.match(converted.value,/No experiment results/);
  const pdf=await renderStudioPdf(row);assert.match(pdf.toString("latin1"),/\/Subtype \/Image/);
});
