import { useState } from "react";
import { getTikTokAuthorizeUrl } from "@/queries/useTikTokSignup";

// Where TikTok redirects back to after the account authorizes — the app's one
// redirect URL registered in the TikTok developer portal, so the in-app
// connect and the public onboarding links both come back here. It's a
// standalone route (not under `_auth`) so the return page is a bare
// "connecting" screen rather than the whole app shell.
export const TT_REDIRECT_PATH = "/oauth/tiktok";

// The in-app flow's CSRF state, read back on return.
export const TT_OAUTH_STATE_KEY = "tt_oauth_state";

// The scope is chosen before the redirect but spent on the way back, after a
// round trip through TikTok — so it waits in localStorage beside the CSRF
// state.
export const TT_OAUTH_AGENT_KEY = "tt_oauth_agent_id";

// An onboarding link's `state`: this prefix, then the onboarding token. The
// return page tells the two flows apart by it.
export const TT_ONBOARD_STATE_PREFIX = "onboard:";

/**
 * Connects a TikTok account, or connects one again: a plain redirect OAuth.
 * The whole tab goes to TikTok so the token exchange happens back in this
 * same tab — scoped to the active org. `agentId` makes the account personal;
 * absent is the organization's.
 */
export function useTikTokConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const connect = (agentId: string | undefined) => {
    setError(false);
    setLoading(true);

    const state = crypto.randomUUID();
    const redirect_uri = `${window.location.origin}${TT_REDIRECT_PATH}`;
    localStorage.setItem(TT_OAUTH_STATE_KEY, state);

    if (agentId) {
      localStorage.setItem(TT_OAUTH_AGENT_KEY, agentId);
    } else {
      localStorage.removeItem(TT_OAUTH_AGENT_KEY);
    }

    getTikTokAuthorizeUrl(redirect_uri, state)
      .then((url) => window.location.assign(url))
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  };

  return { connect, loading, error };
}
