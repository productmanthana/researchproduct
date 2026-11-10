import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { ScientificFigure } from "./scientific-figures";
import { storage } from "./documents";
import { illustratedDiagramSvg,diagramSize } from "./illustrated-diagram";
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]!));
const palette=["#61A9BD","#CED14E","#44986D","#DD83C9"];
const compact=(n:number)=>Math.abs(n)>=100000||Math.abs(n)>0&&Math.abs(n)<0.001?n.toExponential(2):Number(n.toPrecision(5)).toString();
export function figureSvg(f:ScientificFigure):string {
  if(f.kind==="original")throw new Error("Original image previews are available as PNG, not editable SVG.");
  if(f.kind==="diagram")return illustratedDiagramSvg(f);
  const width=1200,height=760;
  const out:string[]=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(f.title)}</title><rect width="100%" height="100%" fill="white"/>`];
  const text=(x:number,y:number,s:string,size=18,anchor="start",color="#172d36")=>out.push(`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" text-anchor="${anchor}" fill="${color}">${esc(s)}</text>`);
  const line=(x1:number,y1:number,x2:number,y2:number,color="#9aadb4",stroke=2)=>out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${stroke}"/>`);
  const wrap=(s:string,max=65)=>{const lines:string[]=[];let current="";for(const word of s.split(/\s+/)){if((current+" "+word).length>max&&current){lines.push(current);current=word;}else current+=(current?" ":"")+word;}if(current)lines.push(current);return lines;};
  wrap(f.title,85).slice(0,3).forEach((s,i)=>text(48,38+i*28,s,24));
  {
    if(!f.series?.length)throw new Error("Figure has no plotted data.");
    const series=f.series,points=series.flatMap(s=>s.points);
    const left=140,right=1110,top=175,bottom=590,w=right-left,h=bottom-top;
    let ymin=Math.min(...points.map(p=>p.y)),ymax=Math.max(...points.map(p=>p.y));
    if(f.kind==="bar"){ymin=Math.min(0,ymin);ymax=Math.max(0,ymax);}
    if(ymin===ymax){const pad=Math.abs(ymin)*0.1||1;ymin-=pad;ymax+=pad;}
    const categories=series[0].points.map(p=>String(p.x));
    const xmin=Math.min(...points.map(p=>Number(p.x))),xmax=Math.max(...points.map(p=>Number(p.x)));
    const yy=(v:number)=>bottom-(v-ymin)/(ymax-ymin)*h;
    const xx=(v:number)=>left+(v-xmin)/(xmax-xmin||1)*w;
    for(let i=0;i<=5;i++){const v=ymin+(ymax-ymin)*i/5,y=yy(v);line(left,y,right,y,"#e6edef",1);text(left-12,y+6,compact(v),16,"end");}
    line(left,top,left,bottom);line(left,bottom,right,bottom);
    out.push(`<text transform="translate(30 ${(top+bottom)/2}) rotate(-90)" font-family="Arial, sans-serif" font-size="18" text-anchor="middle">${esc(f.yLabel??"")}</text>`);
    text((left+right)/2,691,f.xLabel??"",18,"middle");
    if(f.kind==="bar"){
      const group=w/categories.length,bw=Math.min(48,group*0.75/series.length);
      series.forEach((s,si)=>s.points.forEach((p,i)=>{
        const x=left+group*(i+0.5)+(si-series.length/2)*bw,y=yy(p.y);
        out.push(`<rect x="${x}" y="${Math.min(y,yy(0))}" width="${bw}" height="${Math.abs(y-yy(0))}" fill="${palette[si%4]}"/>`);
      }));
      const step=Math.max(1,Math.ceil(categories.length/12));
      categories.forEach((c,i)=>{if(i%step===0)wrap(c,13).slice(0,3).forEach((s,n)=>text(left+group*(i+0.5),616+n*18,s,13,"middle"));});
    }else{
      for(let i=0;i<=5;i++){const v=xmin+(xmax-xmin)*i/5;text(xx(v),617,compact(v),16,"middle");}
      series.forEach((s,si)=>{
        if(f.kind!=="scatter")out.push(`<polyline points="${s.points.map(p=>`${xx(Number(p.x))},${yy(p.y)}`).join(" ")}" fill="none" stroke="${palette[si%4]}" stroke-width="3"/>`);
        if(f.kind==="scatter"||s.points.length<=12)s.points.forEach(p=>out.push(`<circle cx="${xx(Number(p.x))}" cy="${yy(p.y)}" r="5" fill="${palette[si%4]}"/>`));
      });
    }
    series.forEach((s,i)=>{out.push(`<rect x="${left+i*240}" y="132" width="14" height="14" fill="${palette[i%4]}"/>`);text(left+22+i*240,144,s.name.slice(0,24),15);});
    text(48,735,f.kind==="theory"?"Theoretical calculation — not experimental data":"Source-derived values — see caption and downloadable data",16);
  }
  out.push("</svg>");return out.join("");
}
export async function figurePng(f:ScientificFigure):Promise<Buffer>{
  if(f.kind==="original"){
    if(!f.pngPath)throw new Error("Original image is unavailable.");
    const [bytes]=await (await storage.getObjectEntityFile(f.pngPath)).download();
    return bytes;
  }
  const svg=figureSvg(f),image=await loadImage(Buffer.from(svg));
  const canvas=createCanvas(image.width*2,image.height*2),ctx=canvas.getContext("2d");
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toBuffer("image/png");
}
export const figureAspect=(f:ScientificFigure)=>f.kind==="original"&&f.width&&f.height?f.height/f.width:f.kind==="diagram"?diagramSize(f).height/diagramSize(f).width:760/1200;
