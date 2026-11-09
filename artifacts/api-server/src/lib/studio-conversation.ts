import { pool } from "@workspace/db";

type Row={id:string;owner_id:string;project_id:string;kind:string;title:string;content:string;status?:string;parent_id?:string|null;metadata?:Record<string,any>};
type Turn={id:string;kind:string;title:string;question:string|null;answer:string;projectScreen?:string};

/** Failed messages can anchor an exact retry, never act as arbitrary scientific context. */
export function validStudioContext(parent:{project_id:string;kind:string;status:string;metadata?:Record<string,any>},request:{projectId:string;kind:string;prompt:string}) {
  const previous=parent.metadata?.request?.prompt;
  return parent.project_id===request.projectId&&(parent.status==="completed"||
    parent.status==="failed"&&parent.kind==="answer"&&request.kind==="answer"&&
    typeof previous==="string"&&request.prompt.trim()===previous.trim());
}

/** Chat ancestry lives in request.parentId; parent_id represents saved document revisions. */
export function studioConversation(rows:Row[],parentId:string,owner:string,projectId:string) {
  const owned=new Map(rows.filter(row=>row.owner_id===owner&&row.project_id===projectId).map(row=>[row.id,row]));
  const seen=new Set<string>(),newest:Turn[]=[];
  let id:string|undefined=parentId,latest:Row|undefined,trimmed=false;
  for(let depth=0;id&&depth<64;depth++){
    if(seen.has(id)){trimmed=true;break;}
    seen.add(id);
    const row=owned.get(id);
    if(!row){trimmed=true;break;}
    latest??=row;
    if(row.parent_id){id=row.parent_id;continue;}
    newest.push({id:latest.id,kind:latest.kind,title:latest.title,question:typeof row.metadata?.request?.prompt==="string"?row.metadata.request.prompt:typeof row.metadata?.analysisQuestion==="string"?row.metadata.analysisQuestion:null,answer:latest.status==="failed"?"":latest.content,
      ...(typeof latest.metadata?.reviewSummary==="string"?{projectScreen:latest.metadata.reviewSummary}:{})});
    // A saved AI Chat handoff keeps its earlier owned dialogue as context, not new evidence.
    const imported=Array.isArray(row.metadata?.analysisHistory)?row.metadata.analysisHistory.slice(-6):[];
    for(let i=imported.length-1;i>=0;i--){
      const old=imported[i];
      if(typeof old?.question==="string"&&typeof old?.answer==="string")
        newest.push({id:`${row.id}:chat-${i}`,kind:"answer",title:old.question,question:old.question,answer:old.answer});
    }
    latest=undefined;
    const previous=row.metadata?.request?.parentId;
    id=typeof previous==="string"&&previous?previous:undefined;
  }
  if(id&&seen.size>=64)trimmed=true;
  // Keep useful recent dialogue without sending an unbounded project archive to the model.
  let remaining=20000;
  const turns:Turn[]=[];
  for(const turn of newest.slice(0,12)){
    if(remaining<=0){trimmed=true;break;}
    const question=turn.question?.slice(0,Math.min(5000,remaining))??null;
    remaining-=question?.length??0;
    const answer=turn.answer.slice(0,Math.min(4500,remaining));
    remaining-=answer.length;
    const projectScreen=turn.projectScreen?.slice(0,Math.min(3000,remaining));
    remaining-=projectScreen?.length??0;
    if(question!==turn.question||answer!==turn.answer||projectScreen!==turn.projectScreen)trimmed=true;
    turns.push({...turn,question,answer,...(turn.projectScreen!==undefined?{projectScreen:projectScreen??""}:{})});
  }
  if(newest.length>12)trimmed=true;
  return {turns:turns.reverse(),trimmed};
}

export async function loadStudioConversation(parentId:string,owner:string,projectId:string) {
  const {rows}=await pool.query(`WITH RECURSIVE ancestry AS (
    SELECT s.id,s.owner_id,s.project_id,s.kind,s.title,s.status,left(s.content,4501) AS content,s.parent_id,
      jsonb_build_object('request',s.metadata->'request','analysisQuestion',s.metadata->'analysisQuestion','analysisHistory',s.metadata->'analysisHistory','reviewSummary',left((s.metadata->'review')::text,6000)) AS metadata,ARRAY[s.id] AS path,0 AS depth FROM research_studio_items s
      WHERE s.id::text=$1 AND s.owner_id=$2 AND s.project_id=$3 AND s.status IN('completed','failed')
    UNION ALL
    SELECT p.id,p.owner_id,p.project_id,p.kind,p.title,p.status,left(p.content,4501),p.parent_id,
      jsonb_build_object('request',p.metadata->'request','analysisQuestion',p.metadata->'analysisQuestion','analysisHistory',p.metadata->'analysisHistory','reviewSummary',left((p.metadata->'review')::text,6000)),a.path||p.id,a.depth+1 FROM ancestry a JOIN research_studio_items p
      ON p.id::text=coalesce(a.parent_id::text,a.metadata#>>'{request,parentId}')
      AND p.owner_id=$2 AND p.project_id=$3 AND p.status IN('completed','failed')
      WHERE a.depth<63 AND NOT p.id=ANY(a.path)
  ) SELECT * FROM ancestry ORDER BY depth`,[parentId,owner,projectId]);
  return studioConversation(rows,parentId,owner,projectId);
}
