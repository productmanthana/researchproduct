import { z } from "zod";

const short=z.string().min(1).max(180);
const diagramRole=z.enum(["input","process","output","feedback","evidence"]);
const diagramIcon=z.enum(["data","document","sensor","network","compute","experiment","compare","target","knowledge"]);
const diagramNode=z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,30}$/),label:short,
  role:diagramRole.optional(),icon:diagramIcon.optional(),description:z.string().max(120).optional()});
export const FigureProposal=z.object({
  title:short,caption:z.string().min(1).max(1200),
  kind:z.enum(["diagram","line","bar","scatter","theory"]),
  replacesId:z.string().regex(/^fig-[a-zA-Z0-9_-]+$/).optional(),
  sourceId:z.string().max(150).optional(),sourceQuote:z.string().max(20000).optional(),
  xLabel:short.optional(),yLabel:short.optional(),
  separator:z.enum([",","|","\t"]).optional(),
  xColumn:z.number().int().min(0).max(30).optional(),
  yColumns:z.array(z.number().int().min(0).max(30)).min(1).max(4).optional(),
  expression:z.string().min(1).max(300).optional(),
  range:z.object({min:z.number().finite(),max:z.number().finite()}).optional(),
  layout:z.enum(["process","neural","cycle","system","taxonomy"]).optional(),
  explanation:z.string().max(1800).optional(),
  nodes:z.array(diagramNode).min(2).max(9).optional(),
  edges:z.array(z.object({from:z.string(),to:z.string(),label:z.string().max(50).optional(),role:z.enum(["flow","feedback"]).optional()})).max(16).optional(),
});
export type FigureProposalType=z.infer<typeof FigureProposal>;
export type FigureSource={id:string;title:string;text:string};
export type ScientificFigure={
  id:string;title:string;caption:string;kind:FigureProposalType["kind"]|"original";provenance:string;
  sourceId?:string;sourceQuote?:string;xLabel?:string;yLabel?:string;
  series?:{name:string;points:{x:number|string;y:number}[]}[];
  expression?:string;range?:{min:number;max:number};
  layout?:FigureProposalType["layout"];explanation?:string;
  nodes?:z.infer<typeof diagramNode>[];edges?:{from:string;to:string;label?:string;role?:"flow"|"feedback"}[];
  svgPath?:string;pngPath?:string;
  replacesId?:string;
  width?:number;height?:number;
};
const normal=(s:string)=>s.replace(/\s+/g," ").trim();
const numeric=(s:string)=>/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s.trim())&&Number.isFinite(Number(s))&&Math.abs(Number(s))<=1e100;

/** A deliberately small arithmetic grammar. No eval, property access or executable code. */
export function evaluateFormula(expression:string,x:number):number {
  const tokens=expression.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+*/^,-]/gi)??[];
  if(tokens.join("")!==expression.replace(/\s+/g,"")||tokens.length>128)throw new Error("Unsupported formula syntax.");
  let i=0;
  const functions:Record<string,(n:number)=>number>={sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,sqrt:Math.sqrt,abs:Math.abs};
  const atom=():number=>{
    const t=tokens[i++];
    if(t==="("){const n=sum();if(tokens[i++]!==")")throw new Error("Unbalanced formula.");return n;}
    if(t==="x")return x;
    if(t==="pi")return Math.PI;
    if(t==="e")return Math.E;
    if(t&&Object.hasOwn(functions,t)){if(tokens[i++]!=="(")throw new Error("Function needs parentheses.");const n=sum();if(tokens[i++]!==")")throw new Error("Unbalanced function.");return functions[t](n);}
    if(t&&numeric(t))return Number(t);
    throw new Error("Unsupported formula token.");
  };
  const power=():number=>{let n=atom();if(tokens[i]==="^"){i++;n=Math.pow(n,unary());}return n;};
  const unary=():number=>{if(tokens[i]==="+"){i++;return unary();}if(tokens[i]==="-"){i++;return -unary();}return power();};
  const product=():number=>{let n=unary();while(tokens[i]==="*"||tokens[i]==="/"){const t=tokens[i++],v=unary();n=t==="*"?n*v:n/v;}return n;};
  const sum=():number=>{let n=product();while(tokens[i]==="+"||tokens[i]==="-"){const t=tokens[i++],v=product();n=t==="+"?n+v:n-v;}return n;};
  const result=sum();
  if(i!==tokens.length||!Number.isFinite(result)||Math.abs(result)>1e100)throw new Error("Formula is undefined or outside supported bounds.");
  return result;
}

