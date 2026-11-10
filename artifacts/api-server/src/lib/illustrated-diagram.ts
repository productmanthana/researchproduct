import type { ScientificFigure } from "./scientific-figures";
import { routeDiagramEdge, type DiagramObstacle } from "./diagram-routing";

// Structured, escaped SVG rather than generated pixels: labels and connections
// remain exact, reproducible, sharp in print, and compatible with Word/PDF.
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]!));
const tones={
  input:{ink:"#1e6683",fill:"#e7f4fa",label:"Input / data"},
  process:{ink:"#376b58",fill:"#eaf4ed",label:"Processing / method"},
  output:{ink:"#65508a",fill:"#f0ecf7",label:"Output / evaluation"},
  feedback:{ink:"#b36b25",fill:"#fff2df",label:"Feedback / revision"},
  evidence:{ink:"#8a4963",fill:"#faecf2",label:"Evidence / comparison"},
};
const wrap=(s:string,max:number)=>{
  const lines:string[]=[];let current="";
  for(const word of s.split(/\s+/)){
    // Split long identifiers so they cannot run outside the node.
    const chunks=word.match(new RegExp(`.{1,${max}}`,"g"))??[];
    for(const chunk of chunks){if((current+" "+chunk).trim().length>max&&current){lines.push(current);current=chunk;}else current+=(current?" ":"")+chunk;}
  }
  if(current)lines.push(current);return lines;
};
export function diagramSize(f:ScientificFigure){
  const rows=Math.ceil((f.nodes?.length??0)/3);
  const labels=(f.edges??[]).filter(e=>e.label).length;
  return {width:1620,height:(f.layout==="cycle"&&(f.nodes?.length??0)<=6?1160:Math.max(740,360+rows*340))+Math.ceil(labels/2)*64};
}
/** Small scientific pictograms; no outside assets or font-dependent icon glyphs. */
function icon(type:string,x:number,y:number,color:string){
  const paths:Record<string,string>={
    data:'<ellipse cx="0" cy="-17" rx="24" ry="9"/><path d="M-24 -17v32c0 12 48 12 48 0v-32M-24 -2c0 12 48 12 48 0"/>',
    document:'<path d="M-20 -29h26l16 16v42h-42zM6 -29v16h16M-11 -4h24M-11 7h24M-11 18h18"/>',
    sensor:'<circle r="9"/><path d="M-17 -17a24 24 0 0 0 0 34M17 -17a24 24 0 0 1 0 34M-26 -26a37 37 0 0 0 0 52M26 -26a37 37 0 0 1 0 52M0 9v23"/>',
    compute:'<rect x="-22" y="-22" width="44" height="44" rx="6"/><rect x="-11" y="-11" width="22" height="22" rx="2"/><path d="M-12 -30v8M0 -30v8M12 -30v8M-12 22v8M0 22v8M12 22v8M-30 -12h8M-30 0h8M-30 12h8M22 -12h8M22 0h8M22 12h8"/>',
    experiment:'<path d="M-10 -29h20M-7 -29v23l-20 32q-2 5 5 5h44q7 0 5-5L7 -6v-23M-17 13h34"/><circle cx="-5" cy="20" r="2"/>',
    compare:'<path d="M0 -28v56M-27 -13h54M-20 -13l-13 25h26zM20 -13L7 12h26zM-15 29h30"/>',
    target:'<circle r="28"/><circle r="18"/><circle r="7"/><path d="M0 0l26 -27m-8 0h8v8"/>',
    knowledge:'<path d="M0 -20q-15 -13-31-5v47q16-7 31 5 15-12 31-5v-47q-16-8-31 5v47M-23 -13l15 4M-23 -3l15 4M8 -9l15-4M8 1l15-4"/>',
    network:'<path d="M-25 -21L0 -13l25-8M-25 0L0 -13M-25 21L0 -13M-25 -21L0 13M-25 0L0 13M-25 21L0 13M0 -13L25 0M0 13L25 0M0 13l25 8"/>'+[[-25,-21],[-25,0],[-25,21],[0,-13],[0,13],[25,-21],[25,0],[25,21]].map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="5" fill="white"/>`).join(""),
  };
  return `<g transform="translate(${x} ${y})" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths[type]??paths.compute}</g>`;
}
export function illustratedDiagramSvg(f:ScientificFigure){
  const {width,height}=diagramSize(f),nodes=f.nodes??[],edges=f.edges??[],layout=f.layout??"process";
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(f.title)}</title><desc>${esc(f.explanation??f.caption)}</desc><rect width="100%" height="100%" fill="#fff"/>`];
  const text=(x:number,y:number,s:string,size=18,color="#18352f",anchor="start",weight=400)=>out.push(`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`);
  out.push('<rect x="48" y="40" width="6" height="62" rx="3" fill="#376b58"/>');
  wrap(f.title,78).slice(0,2).forEach((s,i)=>text(76,66+i*29,s,26,"#18352f","start",600));
  text(76,126,`${layout==="neural"?"Neural architecture":layout==="cycle"?"Iterative process":layout==="taxonomy"?"Research taxonomy":layout==="system"?"System architecture":"Research methodology"} · Conceptual / proposed`,16,"#65766e");
  const positions=new Map<string,{x:number;y:number;role:keyof typeof tones}>();
  nodes.forEach((n,i)=>{
    let x:number,y:number;
    if(layout==="cycle"&&nodes.length<=6){
      const angle=-Math.PI/2+i*Math.PI*2/nodes.length;
      x=width/2+Math.cos(angle)*485;y=545+Math.sin(angle)*305;
    }else{
      const row=Math.floor(i/3),col=i%3,count=Math.min(3,nodes.length-row*3);
      x=(width-count*470)/2+col*470+235;
      y=280+row*340;
    }
    const role=n.role??(i===0?"input":i===nodes.length-1?"output":"process");
    positions.set(n.id,{x,y,role});
  });
  for(const [key,tone] of Object.entries(tones)){
    out.push(`<defs><marker id="arrow-${key}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8" fill="${tone.ink}"/></marker></defs>`);
  }
  const obstacles:DiagramObstacle[]=nodes.map(n=>{
    const p=positions.get(n.id)!;
    return {left:p.x-180,right:p.x+180,top:p.y-100,bottom:p.y+(n.description?166:100)};
  });
  const routeBottom=Math.max(...obstacles.map(r=>r.bottom),400)+28;
  const edgeLabels:{letter:string;from:number;to:number;label:string}[]=[];
  for(const e of edges){
    const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)continue;
    const feedback=e.role==="feedback",tone=tones[feedback?"feedback":b.role];
    const points=routeDiagramEdge(a,b,obstacles,width,routeBottom);
    const end=points.at(-1)!,prior=points.at(-2)!;
    out.push(`<path data-connector="true" d="${points.map((p,i)=>`${i?"L":"M"}${p.x},${p.y}`).join(" ")}" fill="none" stroke="${tone.ink}" stroke-width="${feedback?3:2.5}" stroke-linejoin="round" ${feedback?'stroke-dasharray="8 5"':""}/>`);
    // Explicit geometry works in both browser SVG and the PNG/PDF rasterizer;
    // SVG marker support differs between renderers.
    const tangent=Math.atan2(end.y-prior.y,end.x-prior.x),ux=Math.cos(tangent),uy=Math.sin(tangent);
    if(e.role!=="association")out.push(`<polygon points="${end.x},${end.y} ${end.x-14*ux+5*uy},${end.y-14*uy-5*ux} ${end.x-14*ux-5*uy},${end.y-14*uy+5*ux}" fill="${tone.ink}"/>`);
    if(e.label){
      const letter=String.fromCharCode(97+edgeLabels.length);
      edgeLabels.push({letter,from:nodes.findIndex(n=>n.id===e.from)+1,to:nodes.findIndex(n=>n.id===e.to)+1,label:e.label});
      const segments=points.slice(1).map((p,i)=>({p,q:points[i],length:Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y)})).sort((x,y)=>y.length-x.length);
      const segment=segments[0],lx=(segment.p.x+segment.q.x)/2,ly=(segment.p.y+segment.q.y)/2;
      out.push(`<circle cx="${lx}" cy="${ly}" r="13" fill="white" stroke="${tone.ink}" stroke-width="1.2"/>`);
      text(lx,ly+4,letter,14,tone.ink,"middle",600);
    }
  }
  nodes.forEach((n,i)=>{
    const p=positions.get(n.id)!,tone=tones[p.role],shape=layout==="neural"||layout==="cycle";
    if(shape)out.push(`<ellipse cx="${p.x}" cy="${p.y}" rx="166" ry="84" fill="${tone.fill}" stroke="${tone.ink}" stroke-width="1.5"/>`);
    else if(layout==="system")out.push(`<path d="M${p.x-165} ${p.y-80}h300l30 30v130h-330z" fill="${tone.fill}" stroke="${tone.ink}" stroke-width="1.5"/>`);
    else out.push(`<rect x="${p.x-165}" y="${p.y-80}" width="330" height="160" rx="${layout==="taxonomy"?3:22}" fill="${tone.fill}" stroke="${tone.ink}" stroke-width="1.5"/>`);
    out.push(`<circle cx="${p.x-143}" cy="${p.y-70}" r="17" fill="${tone.ink}"/>`);
    text(p.x-143,p.y-64,String(i+1),15,"white","middle",600);
    out.push(icon(n.icon??(layout==="neural"&&p.role==="process"?"network":p.role==="input"?"data":p.role==="output"?"target":p.role==="evidence"?"knowledge":"compute"),p.x,p.y-34,tone.ink));
    wrap(n.label,30).slice(0,3).forEach((s,j)=>text(p.x,p.y+13+j*21,s,18,tone.ink,"middle",600));
    if(n.description)wrap(n.description,45).slice(0,3).forEach((s,j)=>text(p.x,p.y+112+j*17,s,14,"#52665f","middle"));
  });
  edgeLabels.forEach((e,i)=>{
    const x=90+(i%2)*760,y=routeBottom+42+Math.floor(i/2)*64;
    wrap(`${e.letter} · Stage ${e.from} to ${e.to}: ${e.label}`,78).slice(0,2).forEach((line,j)=>text(x,y+j*20,line,16,"#52665f"));
  });
  const legendY=height-82,roles=[...new Set([...positions.values()].map(p=>p.role))];
  if(edges.some(e=>e.role==="feedback")&&!roles.includes("feedback"))roles.push("feedback");
  const legendWidth=roles.length*258;
  roles.forEach((role,i)=>{const x=(width-legendWidth)/2+i*258;out.push(`<circle cx="${x+9}" cy="${legendY}" r="7" fill="${tones[role].ink}"/>`);text(x+26,legendY+5,tones[role].label,15,"#52665f");});
  text(width/2,height-30,edges.every(e=>e.role==="association")?"Undirected lines show relationships, not causal or power-flow direction. No measured results are implied.":"Colours identify functional roles; arrows show direction and plain lines show associations. No measured results are implied.",14,"#65766e","middle");
  out.push("</svg>");return out.join("");
}
