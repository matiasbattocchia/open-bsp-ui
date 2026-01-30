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
    const url = params.get("url");
    const email = params.get("email");
    const files = params.get("files");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      document.body.innerText = `Error: ${error}`;
    } else if (apiKey && window.opener) {
      // Send the data to the opener
      window.opener.postMessage(
        { type: "oauth-callback", apiKey, url, email, files },
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
