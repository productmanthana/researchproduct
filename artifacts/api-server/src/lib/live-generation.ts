import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "@workspace/db";
export type LiveKind="analysis"|"studio";
const context=new AsyncLocalStorage<{kind:LiveKind;id:string;previous?:string}>();
export const liveKey=(kind:LiveKind,id:string)=>`generation-live:${kind}:${id}`;
export const withLiveGeneration=<T>(kind:LiveKind,id:string,run:()=>Promise<T>)=>context.run({kind,id},run);
export async function clearLive(kind:LiveKind,id:string){await pool.query("DELETE FROM research_search_cache WHERE key=$1",[liveKey(kind,id)]);}

export type LiveProgress = { detail: string; pass?: number; passes?: number; revised?: number; total?: number; since: string };

/**
 * Publishes a full draft snapshot with an optional progress line. Used by stages that
 * rewrite finished text (authorship, checks) where nothing streams token by token.
 */
export async function publishLive(kind: LiveKind, id: string, draft: string, progress?: LiveProgress) {
  const data = { draft: draft.slice(0, 100000), updatedAt: new Date().toISOString(), ...(progress ? { progress } : {}) };
  await pool.query(
    "INSERT INTO research_search_cache(key,data,expires_at) VALUES($1,$2,now()+interval '1 hour') ON CONFLICT(key) DO UPDATE SET data=$2,expires_at=excluded.expires_at",
    [liveKey(kind, id), JSON.stringify(data)],
  );
}

/** Whitelisted user-facing JSON string fields only. Never exposes raw JSON, quotes or reasoning. */
export function visibleDraft(json:string){
  // Intent routing is also streamed. Research routing replies are not evidence
  // answers and must not briefly appear as scientific findings in the chat.
  if(/^\s*\{\s*"intent"\s*:/.test(json)){
    if(!/^\s*\{\s*"intent"\s*:\s*"guidance"/.test(json))return "";
  }
  const pattern=/"(content|text|reply|title|caption|description|explanation|proposedText|problem|question|method|feasibility)"\s*:\s*"/g;
  const ideaStart=/"ideas"\s*:\s*\[/.exec(json)?.index;
  const ideaLabels:Record<string,string>={problem:"Research problem",question:"Research question",method:"Proposed method",feasibility:"Feasibility"};
  const parts:string[]=[];let m:RegExpExecArray|null,ideaNumber=0;
  while((m=pattern.exec(json))){
    let at=pattern.lastIndex,raw="",escape=false;
    for(;at<json.length;at++){
      const char=json[at];
      if(char==='"'&&!escape)break;
      raw+=char;
      if(escape)escape=false;else if(char==="\\")escape=true;
    }
    // Ignore incomplete escapes until their next delta arrives.
    raw=raw.replace(/\\(?:u[0-9a-f]{0,3})?$/i,"");
    try{
      const text=JSON.parse('"'+raw+'"');
      const inIdeas=ideaStart!==undefined&&m.index>ideaStart;
      if(text.trim()){
        if(inIdeas&&m[1]==="title")parts.push(`### Idea ${++ideaNumber}: ${text}`);
        else if(inIdeas&&ideaLabels[m[1]])parts.push(`**${ideaLabels[m[1]]}**\n\n${text}`);
        else if(!ideaLabels[m[1]])parts.push(text);
      }
    }catch{/* partial JSON codepoint */}
    pattern.lastIndex=at+1;
  }
  return parts.join("\n\n").slice(0,100000);
}
export function liveDeltaWriter(){
  const job=context.getStore();if(!job)return undefined;
  const prefix=job.previous?job.previous+"\n\n":"";
  let json="",lastAt=0,lastText="";
  return async(delta:string,flush=false)=>{
    json+=delta;
    if(!flush&&Date.now()-lastAt<350)return;
    const draft=(prefix+visibleDraft(json)).slice(0,100000);
    if(flush)job.previous=draft;
    if(draft===lastText)return;
    lastAt=Date.now();lastText=draft;
    await pool.query("INSERT INTO research_search_cache(key,data,expires_at) VALUES($1,$2,now()+interval '1 hour') ON CONFLICT(key) DO UPDATE SET data=$2,expires_at=excluded.expires_at",
      [liveKey(job.kind,job.id),JSON.stringify({draft,updatedAt:new Date().toISOString()})]);
  };
}
