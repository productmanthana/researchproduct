import { fromBuffer } from "yauzl";
import { createCanvas,loadImage } from "@napi-rs/canvas";
import { DOCX,storage,readDocument } from "./documents";
import { renderPdf } from "./research-engine";
import { objectStorageClient } from "./objectStorage";
import type { ScientificFigure } from "./scientific-figures";

export async function reviewVisuals(document:any,owner:string,itemId:string,pageNumbers?:number[]){
  const bytes=await readDocument(document);
  const visuals:{label:string;bytes:Buffer}[]=[],warnings:string[]=[];
  let available=0;
  if(document.content_type===DOCX){
    const supported:{name:string;bytes:Buffer}[]=[];
    let unsupported=0,nativeDrawings=false;
    await new Promise<void>((resolve,reject)=>{
      fromBuffer(bytes,{lazyEntries:true},(err,zip)=>{
        if(err||!zip){reject(new Error("Cannot inspect Word images."));return;}
        let expanded=0,entries=0;
        zip.on("error",reject);
        zip.on("entry",entry=>{
          expanded+=entry.uncompressedSize;entries++;
          if(expanded>50*1024*1024||entries>3000){zip.close();reject(new Error("Word archive expansion limit exceeded."));return;}
          if(/^word\/(?:charts|diagrams)\//.test(entry.fileName))nativeDrawings=true;
          if(!/^word\/media\//.test(entry.fileName)){zip.readEntry();return;}
          available++;
          if(!/\.(png|jpe?g|webp|gif)$/i.test(entry.fileName)){unsupported++;zip.readEntry();return;}
          if(supported.length>=12){zip.readEntry();return;}
          if(entry.uncompressedSize>15*1024*1024){unsupported++;zip.readEntry();return;}
          zip.openReadStream(entry,(error,stream)=>{
            if(error||!stream){zip.close();reject(new Error("Cannot read embedded Word image."));return;}
            const parts:Buffer[]=[];stream.on("data",part=>parts.push(part));
            stream.on("error",reject);stream.on("end",()=>{supported.push({name:entry.fileName,bytes:Buffer.concat(parts)});zip.readEntry();});
          });
        });
        zip.on("end",resolve);zip.readEntry();
      });
    });
    supported.forEach((v,i)=>visuals.push({label:`Word embedded image ${i+1} (${v.name.split("/").pop()})`,bytes:v.bytes}));
    warnings.push("Word text is extracted without physical page numbering. Embedded raster images are reviewed separately; their position in the original layout is not reconstructed.");
    if(unsupported)warnings.push(`${unsupported} embedded Word asset(s) use unsupported image formats or exceed processing limits.`);
    if(nativeDrawings)warnings.push("This Word file contains native charts or SmartArt. These objects were not visually rendered. Upload a PDF export to review their appearance.");
  }else{
    available=document.page_count;
    const all=(document.pages??[]).map((p:any)=>p.page as number);
    const prioritised=[...(document.pages??[]).filter((p:any)=>/\b(?:fig(?:ure)?\.?|diagram|chart|schematic)\b/i.test(p.text)).map((p:any)=>p.page),...all];
    const selected=pageNumbers?.length?[...new Set(pageNumbers)].filter(p=>all.includes(p)):[...new Set(prioritised)].slice(0,12).sort((a,b)=>a-b);
    if(pageNumbers?.length&&selected.length!==new Set(pageNumbers).size)throw new Error("A selected page does not exist in this PDF.");
    const rendered=await renderPdf(bytes,selected);
    for(const r of rendered)visuals.push({label:`PDF page ${r.page}`,bytes:Buffer.from(r.image.split(",")[1],"base64")});
    warnings.push("PDF visuals are page images, not isolated figure crops. Approved visual reconstructions replace the matching page-image reference in the working draft, not the original PDF.");
  }
  const figures:ScientificFigure[]=[],images:{id:string;label:string;image:string}[]=[];
  const root=storage.getPrivateObjectDir().replace(/\/$/,"");
  const [bucket,...prefix]=root.replace(/^\//,"").split("/");
  for(let i=0;i<visuals.length;i++){
    const v=visuals[i];
    try{
      const input=await loadImage(v.bytes),scale=Math.min(1,1600/Math.max(input.width,input.height));
      if(input.width*input.height>80000000)throw new Error("Image dimensions exceed review limits.");
      const width=Math.max(1,Math.round(input.width*scale)),height=Math.max(1,Math.round(input.height*scale));
      const canvas=createCanvas(width,height),ctx=canvas.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,width,height);ctx.drawImage(input,0,0,width,height);
      const png=canvas.toBuffer("image/png"),id=`original-${i+1}`,relative=`studio/${owner}/${itemId}/${id}.png`;
      await objectStorageClient.bucket(bucket).file([...prefix,relative].join("/")).save(png,{resumable:false,contentType:"image/png"});
      figures.push({id,kind:"original",title:v.label,caption:`Original visual from ${document.name}.`,provenance:"Uploaded original; not independently verified. Preserved for comparison.",pngPath:`/objects/${relative}`,width,height});
      images.push({id,label:v.label,image:`data:image/png;base64,${png.toString("base64")}`});
    }catch{warnings.push(`${v.label} could not be rendered and was not visually inspected.`);}
  }
  if(images.length<available)warnings.push(`Visual coverage is ${images.length} of ${available} available pages/image assets. Uninspected visuals are not verified.`);
  return {figures,images,available,warnings};
}
