import type { ReactNode } from "react";

// Isolated design fixture; never calls production APIs or spends AI credits.
export type Analysis = any;
export const previewAnalysis = {
  id: "preview", conversationId: "preview", mode: "ask", status: "completed",
  createdAt: "2026-11-05T13:00:00Z",
  question: "What methods have been studied to improve wind turbine efficiency?",
  content: "## Findings\n\nThe available abstracts discuss aerodynamic design, turbine control and performance assessment as approaches to wind turbine efficiency. [1]\n\n## Evidence limits\n\nThis illustrative answer is based on abstracts. It does not establish which method performs best.",
  searchQueries: ["wind turbine efficiency improvement"],
  warnings: ["Design preview: illustrative content, not a generated research answer.", "Abstract-only evidence. Full-text methods and figures were not reviewed."],
  sources: [{id:"source-1",title:"Wind turbine efficiency — illustrative source",url:null,evidenceLevel:"Abstract only",verification:"Not independently verified in this preview"}],
  claims: [{text:"Performance depends on operating conditions.",evidence:[{sourceId:"source-1",quote:"Illustrative evidence excerpt for design review only.",page:null}]}],
};
export function useSearch(){return "?t=preview";}
export function useLocation(){return ["/ask",()=>{}] as const;}
export function Link({children,href,...props}:any){return <a {...props} href={href} onClick={e=>e.preventDefault()}>{children}</a>;}
export function RequireAuth({children}: {children:ReactNode;what?:string}){return <main className="min-h-screen bg-background p-6 md:p-10"><p className="mb-4 text-xs text-muted-foreground">DESIGN PREVIEW · Illustrative content</p>{children}</main>;}
export function useQueryClient(){return {invalidateQueries:()=>{},setQueryData:()=>{}};}
export function useToast(){return {toast:()=>{}};}
export function useGetAnalysis(){return {data:previewAnalysis,isError:false,refetch:()=>{}};}
export function useListAnalyses(){return {data:[previewAnalysis],isLoading:false,isError:false};}
export function useGetUsage(){return {data:{answersLimit:3,answersUsed:1,period:"starter"}};}
export function useCreateAnalysis(){return {isPending:false,mutateAsync:async()=>previewAnalysis};}
export const getGetAnalysisQueryKey=()=>["preview"];
export const getListAnalysesQueryKey=()=>["preview"];
export const getGetUsageQueryKey=()=>["preview"];
export const getGetSummaryQueryKey=()=>["preview"];
