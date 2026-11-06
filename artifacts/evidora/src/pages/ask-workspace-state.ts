export function askSendDisabled({
  limitReached,
  blocked,
  pending,
  loading,
}: {
  limitReached: boolean;
  blocked: boolean;
  pending: boolean;
  loading: boolean;
}) {
  // A limit action remains clickable so the user can read the specific limit toast.
  return limitReached ? pending : blocked || pending || loading;
}
