import type { ScientificFigure } from "./scientific-figures";

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
  return {width:1440,height:f.layout==="cycle"?1120:Math.max(760,300+rows*250)};
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
    if(layout==="cycle"){
      const angle=-Math.PI/2+i*Math.PI*2/nodes.length;
      x=720+Math.cos(angle)*485;y=545+Math.sin(angle)*305;
    }else{
      const row=Math.floor(i/3),col=i%3,count=Math.min(3,nodes.length-row*3);
      x=(width-count*420)/2+col*420+210;
      y=270+row*250;
    }
    const role=n.role??(i===0?"input":i===nodes.length-1?"output":"process");
    positions.set(n.id,{x,y,role});
  });
  for(const [key,tone] of Object.entries(tones)){
    out.push(`<defs><marker id="arrow-${key}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8" fill="${tone.ink}"/></marker></defs>`);
  }
  for(const e of edges){
    const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)continue;
    const feedback=e.role==="feedback",tone=tones[feedback?"feedback":b.role];
    const dx=b.x-a.x,dy=b.y-a.y;
    // Intersect the connector with each node's enclosing ellipse.
    const norm=Math.sqrt((dx/171)**2+(dy/88)**2)||1;
    const x1=a.x+dx/norm,y1=a.y+dy/norm,x2=b.x-dx/norm,y2=b.y-dy/norm;
    const bend=feedback?70:0,mx=(x1+x2)/2-dy/(Math.hypot(dx,dy)||1)*bend,my=(y1+y2)/2+dx/(Math.hypot(dx,dy)||1)*bend;
    out.push(`<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="${tone.ink}" stroke-width="${feedback?3:2.5}" ${feedback?'stroke-dasharray="8 5"':""}/>`);
    // Explicit geometry works in both browser SVG and the PNG/PDF rasterizer;
    // SVG marker support differs between renderers.
    const tangent=Math.atan2(y2-my,x2-mx),ux=Math.cos(tangent),uy=Math.sin(tangent);
    if(e.role!=="association")out.push(`<polygon points="${x2},${y2} ${x2-14*ux+5*uy},${y2-14*uy-5*ux} ${x2-14*ux-5*uy},${y2-14*uy+5*ux}" fill="${tone.ink}"/>`);
    if(e.label){
      const lx=(x1+2*mx+x2)/4,ly=(y1+2*my+y2)/4,lines=wrap(e.label,14);
      // Keep labels above the path: an opaque label box can otherwise cover a
      // short connector completely, including its arrow head.
      lines.forEach((s,i)=>text(lx,ly-18-(lines.length-1-i)*16,s,12,tone.ink,"middle"));
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
  const legendY=height-82,roles=[...new Set([...positions.values()].map(p=>p.role))];
  if(edges.some(e=>e.role==="feedback")&&!roles.includes("feedback"))roles.push("feedback");
  const legendWidth=roles.length*258;
  roles.forEach((role,i)=>{const x=(width-legendWidth)/2+i*258;out.push(`<circle cx="${x+9}" cy="${legendY}" r="7" fill="${tones[role].ink}"/>`);text(x+26,legendY+5,tones[role].label,15,"#52665f");});
  text(width/2,height-30,edges.every(e=>e.role==="association")?"Undirected lines show relationships, not causal or power-flow direction. No measured results are implied.":"Colours identify functional roles; arrows show direction and plain lines show associations. No measured results are implied.",14,"#65766e","middle");
  out.push("</svg>");return out.join("");
}
