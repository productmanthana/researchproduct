/** Once a job has streamed text, later pauses or verification stages must not reopen its popup. */
export function streamHasStarted(previous: boolean | undefined, text: string): boolean {
  return !!previous || text.trim().length > 0;
}

export function showProgressPopup(job: { streamStarted?: boolean; openedAfterStreaming?: boolean }, minimised: boolean): boolean {
  return !minimised && (!job.streamStarted || !!job.openedAfterStreaming);
}
