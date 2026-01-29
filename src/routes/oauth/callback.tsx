import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallback,
});

function OAuthCallback() {
  const { translate: t } = useTranslation();

  useEffect(() => {
    // Parse the hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const apiKey = params.get("api_key");
    const files = params.get("files");

    if (apiKey && window.opener) {
      // Send the API key to the opener
      window.opener.postMessage(
        { type: "oauth-callback", apiKey, files },
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
      <p>{t("Autenticando...")}</p>
    </div>
  );
}
