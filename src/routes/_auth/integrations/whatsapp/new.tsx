import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";

export const Route = createFileRoute("/_auth/integrations/whatsapp/new")({
  component: WhatsAppNew,
});

function WhatsAppNew() {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const handleSuccess = (phone_number_id: string) => {
    navigate({
      to: "/integrations/whatsapp/$orgAddressId",
      params: { orgAddressId: phone_number_id },
      hash: (prevHash) => prevHash!,
    });
  };

  return (
    <>
      <SectionHeader title="Connect WhatsApp" />

      <SectionBody>
        <form>
          <div className="instructions">
            <p>
              To connect WhatsApp to the platform, sign in to your Meta account
              and follow the registration process.
            </p>

            <p>
              <strong>Important Requirements</strong>
            </p>
            <ul>
              <li>
                If you use the WhatsApp Business app, you can connect your
                current number and keep using the app.
              </li>
              <li>
                If you do not use the app, the number to connect must not be
                active in another WhatsApp account.
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="text-primary text-sm font-medium cursor-pointer self-start"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Hide advanced options" : "Advanced options"}
          </button>

          {showAdvanced && (
            <>
              <div className="instructions">
                <p>
                  Overriding the callback URL is useful to bypass OpenBSP and
                  receive raw webhooks at the endpoint you specify. OpenBSP will
                  continue to receive account and template events (which cannot be
                  redirected), but will not receive messages.
                </p>
              </div>

              <label>
                <div className="label">Callback URL (optional)</div>
                <input
                  type="url"
                  className="text"
                  placeholder="https://example.com/webhook"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                />
              </label>

              <label>
                <div className="label">Verify Token (optional)</div>
                <input
                  type="text"
                  className="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                />
              </label>
            </>
          )}
        </form>
      </SectionBody>

      <SectionFooter>
        <WhatsAppIntegration
          onSuccess={handleSuccess}
          signupOptions={{
            callback_url: callbackUrl.trim() || undefined,
            verify_token: verifyToken.trim() || undefined,
          }}
        />
      </SectionFooter>
    </>
  );
}