/** Plot coordinates are copied/calculated by code, never supplied by the model. */
export function validateFigure(input:unknown,sources:FigureSource[],id:string):ScientificFigure {
  const p=FigureProposal.parse(input);
  const base:ScientificFigure={id,title:p.title,caption:p.caption,kind:p.kind,provenance:"",...(p.replacesId?{replacesId:p.replacesId}:{})};
  if(p.kind==="diagram"){
    if(!p.nodes||!p.edges)throw new Error("Diagram requires nodes and connections.");
    if(p.layout==="cycle"&&p.nodes.length>6)throw new Error("Use at most six stages in a cycle for readable labels, or choose a process layout.");
    if(p.nodes.some(n=>n.label.length>80))throw new Error("Shorten diagram labels to 80 characters for readable rendering.");
    const ids=new Set(p.nodes.map(n=>n.id));
    if(ids.size!==p.nodes.length||p.edges.some(e=>!ids.has(e.from)||!ids.has(e.to)||e.from===e.to))throw new Error("Invalid diagram connections.");
    const source=sources.find(s=>s.id===p.sourceId);
    if((p.sourceId||p.sourceQuote)&&(!source||!p.sourceQuote||!normal(source.text).includes(normal(p.sourceQuote))))throw new Error("Exact source text for this diagram was not found.");
    return {...base,layout:p.layout??"process",explanation:p.explanation,nodes:p.nodes,edges:p.edges,
      ...(source?{sourceId:source.id,sourceQuote:p.sourceQuote}:{}),
      provenance:"Conceptual / proposed schematic — not an experimental observation."+(source?` Based on supplied source: ${source.title}.`:"")};
  }
  const source=sources.find(s=>s.id===p.sourceId);
  if(!source||!p.sourceQuote||!normal(source.text).includes(normal(p.sourceQuote)))throw new Error("Exact source text for this figure was not found.");
  base.sourceId=source.id;base.sourceQuote=p.sourceQuote;
  if(!p.xLabel||!p.yLabel)throw new Error("Both axis labels and units are required.");
  base.xLabel=p.xLabel;base.yLabel=p.yLabel;
  if(p.kind==="theory"){
    if(!p.expression||!p.range||p.range.min>=p.range.max||!Number.isFinite(p.range.max-p.range.min))throw new Error("A valid formula and finite increasing range are required.");
    if(!p.sourceQuote.replace(/\s+/g,"").includes(p.expression.replace(/\s+/g,"")))throw new Error("Formula must occur exactly in the supplied source.");
    const points=Array.from({length:101},(_,i)=>{const x=p.range!.min+(p.range!.max-p.range!.min)*i/100;return {x,y:evaluateFormula(p.expression!,x)};});
    return {...base,expression:p.expression,range:p.range,series:[{name:p.yLabel,points}],
      provenance:`Theoretical calculation from ${source.title}; y = ${p.expression}. Plotting range ${p.range.min}–${p.range.max}; 101 calculated samples, not measured results. Range is a plotting choice; verify assumptions and units.`};
  }
  if(p.xColumn===undefined||!p.yColumns||!p.separator)throw new Error("Choose source table columns.");
  // Headers plus complete rows; do not silently skip missing/invalid cells.
  const rows=p.sourceQuote.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    .filter(s=>! /^\|?[\s:|-]+\|?$/.test(s))
    .map(s=>(p.separator==="|"?s.replace(/^\|/,"").replace(/\|$/,""):s).split(p.separator!).map(s=>s.trim().replace(/^"(.*)"$/,"$1")));
  if(rows.length<3||rows.length>201)throw new Error("Supply a header and between 2 and 200 data rows.");
  const header=rows[0],data=rows.slice(1);
  if(p.yColumns.includes(p.xColumn)||new Set(p.yColumns).size!==p.yColumns.length||[p.xColumn,...p.yColumns].some(c=>c>=header.length))throw new Error("Invalid table column selection.");
  if(data.some(r=>r.length!==header.length))throw new Error("Table rows have inconsistent columns.");
  const series=p.yColumns.map(c=>({name:header[c],points:data.map(r=>{
    if(!numeric(r[c]))throw new Error("Non-numeric or missing result cell; no values were invented.");
    const x=numeric(r[p.xColumn!])?Number(r[p.xColumn!]):r[p.xColumn!];
    if(p.kind!=="bar"&&typeof x!=="number")throw new Error("Line and scatter plots require numeric x values; use a bar chart for categories.");
    if(String(x).length>60)throw new Error("Category labels must be at most 60 characters.");
    return {x,y:Number(r[c])};
  })}));
  if(p.kind==="line"&&series.some(s=>s.points.some((pt,i)=>i>0&&Number(pt.x)<=Number(s.points[i-1].x))))throw new Error("Line data must have strictly increasing x values; use scatter for repeated or unordered measurements.");
  return {...base,series,provenance:`Values copied from ${source.title}, columns ${[p.xColumn,...p.yColumns].map(c=>header[c]).join(", ")}. No missing values, uncertainty or statistical significance were inferred.`};
}

export function figureCsv(f:ScientificFigure):string {
  if(!f.series?.length)throw new Error("This diagram has no numerical dataset.");
  const quote=(v:unknown)=>`"${(typeof v==="string"&&/^[=+@\-\t\r]/.test(v)?"'"+v:String(v)).replace(/"/g,'""')}"`;
  return [[f.xLabel??"x",...f.series.map(s=>s.name)],...f.series[0].points.map((p,i)=>[p.x,...f.series!.map(s=>s.points[i].y)])].map(r=>r.map(quote).join(",")).join("\r\n");
}
export function referencedFigures(content:string,figures:ScientificFigure[]=[]):ScientificFigure[]{
  const ids=[...content.matchAll(/\[\[figure:([a-zA-Z0-9_-]+)\]\]/g)].map(m=>m[1]);
  return [...new Set(ids)].map(id=>{const f=figures.find(f=>f.id===id);if(!f)throw new Error(`Figure ${id} is missing. Restore the figure or remove its marker before export.`);return f;});
}
