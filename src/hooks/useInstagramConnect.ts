import { useState } from "react";
import { getInstagramAuthorizeUrl } from "@/queries/useInstagramSignup";

// Where Instagram redirects back to after the user authorizes. Must match a
// redirect URI registered in the Meta app dashboard. It's a standalone route
// (not under `_auth`) so the return page is a bare "connecting" screen rather
// than the whole app shell.
export const IG_INAPP_REDIRECT_PATH = "/oauth/instagram";

// The scope is chosen before the redirect but spent on the way back, after a
// round trip through Instagram — so it waits in localStorage beside the CSRF
// state.
export const IG_OAUTH_AGENT_KEY = "ig_oauth_agent_id";

/**
 * Connects an Instagram account, or connects one again: Instagram Business
 * Login is a plain redirect OAuth (no SDK/popup like WhatsApp). The whole tab
 * goes to Instagram so the token exchange happens back in this same tab —
 * scoped to the active org — with no fragile cross-tab handoff (which COOP +
 * background-tab throttling make unreliable). `agentId` makes the account
 * personal; absent is the organization's.
 */
export function useInstagramConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const connect = (agentId: string | undefined) => {
    setError(false);
    setLoading(true);

    const state = crypto.randomUUID();
    const redirect_uri = `${window.location.origin}${IG_INAPP_REDIRECT_PATH}`;
    // Read back on return to validate against CSRF.
    localStorage.setItem("ig_oauth_state", state);

    if (agentId) {
      localStorage.setItem(IG_OAUTH_AGENT_KEY, agentId);
    } else {
      localStorage.removeItem(IG_OAUTH_AGENT_KEY);
    }

    getInstagramAuthorizeUrl(redirect_uri, state)
      .then((url) => window.location.assign(url))
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  return { connect, loading, error };
}
