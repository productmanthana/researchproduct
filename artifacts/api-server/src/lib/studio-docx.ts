import { Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,Footer,PageNumber,NumberFormat,SectionType,TableOfContents,AlignmentType,ImageRun } from "docx";
import { documentBlocks,documentLayout,sectionText } from "./studio-formatting";
import { referencedFigures } from "./scientific-figures";
import { figurePng,figureAspect } from "./figure-renderer";
export async function renderStudioWord(row:any):Promise<Buffer>{
  const id=row.metadata?.templateId,l=documentLayout(id),d=row.metadata?.documentDetails??{};
  const figures=referencedFigures(row.content,row.metadata?.figures??[]);
  const images=new Map(await Promise.all(figures.map(async f=>[f.id,await figurePng(f)] as const)));
  const title=row.title,body=row.content.replace(new RegExp("^# "+title.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*\\n"),"");
  const paragraph=(text:string,center=false)=>new Paragraph({children:[new TextRun(text)],alignment:center?AlignmentType.CENTER:undefined,spacing:{after:160,line:Math.round(l.lineSpacing*240)},widowControl:true});
  const blocks=(text:string,columns=l.columns)=>{
    const result:(Paragraph|Table)[]=[];
    for(const b of documentBlocks(text)){
      if(b.kind==="heading")result.push(new Paragraph({text:b.text,heading:b.level===1?HeadingLevel.HEADING_1:b.level===2?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3,keepNext:true,pageBreakBefore:l.thesis&&/^(chapter\s+\d|introduction|conclusions?)/i.test(b.text)}));
      else if(b.kind==="table")result.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:b.rows.map((r,i)=>new TableRow({tableHeader:i===0,children:r.map(text=>new TableCell({children:[new Paragraph({text,spacing:{line:240}})]}))}))}));
      else if(b.kind==="figure"){
        const f=figures.find(f=>f.id===b.id)!;
        const width=Math.floor(((l.size==="A4"?595.28:612)-l.margins.left-l.margins.right-(columns===2?18:0))/columns*96/72);
        const height=Math.min(id==="academic-report"?340:650,Math.round(width*figureAspect(f))),imageWidth=Math.round(height/figureAspect(f));
        result.push(new Paragraph({keepNext:true,children:[new ImageRun({type:"png",data:images.get(f.id)!,transformation:{width:imageWidth,height},altText:{title:f.title,description:f.caption,name:f.id}})]}));
        result.push(paragraph(`Figure ${figures.indexOf(f)+1}. ${f.title}. ${f.caption}`));
        if(f.explanation&&id!=="academic-report")result.push(paragraph(f.explanation));
        result.push(paragraph(f.provenance));
      }else result.push(paragraph(b.text));
    }
    return result;
  };
  const page={size:l.size==="A4"?{width:11906,height:16838}:{width:12240,height:15840},margin:{top:l.margins.top*20,bottom:l.margins.bottom*20,left:l.margins.left*20,right:l.margins.right*20,footer:720}};
  const footer=new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({children:[PageNumber.CURRENT]})]})]});
  const titleParagraphs=[
    new Paragraph({text:id==="stanford"?title.toUpperCase():title,heading:HeadingLevel.TITLE,alignment:id==="academic-report"?AlignmentType.LEFT:AlignmentType.CENTER,spacing:{before:id==="academic-report"?0:1440,after:id==="academic-report"?240:600}}),
    ...(["journal","synopsis","thesis"].includes(row.kind)||l.thesis?[paragraph(d.author||"[Author name required]",true),paragraph(d.affiliation||"[Affiliation required]",true)]:d.author?[paragraph(d.author,true)]:[]),
    ...(l.thesis?[paragraph(`Submitted in partial fulfillment of the requirements for ${d.degree||"[degree required]"}`,true),paragraph(d.department||"[Department required]",true),paragraph(`Supervisor/advisor: ${d.supervisor||"[name required]"}`,true),...(d.studentId?[paragraph(`Student ID: ${d.studentId}`,true)]:[]),paragraph(d.year||"[Submission date required]",true)]:[]),
  ];
  const sections:any[]=[];
  if(l.thesis){
    sections.push({properties:{page,type:SectionType.NEXT_PAGE},children:titleParagraphs});
    if(id==="harvard")sections.push({properties:{page,type:SectionType.NEXT_PAGE},children:[paragraph(`© ${d.year||"[year]"} ${d.author||"[author]"}. All rights reserved.`,true)]});
    const abstract=sectionText(body,"Abstract");
    const contentWithoutAbstract=abstract?body.replace(/^#{1,3}\s+Abstract\s*\n[\s\S]*?(?=^#{1,3}\s|(?![\s\S]))/im,""):body;
    sections.push({properties:{page:{...page,pageNumbers:{start:id==="stanford"?4:id==="harvard"?3:2,formatType:NumberFormat.LOWER_ROMAN}},type:SectionType.NEXT_PAGE},footers:{default:footer},children:[new Paragraph({text:"Abstract",heading:HeadingLevel.HEADING_1}),paragraph(abstract||"[Abstract required — add your research abstract before submission.]")]});
    sections.push({properties:{page:{...page,pageNumbers:{formatType:NumberFormat.LOWER_ROMAN}},type:SectionType.NEXT_PAGE},footers:{default:footer},children:[new Paragraph({text:"Contents",heading:HeadingLevel.TITLE}),new TableOfContents("Contents",{hyperlink:true,headingStyleRange:"1-3"})]});
    sections.push({properties:{page:{...page,pageNumbers:{start:1,formatType:NumberFormat.DECIMAL}},type:SectionType.NEXT_PAGE},footers:{default:footer},children:blocks(contentWithoutAbstract)});
  }else{
    sections.push({properties:{page},children:titleParagraphs});
    // Wide scientific figures span journal columns instead of shrinking labels
    // into unreadable thumbnails. Text resumes the selected profile afterwards.
    const segments:string[]=l.columns===2?body.split(/(^\s*\[\[figure:[a-zA-Z0-9_-]+\]\]\s*$)/m):[body];
    for(const segment of segments.filter(s=>s.trim())){
      const columns=/^\s*\[\[figure:[a-zA-Z0-9_-]+\]\]\s*$/.test(segment)?1:l.columns;
      sections.push({properties:{page,column:{count:columns,space:360,equalWidth:true},type:SectionType.CONTINUOUS},footers:{default:footer},children:blocks(segment,columns)});
    }
  }
  return Packer.toBuffer(new Document({title,creator:d.author||"Evidora",features:{updateFields:true},
    styles:{default:{document:{run:{font:"Times New Roman",size:l.fontSize*2,color:"000000"},paragraph:{spacing:{line:Math.round(l.lineSpacing*240)}}}}},
    sections}));
}
