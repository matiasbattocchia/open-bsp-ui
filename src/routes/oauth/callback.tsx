import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  useEffect(() => {
    // Parse the hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const apiKey = params.get("api_key");

    if (apiKey && window.opener) {
      // Send the API key to the opener
      window.opener.postMessage(
        { type: "oauth-callback", apiKey },
        window.location.origin
      );
      // Close the popup
      window.close();
    } else if (!apiKey) {
      console.error("No API key found in callback URL");
      // Optional: Display error to user before closing
      document.body.innerText = "Error: No API key received.";
    }
  }, []);

  return (
    <div className="flex items-center justify-center p-8">
      <p>Autenticando...</p>
    </div>
  );
}
