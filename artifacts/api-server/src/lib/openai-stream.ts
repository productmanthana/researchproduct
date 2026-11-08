/** Parse fragmented SSE, retaining usage and the final stop reason for billing/validation. */
export async function readOpenAIStream(response:Response,onDelta:(text:string,flush?:boolean)=>Promise<void>){
  if(!response.body)throw new Error("Missing streaming response body");
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let buffer="",content="",finish:string|null=null,usage:any,done=false;
  function parseFrame(frame:string){
    const payload=frame.split("\n").filter(l=>l.startsWith("data:")).map(l=>l.slice(5).trimStart()).join("\n").trim();
    if(!payload)return null;
    if(payload==="[DONE]"){done=true;return null;}
    const event=JSON.parse(payload);
    if(event.error)throw new Error("Model stream failed");
    if(event.usage)usage=event.usage;
    const choice=event.choices?.[0];
    if(choice?.finish_reason)finish=choice.finish_reason;
    return typeof choice?.delta?.content==="string"?choice.delta.content:null;
  }
  try{
    while(true){
      const chunk=await reader.read();
      buffer+=decoder.decode(chunk.value??new Uint8Array(),{stream:!chunk.done});
      buffer=buffer.replace(/\r\n/g,"\n");
      let boundary:number;
      while((boundary=buffer.indexOf("\n\n"))>=0){
        const frame=buffer.slice(0,boundary);buffer=buffer.slice(boundary+2);
        const delta=parseFrame(frame);if(delta){content+=delta;await onDelta(delta);}
      }
      if(chunk.done)break;
    }
    if(buffer.trim()){const delta=parseFrame(buffer);if(delta){content+=delta;await onDelta(delta);}}
    if(!done||!finish||!usage)throw new Error("Incomplete model stream");
    await onDelta("",true);
    return {choices:[{message:{content},finish_reason:finish}],usage};
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
