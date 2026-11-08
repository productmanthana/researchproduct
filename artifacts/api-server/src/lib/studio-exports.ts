import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import { objectStorageClient } from "./objectStorage";
import { storage } from "./documents";
import { pool } from "@workspace/db";
import path from "node:path";
import { fileURLToPath } from "node:url";
const plain=(s:string)=>s.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\[(.*?)\]\((.*?)\)/g,"$1 ($2)").replace(/`([^`]+)`/g,"$1");
export async function exportStudioFile(row:any,format:"pdf"|"docx") {
  const content=`# ${row.title}\n\n${row.content}`;
  const lines=content.split("\n");
  let bytes:Buffer;
  if(format==="docx"){
    const children:(Paragraph|Table)[]=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      if(line.trim().startsWith("|")){
        const rows:string[][]=[];
        while(i<lines.length&&lines[i].trim().startsWith("|")){
          const cells=lines[i].trim().replace(/^\||\|$/g,"").split("|").map(s=>plain(s.trim()));
          if(!cells.every(c=>/^:?-+:?$/.test(c)))rows.push(cells);
          i++;
        }
        i--;
        if(rows.length)children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rows.map((cells,n)=>new TableRow({tableHeader:n===0,children:cells.map(text=>new TableCell({children:[new Paragraph(text)]}))}))}));
      }else{
        const heading=line.match(/^(#{1,3})\s+(.*)/);
        children.push(new Paragraph(heading?{text:plain(heading[2]),heading:heading[1].length===1?HeadingLevel.HEADING_1:heading[1].length===2?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3}:{children:[new TextRun(plain(line))],spacing:{after:120,line:row.metadata?.templateId==="harvard"?480:300}}));
      }
    }
    bytes=await Packer.toBuffer(new Document({styles:{default:{document:{run:{font:"Times New Roman",size:24}}}},
      sections:[{properties:{page:{margin:{top:1440,right:1440,bottom:1440,left:1440}}},children}]}));
  }else{
    bytes=await new Promise<Buffer>((resolve,reject)=>{
      const pdf=new PDFDocument({size:"LETTER",margins:{top:60,bottom:60,left:60,right:60},info:{Title:row.title,Author:"Evidora research workspace"}});
      const chunks:Buffer[]=[];pdf.on("data",c=>chunks.push(c));pdf.on("end",()=>resolve(Buffer.concat(chunks)));pdf.on("error",reject);
      const fontDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../assets/fonts");
      pdf.registerFont("Academic",path.join(fontDir,"DejaVuSerif.ttf"));
      pdf.registerFont("AcademicBold",path.join(fontDir,"DejaVuSerif-Bold.ttf"));
      pdf.font("Academic");
      for(let i=0;i<lines.length;i++){
        const line=lines[i];
        if(line.trim().startsWith("|")){
          const rows:string[][]=[];
          while(i<lines.length&&lines[i].trim().startsWith("|")){
            const cells=lines[i].trim().replace(/^\||\|$/g,"").split("|").map(s=>plain(s.trim()));
            if(!cells.every(c=>/^:?-+:?$/.test(c)))rows.push(cells);
            i++;
          }
          i--;
          const cols=Math.max(1,...rows.map(r=>r.length)),width=(pdf.page.width-120)/cols;
          for(let r=0;r<rows.length;r++){
            pdf.font(r===0?"AcademicBold":"Academic").fontSize(9);
            const height=Math.max(...rows[r].map(s=>pdf.heightOfString(s,{width:width-12})))+14;
            if(pdf.y+height>pdf.page.height-60)pdf.addPage();
            const y=pdf.y;
            rows[r].forEach((cell,n)=>{
              pdf.rect(60+n*width,y,width,height).strokeColor("#c4ccc7").stroke();
              pdf.fillColor("#243731").text(cell,66+n*width,y+7,{width:width-12});
            });
            pdf.x=60;pdf.y=y+height;
          }
          pdf.moveDown();continue;
        }
        const heading=line.match(/^(#{1,3})\s+(.*)/);
        pdf.font(heading?"AcademicBold":"Academic").fontSize(heading?heading[1].length===1?18:14:11);
        pdf.text(plain(heading?heading[2]:line),{lineGap:row.metadata?.templateId==="harvard"?9:4}).moveDown(0.3);
      }
      pdf.end();
    });
  }
  const relative=`studio/${row.owner_id}/${row.id}.${format}`;
  const objectPath=`${storage.getPrivateObjectDir().replace(/\/$/,"")}/${relative}`;
  const [bucket,...parts]=objectPath.replace(/^\//,"").split("/");
  await objectStorageClient.bucket(bucket).file(parts.join("/")).save(bytes,{resumable:false,contentType:format==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  await pool.query("UPDATE research_studio_items SET metadata=jsonb_set(metadata,$2::text[],$3::jsonb) WHERE id=$1 AND owner_id=$4",[row.id,[`${format}Export`],JSON.stringify(`/objects/${relative}`),row.owner_id]);
  return bytes;
}
