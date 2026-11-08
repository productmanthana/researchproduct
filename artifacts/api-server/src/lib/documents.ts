import { ObjectStorageService } from "./objectStorage";
import { HttpError, iso } from "./common";
import { pool } from "@workspace/db";
import { fromBuffer } from "yauzl";
import { extractRawText } from "mammoth";
export const DOCX="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const storage=new ObjectStorageService();
export const documentView=(r:any)=>({id:r.id,name:r.name,contentType:r.content_type,size:r.size,status:r.status,pageCount:r.page_count,error:r.error,paperId:r.paper_id??null,createdAt:iso(r.created_at)});
export async function ownedDocument(id:string,owner:string) {
  const {rows}=await pool.query("SELECT * FROM research_documents WHERE id=$1 AND owner_id=$2",[id,owner]);
  if(!rows[0]) throw new HttpError(404,"Document not found.");
  return rows[0];
}
export async function readDocument(row:any) {
  const file=await storage.getObjectEntityFile(row.object_path);
  const [metadata]=await file.getMetadata();
  if(Number(metadata.size)>15728640 || Number(metadata.size)!==row.size) throw new HttpError(400,"File size does not match the upload request (maximum 15 MB).");
  const [bytes]=await file.download();
  const pdf=bytes.subarray(0,5).toString()==="%PDF-";
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg=bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const webp=bytes.subarray(0,4).toString()==="RIFF" && bytes.subarray(8,12).toString()==="WEBP";
  const docx=bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4;
  if(!(row.content_type==="application/pdf"?pdf:row.content_type===DOCX?docx:row.content_type==="image/png"?png:row.content_type==="image/jpeg"?jpg:webp)) throw new HttpError(400,"The file contents do not match the selected file type.");
  return bytes;
}
export async function extractWord(bytes:Buffer) {
  await new Promise<void>((resolve,reject)=>{
    fromBuffer(bytes,{lazyEntries:true},(error,zip)=>{
      if(error||!zip){reject(new HttpError(400,"Invalid Word document."));return;}
      let total=0,entries=0,document=false;
      zip.on("error",reject);
      zip.on("entry",entry=>{
        total+=entry.uncompressedSize;entries++;
        if(total>50*1024*1024||entries>3000||entry.fileName.endsWith("vbaProject.bin")){
          zip.close();reject(new HttpError(400,"Word document is too large when expanded, or contains macros."));return;
        }
        if(entry.fileName==="word/document.xml")document=true;
        zip.readEntry();
      });
      zip.on("end",()=>document?resolve():reject(new HttpError(400,"This is not a valid DOCX document.")));
      zip.readEntry();
    });
  });
  const result=await extractRawText({buffer:bytes});
  if(result.value.length>500000)throw new HttpError(400,"Please split this Word document into smaller files (maximum 500,000 text characters).");
  if(!result.value.trim())throw new HttpError(400,"No readable text was found in the Word document.");
  // Text segments, not asserted physical Word page numbers.
  return (result.value.match(/[\s\S]{1,10000}/g)??[]).map((text,i)=>({page:i+1,text}));
}
export async function extractPages(bytes:Buffer) {
  const {getDocument}=await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
  const pdf=await task.promise;
  try {
    if(pdf.numPages>50) throw new HttpError(400,"Please upload a PDF with 50 pages or fewer.");
    const pages=[];
    for(let page=1;page<=pdf.numPages;page++) {
      const p=await pdf.getPage(page), content=await p.getTextContent();
      const text=content.items.map(item=>"str" in item?item.str:"").join(" ").slice(0,30000);
      pages.push({page,text});
      p.cleanup();
    }
    return pages;
  } finally { await task.destroy(); }
}
