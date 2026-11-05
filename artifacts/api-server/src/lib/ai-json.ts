import { paidOpenAI, CHAT_MODEL } from "./ai-budget";
export async function jsonCall(system:string,body:any[]) {
  const textSize = system.length + body.filter(p=>p.type==="text").reduce((n,p)=>n+p.text.length,0);
  const images = body.filter(p=>p.type==="image_url").length;
  // UTF-8 byte count bounds text tokens conservatively; image reserve covers
  // high-detail 1600px page renders and the 15MB screenshot upload limit.
  const inputReserve = Buffer.byteLength(system)+body.filter(p=>p.type==="text").reduce((n,p)=>n+Buffer.byteLength(p.text),0)+images*16000+1024;
  if(textSize>800000) throw new Error("Evidence context exceeds safe analysis size");
  const response=await paidOpenAI("chat/completions",{
    model:CHAT_MODEL,max_completion_tokens:8192,response_format:{type:"json_object"},
    messages:[{role:"system",content:system},{role:"user",content:body}],
  },inputReserve,8192);
  if(!response || response.choices[0]?.finish_reason!=="stop") throw new Error("Incomplete model response");
  return {value:JSON.parse(response.choices[0]?.message.content??"{}"),usage:response.usage};
}
