import PDFDocument from "pdfkit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentBlocks,documentLayoutFor,sectionText } from "./studio-formatting";
import { referencedFigures } from "./scientific-figures";
import { customCitationExport,savedCustomFormat } from "./custom-format";
import { figurePng,figureAspect } from "./figure-renderer";
import { parseExportReference, prepareExportReferences } from "./export-references";
export async function renderStudioPdf(row:any):Promise<Buffer>{
  row=customCitationExport(prepareExportReferences(row));
  const custom=savedCustomFormat(row);
  const figures=referencedFigures(row.content,row.metadata?.figures??[]);
  const images=new Map(await Promise.all(figures.map(async f=>[f.id,await figurePng(f)] as const)));
  return new Promise((resolve,reject)=>{
    const id=row.metadata?.templateId,l=documentLayoutFor(row),d=row.metadata?.documentDetails??{};
    const pdf=new PDFDocument({size:l.size,margins:l.margins,bufferPages:true,info:{Title:row.title,Author:d.author||"Evidora research workspace"}});
    const chunks:Buffer[]=[];pdf.on("data",c=>chunks.push(c));pdf.on("end",()=>resolve(Buffer.concat(chunks)));pdf.on("error",reject);
    try{
      // Works in the production bundle and the package-root test bundle.
      const here=path.dirname(fileURLToPath(import.meta.url));
      const fontDir=path.resolve(here,here.endsWith("/dist")?"../assets/fonts":"assets/fonts");
      pdf.registerFont("Academic",path.join(fontDir,l.fontFamily==="sans"?"DejaVuSans.ttf":"DejaVuSerif.ttf"));
      pdf.registerFont("AcademicBold",path.join(fontDir,l.fontFamily==="sans"?"DejaVuSans-Bold.ttf":"DejaVuSerif-Bold.ttf"));
      pdf.font("Academic").fillColor("#000000");
      const fullWidth=pdf.page.width-l.margins.left-l.margins.right;
      let columns=1,column=0,y=l.margins.top;
      const width=()=>columns===2?(fullWidth-18)/2:fullWidth;
      const x=()=>l.margins.left+column*(width()+18);
      let pageIndex=0;
      const addPage=()=>{pdf.addPage();pageIndex++;column=0;y=l.margins.top;};
      const ensure=(height:number)=>{
        if(y+height<=pdf.page.height-l.margins.bottom)return;
        if(columns===2&&column===0){column=1;y=l.margins.top;}else addPage();
      };
      const wrap=(text:string,w:number)=>{
        const lines:string[]=[];let line="";
        for(const token of text.split(/\s+/)){
          if(pdf.widthOfString((line?line+" ":"")+token)<=w){line+=(line?" ":"")+token;continue;}
          if(line)lines.push(line);line="";
          if(pdf.widthOfString(token)>w){
            for(const c of token){if(pdf.widthOfString(line+c)>w){lines.push(line);line="";}line+=c;}
          }else line=token;
        }
        if(line)lines.push(line);return lines;
      };
      const text=(value:string,size=l.fontSize,bold=false,center=false,spacing=l.lineSpacing)=>{
        pdf.font(bold?"AcademicBold":"Academic").fontSize(size);
        const lines=wrap(value,width()),height=size*spacing+2;
        for(const line of lines){ensure(height);pdf.text(line,x(),y,{width:width(),lineBreak:false,align:center?"center":"left"});y+=height;}
        y+=size*0.6;
      };
      const title=()=>{y+=id==="academic-report"?0:36;text(id==="stanford"?row.title.toUpperCase():row.title,id==="academic-report"?18:20,true,id!=="academic-report",1.2);y+=id==="academic-report"?6:20;if(["journal","synopsis","thesis"].includes(row.kind)||l.thesis){text(d.author||"[Author name required]",12,false,true);text(d.affiliation||"[Affiliation required]",12,false,true);}else if(d.author)text(d.author,12,false,true);};
      let body=String(row.content).replace(/^#\s+([^\n]+)\n/,(_,s:string)=>s.trim()===row.title.trim()?"":`# ${s}\n`);
      let bodyStart=0,prelimStart=0,contentsPages:number[]=[];
      const toc:{title:string;page:number}[]=[];
      title();
      if(l.thesis){
        text(`Submitted in partial fulfillment of the requirements for ${d.degree||"[degree required]"}`,12,false,true);
        text(d.department||"[Department required]",12,false,true);
        text(`Supervisor/advisor: ${d.supervisor||"[name required]"}`,12,false,true);
        if(d.studentId)text(`Student ID: ${d.studentId}`,12,false,true);
        text(d.year||"[Submission date required]",12,false,true);
        if(id==="harvard"){addPage();y+=100;text(`© ${d.year||"[year]"} ${d.author||"[author]"}. All rights reserved.`,12,false,true);}
        addPage();prelimStart=pageIndex;text("Abstract",18,true);
        const abstract=sectionText(body,"Abstract");text(abstract||"[Abstract required — add your research abstract before submission.]");
        if(abstract)body=body.replace(/^#{1,3}\s+Abstract\s*\n[\s\S]*?(?=^#{1,3}\s|(?![\s\S]))/im,"");
        const headings=documentBlocks(body).filter(b=>b.kind==="heading"&&b.level<=2);
        const pages=Math.max(1,Math.ceil(headings.length/22));
        for(let i=0;i<pages;i++){addPage();contentsPages.push(pageIndex);}
        addPage();bodyStart=pageIndex;columns=l.columns;
      }else{y+=14;columns=l.columns;}
      let references=false,disclosure=false;
      for(const block of documentBlocks(body)){
        if(block.kind==="heading"){
          references=/^(References|Bibliography|Works cited|Reference list)\b/i.test(block.text);
          disclosure=id==="academic-report"&&/^AI-use disclosure\b/i.test(block.text);
          if(disclosure){ensure(48);text(block.text,9,true,false,1.05);continue;}
          if(l.thesis&&/^(chapter\s+\d|introduction|conclusions?)/i.test(block.text)&&y>l.margins.top+5)addPage();
          ensure(60);
          if(l.thesis&&block.level<=2)toc.push({title:block.text,page:pageIndex-bodyStart+1});
          text(block.text,block.level===1?17:block.level===2?14:12,true,false,1.2);
        }else if(block.kind==="paragraph"){
          const reference=references?parseExportReference(block.text):undefined;
          if(reference){
            const size=Math.min(l.fontSize,10.5),indent=custom?.citationStyle==="author-year"?0:27,lineHeight=size*1.2+2;
            pdf.font("Academic").fontSize(size);
            const lines=wrap(reference.citation,width()-indent);
            const linkLines=reference.linkLabel?wrap(reference.linkLabel,width()-indent):[];
            const entryHeight=(lines.length+linkLines.length)*lineHeight+8;
            ensure(Math.min(entryHeight,pdf.page.height-l.margins.top-l.margins.bottom));
            lines.forEach((line,i)=>{
              ensure(lineHeight);
              pdf.fillColor("#000000");
              if(!i&&custom?.citationStyle!=="author-year")pdf.text(`[${reference.number}]`,x(),y,{width:indent-3,lineBreak:false});
              pdf.text(line,x()+indent,y,{width:width()-indent,lineBreak:false});
              y+=lineHeight;
            });
            for(const line of linkLines){
              ensure(lineHeight);
              pdf.fillColor("#245b65").text(line,x()+indent,y,{width:width()-indent,lineBreak:false,link:reference.href,underline:true});
              y+=lineHeight;
            }
            pdf.fillColor("#000000");y+=8;
          }else text(block.text,disclosure?8.5:references&&id==="academic-report"?9.5:l.fontSize,false,false,disclosure?1.05:references&&id==="academic-report"?1.05:l.lineSpacing);
        }
        else if(block.kind==="figure"){
          const f=figures.find(f=>f.id===block.id)!;
          const previousColumns=columns;
          if(columns===2){columns=1;addPage();}
          const imageHeight=Math.min(width()*(custom?.figureWidth??100)/100*figureAspect(f),id==="academic-report"?255:pdf.page.height-l.margins.top-l.margins.bottom-100);
          ensure(imageHeight+50);
          if(custom?.captionPosition==="above")text(`Figure ${figures.indexOf(f)+1}. ${f.title}. ${f.caption}`,10,false,false,1.2);
          pdf.image(images.get(f.id)!,x(),y,{width:imageHeight/figureAspect(f),height:imageHeight});
          y+=imageHeight+8;
          if(custom?.captionPosition!=="above")text(`Figure ${figures.indexOf(f)+1}. ${f.title}. ${f.caption}`,10,false,false,1.2);
          if(f.explanation&&id!=="academic-report")text(f.explanation,10,false,false,1.3);
          text(f.provenance,9,false,false,1.15);
          if(previousColumns===2){columns=previousColumns;addPage();}
        }
        else{
          for(let r=0;r<block.rows.length;r++){
            const cells=block.rows[r],cellWidth=width()/Math.max(...block.rows.map(row=>row.length));
            pdf.font(r===0?"AcademicBold":"Academic").fontSize(9);
            const wrapped=cells.map(c=>wrap(c,cellWidth-10)),max=Math.max(...wrapped.map(c=>c.length));
            // Render line-by-line so tall rows can flow without clipping.
            for(let n=0;n<max;n++){
              ensure(15);
              cells.forEach((_,i)=>{pdf.rect(x()+i*cellWidth,y,cellWidth,15).strokeColor("#777777").stroke();pdf.text(wrapped[i][n]??"",x()+i*cellWidth+5,y+2,{width:cellWidth-10,lineBreak:false});});
              y+=15;
            }
          }
          y+=10;
        }
      }
      // Fill contents after actual body pagination is known.
      contentsPages.forEach((page,n)=>{
        pdf.switchToPage(page);pdf.font("AcademicBold").fontSize(18).text(n?"Contents (continued)":"Contents",l.margins.left,l.margins.top,{lineBreak:false});
        toc.slice(n*22,(n+1)*22).forEach((entry,i)=>{
          const yy=l.margins.top+40+i*27;
          pdf.font("Academic").fontSize(10).text(entry.title,l.margins.left,yy,{width:fullWidth-45,height:25,ellipsis:true});
          pdf.text(String(entry.page),pdf.page.width-l.margins.right-40,yy,{width:40,align:"right",lineBreak:false});
        });
      });
      const roman=(n:number)=>{let s="";for(const [v,c]of [[100,"c"],[90,"xc"],[50,"l"],[40,"xl"],[10,"x"],[9,"ix"],[5,"v"],[4,"iv"],[1,"i"]] as const)while(n>=v){s+=c;n-=v;}return s;};
      const total=pdf.bufferedPageRange().count;
      for(let p=0;p<total;p++){
        if(l.thesis&&p<prelimStart)continue;
        if(id==="iit-bombay"&&p===bodyStart)continue;
        pdf.switchToPage(p);
        const number=l.thesis&&p<bodyStart?roman(p-prelimStart+(id==="stanford"?4:id==="harvard"?3:2)):String(l.thesis?p-bodyStart+1:p+1);
        const bottom=pdf.page.margins.bottom;
        pdf.page.margins.bottom=0;
        pdf.font("Academic").fontSize(10).text(number,0,pdf.page.height-40,{width:pdf.page.width,align:"center",lineBreak:false});
        pdf.page.margins.bottom=bottom;
      }
      pdf.end();
    }catch(error){pdf.destroy();reject(error);}
  });
}
