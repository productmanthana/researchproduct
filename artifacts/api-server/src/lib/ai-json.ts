import { openai } from "@workspace/integrations-openai-ai-server";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
export async function jsonCall(system:string,body:any[]) {
  const [response]=await batchProcess([0],()=>openai.chat.completions.create({
    model:"gpt-4.1",max_completion_tokens:8192,response_format:{type:"json_object"},
    messages:[{role:"system",content:system},{role:"user",content:body}],
  },{timeout:180000,maxRetries:0}),{concurrency:1,retries:2});
  if(!response || response.choices[0]?.finish_reason!=="stop") throw new Error("Incomplete model response");
  return {value:JSON.parse(response.choices[0]?.message.content??"{}"),usage:response.usage};
}
