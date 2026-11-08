import { AsyncLocalStorage } from "node:async_hooks";
import { pool } from "@workspace/db";
export type LiveKind="analysis"|"studio";
const context=new AsyncLocalStorage<{kind:LiveKind;id:string;previous?:string}>();
export const liveKey=(kind:LiveKind,id:string)=>`generation-live:${kind}:${id}`;
export const withLiveGeneration=<T>(kind:LiveKind,id:string,run:()=>Promise<T>)=>context.run({kind,id},run);
export async function clearLive(kind:LiveKind,id:string){await pool.query("DELETE FROM research_search_cache WHERE key=$1",[liveKey(kind,id)]);}

/** Whitelisted user-facing JSON string fields only. Never exposes raw JSON, quotes or reasoning. */
export function visibleDraft(json:string){
  const pattern=/"(content|text|reply|title|caption|description|explanation|proposedText)"\s*:\s*"/g;
  const parts:string[]=[];let m:RegExpExecArray|null;
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
    try{const text=JSON.parse('"'+raw+'"');if(text.trim())parts.push(text);}catch{/* partial JSON codepoint */}
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
