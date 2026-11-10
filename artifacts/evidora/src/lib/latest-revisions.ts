/** A reviewed working draft is a child of a report, not a replacement for it. */
export function visibleRevisions<T extends {id:string;parentId:string|null;kind:string;metadata:unknown;createdAt:string}>(items:T[]):T[]{
  const parents=new Set(items.map(i=>i.parentId).filter(Boolean));
  return items.filter(i=>!parents.has(i.id)||(i.kind==="document-review"&&(i.metadata as Record<string,unknown>|null)?.paperReview===true))
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
