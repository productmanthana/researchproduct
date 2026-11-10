import { paidOpenAI, CHAT_MODEL } from "./ai-budget";
import { liveDeltaWriter } from "./live-generation";
import { ACADEMIC_STYLE } from "./academic-style";
export async function jsonCall(system:string,body:any[],model=CHAT_MODEL,live=false) {
  system += "\nUser-facing product wording: identify the assistant as Evidora, not an underlying model or provider. Do not disclose or speculate about the implementation's model/provider names. This does not prohibit accurately discussing AI models as research subjects in the supplied evidence.";
  system += `\nFor user-facing prose only (preserve the required output schema): ${ACADEMIC_STYLE}`;
  const textSize = system.length + body.filter(p=>p.type==="text").reduce((n,p)=>n+p.text.length,0);
  const images = body.filter(p=>p.type==="image_url").length;
  // UTF-8 byte count bounds text tokens conservatively; image reserve covers
  // high-detail 1600px page renders and the 15MB screenshot upload limit.
  const inputReserve = Buffer.byteLength(system)+body.filter(p=>p.type==="text").reduce((n,p)=>n+Buffer.byteLength(p.text),0)+images*16000+1024;
  if(textSize>800000) throw new Error("Evidence context exceeds safe analysis size");
  const response=await paidOpenAI("chat/completions",{
    model,max_completion_tokens:8192,response_format:{type:"json_object"},
    messages:[{role:"system",content:system},{role:"user",content:body}],
  },inputReserve,8192,live?liveDeltaWriter():undefined);
  if(!response || response.choices[0]?.finish_reason!=="stop") throw new Error("Incomplete model response");
  return {value:JSON.parse(response.choices[0]?.message.content??"{}"),usage:response.usage};
}
export const liveJsonCall=(system:string,body:any[],model=CHAT_MODEL)=>jsonCall(system,body,model,true);
