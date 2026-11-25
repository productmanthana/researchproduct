import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

/**
 * Sends the Clerk session token with every API request.
 *
 * API calls only carry a Clerk `__session` cookie when the frontend runs
 * behind the Clerk proxy. Local development and the preview talk to the
 * Clerk instance directly, so the bearer token is the only credential the
 * API server can verify.
 */
export function ApiAuthBridge() {
  const { getToken, isSignedIn } = useAuth();

  // Assigned during render, before any sibling query effect fires, so the
  // first request already carries the token.
  setAuthTokenGetter(isSignedIn ? getToken : null);

  useEffect(() => () => setAuthTokenGetter(null), []);

  return null;
}
