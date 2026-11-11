import { randomUUID } from "node:crypto";
import { Router } from "express";
import { ApplyCustomFormatBody,SaveCustomFormatBody,ImportCustomFormatBody } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { requireUser,uid,routeId,HttpError } from "../lib/common";
import { ownedStudio,studioView } from "../lib/studio-store";
import { ownedDocument,readDocument,DOCX } from "../lib/documents";
import { customFormatContent,customFormatSchema,customFormatWarnings,defaultCustomFormat,savedCustomFormat } from "../lib/custom-format";
import { importWordLayout,wordTemplateXml } from "../lib/custom-format-import";
import { documentLayoutFor } from "../lib/studio-formatting";
import { syncProjectItem } from "../lib/studio-index";
import { logger } from "../lib/logger";
const router=Router();router.use("/studio",requireUser);
const view=(row:any)=>({id:row.id,name:row.name,kind:row.kind??undefined,format:row.format,updatedAt:new Date(row.updated_at).toISOString()});
async function validateInstructions(format:any,owner:string){
  if(format.instructionsDocumentId){
    const doc=await ownedDocument(format.instructionsDocumentId,owner);
    if(doc.status!=="ready")throw new HttpError(400,"Wait until your instructions file has finished processing.");
  }
}
router.get("/studio/custom-formats",async(req,res)=>{
  const {rows}=await pool.query("SELECT * FROM research_custom_formats WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 100",[uid(req)]);
  res.json(rows.map(view));
});
router.post("/studio/custom-formats",async(req,res)=>{
  const b=SaveCustomFormatBody.parse(req.body),owner=uid(req);
  if(!b.name.trim())throw new HttpError(400,"Give your format a name.");
  await validateInstructions(b.format,owner);
  if(b.id){
    const {rows}=await pool.query("UPDATE research_custom_formats SET name=$3,kind=$4,format=$5,updated_at=now() WHERE id=$1 AND owner_id=$2 RETURNING *",[b.id,owner,b.name.trim(),b.kind??null,JSON.stringify(b.format)]);
    if(!rows[0])throw new HttpError(404,"Personal format not found.");res.json(view(rows[0]));
  }else{
    const {rows}=await pool.query("INSERT INTO research_custom_formats(id,owner_id,name,kind,format) SELECT $1,$2,$3,$4,$5 WHERE (SELECT count(*) FROM research_custom_formats WHERE owner_id=$2)<100 RETURNING *",[randomUUID(),owner,b.name.trim(),b.kind??null,JSON.stringify(b.format)]);
    if(!rows[0])throw new HttpError(400,"You can keep up to 100 personal formats. Remove an unused one first.");res.json(view(rows[0]));
  }
});
router.delete("/studio/custom-formats/:id",async(req,res)=>{
  const {rowCount}=await pool.query("DELETE FROM research_custom_formats WHERE id=$1 AND owner_id=$2",[routeId(req),uid(req)]);
  if(!rowCount)throw new HttpError(404,"Personal format not found.");res.status(204).end();
});
router.post("/studio/custom-formats/import",async(req,res)=>{
  const b=ImportCustomFormatBody.parse(req.body),doc=await ownedDocument(b.documentId,uid(req));
  if(doc.status!=="ready")throw new HttpError(400,"Wait until your file has finished processing.");
  let result={format:defaultCustomFormat(documentLayoutFor({metadata:{}})),warnings:["PDF instructions were imported as text. Page geometry and styling were not inferred: choose the supported settings yourself."]};
  if(doc.content_type===DOCX||/\.docx$/i.test(doc.name))result=importWordLayout(await wordTemplateXml(await readDocument(doc)));
  else if(doc.content_type!=="application/pdf")throw new HttpError(400,"Choose a processed PDF or Word (.docx) file.");
  const text=(doc.pages??[]).map((p:any)=>p.text??"").join("\n\n");
  result.format.instructions=text.slice(0,16000);
  if(text.length>16000)result.warnings.push("Only the first 16,000 characters were imported. Review the rest of the source separately.");
  result.format.instructionsDocumentId=doc.id;
  if(!result.format.instructions.trim())result.warnings.push("No readable instructions were extracted. Enter your instructions manually; scanned PDFs may need text recognition.");
  res.json(result);
});
router.get("/studio/items/:id/custom-format",async(req,res)=>{
  const row=await ownedStudio(routeId(req),uid(req));
  const format=savedCustomFormat(row)??defaultCustomFormat(documentLayoutFor(row));
  res.json({format,warnings:customFormatWarnings(row,format)});
});
router.post("/studio/items/:id/custom-format",async(req,res)=>{
  const format=customFormatSchema.parse(ApplyCustomFormatBody.parse(req.body).format),owner=uid(req);
  await validateInstructions(format,owner);
  const client=await pool.connect();
  let saved:any;
  try{
    await client.query("BEGIN");
    const {rows}=await client.query("SELECT * FROM research_studio_items WHERE id=$1 AND owner_id=$2 FOR UPDATE",[routeId(req),owner]);
    const source=rows[0];
    if(!source)throw new HttpError(404,"Document not found.");
    if(!["journal","thesis"].includes(source.kind)||source.status!=="completed")throw new HttpError(400,"Choose a completed journal or thesis draft.");
    const child=(await client.query("SELECT * FROM research_studio_items WHERE parent_id=$1 AND owner_id=$2",[source.id,owner])).rows[0];
    if(child){
      if(JSON.stringify(savedCustomFormat(child))!==JSON.stringify(format))throw new HttpError(409,"A newer revision exists. Open it before applying another format.");
      saved=child;
    }else{
      const metadata={...source.metadata,customFormat:format,customFormatWarnings:customFormatWarnings(source,format),customFormatStatus:"Customised — not verified",edited:true};
      for(const key of ["pdfExport","docxExport","review","reviewedAt"])delete metadata[key];
      const check=metadata.requirementsCheck;
      if(check)metadata.requirementsCheck={...check,officialLayout:check.officialLayout??check.appliedLayout,appliedLayout:{},checks:[{label:"Customised document",status:"manual",detail:"Personal formatting may differ from official requirements. Earlier content checks must be rerun.",action:"Check requirements & research again before submitting."}]};
      saved=(await client.query(`INSERT INTO research_studio_items(id,owner_id,project_id,kind,title,content,parent_id,revision,metadata)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[randomUUID(),owner,source.project_id,source.kind,source.title,customFormatContent(source.content,format,source.title),source.id,source.revision+1,JSON.stringify(metadata)])).rows[0];
    }
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  void syncProjectItem(saved.id,owner).catch(e=>logger.warn({itemId:saved.id,errorType:e instanceof Error?e.name:"unknown"},"Customised draft index sync unavailable"));
  res.json(studioView(saved));
});
export default router;
