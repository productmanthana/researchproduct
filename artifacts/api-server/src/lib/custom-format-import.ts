import { fromBuffer } from "yauzl";
import { customFormatSchema,defaultCustomFormat,type CustomFormat } from "./custom-format";
import { documentLayout } from "./studio-formatting";

/** Read bounded XML only, not macros, external links or embedded executables. */
export function wordTemplateXml(bytes:Buffer):Promise<Record<string,string>>{
  return new Promise((resolve,reject)=>fromBuffer(bytes,{lazyEntries:true},(error,zip)=>{
    if(error||!zip){reject(new Error("The Word template could not be opened."));return;}
    const files:Record<string,string>={};let entries=0,total=0;
    const fail=(e:Error)=>{zip.close();reject(e);};
    zip.on("error",fail);zip.on("end",()=>resolve(files));
    zip.on("entry",entry=>{
      if(++entries>2000){fail(new Error("The Word archive has too many entries."));return;}
      if(!["word/document.xml","word/styles.xml"].includes(entry.fileName)){zip.readEntry();return;}
      if(entry.uncompressedSize>2000000){fail(new Error("Word template XML exceeds the safe import limit."));return;}
      zip.openReadStream(entry,(err,stream)=>{
        if(err||!stream){fail(new Error("The Word template XML could not be read."));return;}
        const chunks:Buffer[]=[];
        stream.on("data",(c:Buffer)=>{total+=c.length;if(total>4000000){stream.destroy(new Error("Word XML exceeds the safe import limit."));return;}chunks.push(c);});
        stream.on("error",fail);stream.on("end",()=>{files[entry.fileName]=Buffer.concat(chunks).toString("utf8");zip.readEntry();});
      });
    });zip.readEntry();
  }));
}
export function importWordLayout(files:Record<string,string>):{format:CustomFormat;warnings:string[]}{
  const format=defaultCustomFormat(documentLayout()),warnings=["Imported Word settings are personal preferences, not verified journal/university instructions. Review the preview before applying.",
    "Only supported document defaults and final-section page settings are read. Per-paragraph styles, headers, footers, cover artwork and the complete Word template are not copied."];
  const xml=files["word/document.xml"]??"",styles=files["word/styles.xml"]??"";
  const sections=[...xml.matchAll(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g)];
  const section=sections.at(-1)?.[0]??xml;
  if(sections.length>1)warnings.push("The Word file has multiple sections. Only the final section's supported page settings were imported.");
  const attrs=(tag:string,source:string)=>Object.fromEntries([...(new RegExp(`<w:${tag}\\b([^>]*)>`).exec(source)?.[1]??"").matchAll(/\bw:(\w+)=["']([^"']*)["']/g)].map(m=>[m[1],m[2]]));
  const size=attrs("pgSz",section),width=Number(size.w),height=Number(size.h);
  if(Math.abs(width-11906)<40&&Math.abs(height-16838)<40)format.size="A4";
  else if(Math.abs(width-12240)<40&&Math.abs(height-15840)<40)format.size="LETTER";
  else warnings.push("Page size was absent or unsupported; A4/Letter must be chosen manually.");
  const margins=attrs("pgMar",section);
  for(const side of ["top","right","bottom","left"] as const){
    const value=Number(margins[side])/20;
    if(Number.isFinite(value)&&value>=18&&value<=144)format.margins[side]=value;
    else if(margins[side]!==undefined)warnings.push(`The ${side} margin is outside the supported range; choose it manually.`);
  }
  const cols=Number(attrs("cols",section).num??1);if(cols===1||cols===2)format.columns=cols;
  const defaults=/<w:docDefaults\b[\s\S]*?<\/w:docDefaults>/.exec(styles)?.[0]??styles;
  const font=Number(attrs("sz",defaults).val)/2;if(font>=8&&font<=16)format.fontSize=font;
  const spacing=attrs("spacing",defaults);
  if(spacing.lineRule!=="exact"&&Number(spacing.line)>=240&&Number(spacing.line)<=600)format.lineSpacing=Number(spacing.line)/240;
  const family=attrs("rFonts",defaults).ascii;
  if(family){format.fontFamily=/arial|calibri|helvetica|sans|aptos/i.test(family)?"sans":"serif";warnings.push(`Source font "${family}" was mapped to the supported ${format.fontFamily} family; this is not an exact-font match.`);}
  return {format:customFormatSchema.parse(format),warnings};
}
