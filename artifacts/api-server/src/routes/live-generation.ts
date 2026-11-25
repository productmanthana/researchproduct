import { Router } from "express";
import { uid,requireUser } from "../lib/common";
import { pool } from "@workspace/db";
import { liveKey, type LiveKind } from "../lib/live-generation";
const router=Router();
const connections=new Map<string,number>();
router.get("/live/:kind/:id",requireUser,async(req,res)=>{
  const kind=req.params.kind as LiveKind,id=String(req.params.id),owner=uid(req);
  if(!["analysis","studio"].includes(kind)||!/^[\w-]{1,100}$/.test(id)){res.status(400).json({error:"Invalid generation"});return;}
  const table=kind==="studio"?"research_studio_items":"research_analyses";
  const read=async()=>{
    const row=(await pool.query(`SELECT status,${kind==="studio"?"metadata":"input"} AS details FROM ${table} WHERE id=$1 AND owner_id=$2`,[id,owner])).rows[0];
    if(!row)return null;
    const active=["queued","running"].includes(row.status);
    const live=active?(await pool.query("SELECT data FROM research_search_cache WHERE key=$1 AND expires_at>now()",[liveKey(kind,id)])).rows[0]?.data:null;
    return {id,status:row.status,stage:row.details?.stage??row.status,draft:live?.draft??"",updatedAt:live?.updatedAt??null,progress:live?.progress??null};
  };
  let snapshot=await read();if(!snapshot){res.status(404).json({error:"Generation not found"});return;}
  if((connections.get(owner)??0)>=8){res.status(429).json({error:"Too many live views. Close another view and retry."});return;}
  connections.set(owner,(connections.get(owner)??0)+1);
  res.set({"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"});
  res.flushHeaders();let closed=false,last="",lastHeartbeat=0;
  res.on("close",()=>{closed=true;});
  try{
    const end=Date.now()+60000;
    while(!closed&&Date.now()<end){
      if(!snapshot){res.write('event: gone\ndata: {}\n\n');break;}
      const data=JSON.stringify(snapshot),terminal=!["queued","running"].includes(snapshot.status);
      if(data!==last||terminal){res.write(`event: ${terminal?"done":"snapshot"}\ndata: ${data}\n\n`);last=data;}
      if(terminal)break;
      if(Date.now()-lastHeartbeat>10000){res.write(": heartbeat\n\n");lastHeartbeat=Date.now();}
      await new Promise(resolve=>setTimeout(resolve,750));
      if(!closed)snapshot=await read();
    }
  }catch{if(!closed)res.write('event: reconnect\ndata: {}\n\n');}
  finally{const n=(connections.get(owner)??1)-1;if(n>0)connections.set(owner,n);else connections.delete(owner);if(!closed)res.end();}
});
export default router;
