/**
 * Independent evidence retrieval may overlap, but no branch is abandoned when
 * another fails: paid requests must settle their accounting before a job fails.
 * Return named results so completion order cannot change citation ordering.
 */
export async function parallelEvidence<R,P,W>(tasks:{
  read:()=>Promise<R>;patents:()=>Promise<P>;web:()=>Promise<W>;
}):Promise<{read:R;patents:P;web:W}> {
  const [read,patents,web]=await Promise.allSettled([
    Promise.resolve().then(tasks.read),
    Promise.resolve().then(tasks.patents),
    Promise.resolve().then(tasks.web),
  ]);
  if(read.status==="rejected")throw read.reason;
  if(patents.status==="rejected")throw patents.reason;
  if(web.status==="rejected")throw web.reason;
  return {read:read.value,patents:patents.value,web:web.value};
}
