import {savedCustomFormat,type CustomFormat} from "./custom-format";

export function generationCustomFormat(request:{customFormat?:CustomFormat},parent:any,selectedTemplateId?:string){
  if(request.customFormat)return request.customFormat;
  // An explicit change of official target must not silently retain the old
  // personal layout. Otherwise keep the author's earlier saved preferences.
  if(parent&&selectedTemplateId!==parent.metadata?.templateId)return undefined;
  return savedCustomFormat(parent??{});
}
export function generationFiguresEnabled(request:{includeFigures?:boolean},parent:any){
  return request.includeFigures??parent?.metadata?.includeFigures??parent?.metadata?.request?.includeFigures??true;
}
