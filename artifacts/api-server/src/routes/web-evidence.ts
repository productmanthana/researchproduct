import { Router } from "express";
import { getAuth } from "@clerk/express";
import { requireUser } from "../lib/common";
import { GetWebEvidenceQueryParams,GetWebEvidenceResponse } from "@workspace/api-zod";
import { searchWeb } from "../lib/web-evidence";
const router=Router();
router.get("/web-evidence",requireUser,async(req,res)=>{
  const {q}=GetWebEvidenceQueryParams.parse(req.query);
  res.json(GetWebEvidenceResponse.parse(await searchWeb(q,getAuth(req).userId??undefined)));
});
export default router;
