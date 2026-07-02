import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import Button from "@/components/Button";
import { PlugZap, ChevronDown, ChevronRight } from "lucide-react";
import { useManualConnect } from "@/queries/useManualConnect";

export const Route = createFileRoute("/_auth/whatsapp/connect")({
  component: ConnectChannel,
});

function ConnectChannel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="header items-center gap-2 shrink-0 px-4">
        <PlugZap className="w-5 h-5 text-primary" />
        <h1 className="text-[17px] font-medium">Connect Channel</h1>
      </div>

      <div className="flex-1 p-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Facebook Embedded Signup */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-[16px] font-medium">
                Facebook Embedded Signup
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Connect a WhatsApp Business number through Meta&apos;s Embedded
                Signup flow. You&apos;ll be redirected to Facebook to authorize
                the integration.
              </p>
            </div>

            <div>
              <WhatsAppIntegration
                onSuccess={(phone_number_id) => {
                  navigate({
                    to: "/integrations/whatsapp/$orgAddressId",
                    params: { orgAddressId: phone_number_id },
                  });
                }}
              />
            </div>
          </div>

          {/* Card 2: Manual Connect */}
          <ManualConnectCard
            onSuccess={(phone_number_id) => {
              navigate({
                to: "/integrations/whatsapp/$orgAddressId",
                params: { orgAddressId: phone_number_id },
              });
            }}
          />
        </div>

        <div className="mt-4">
          <p className="text-[12px] text-muted-foreground">
            Need to onboard a third party?{" "}
            <button
              className="text-primary hover:underline"
              onClick={() =>
                navigate({ to: "/integrations/whatsapp/onboarding" })
              }
            >
              Generate an onboarding link
            </button>{" "}
            instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function ManualConnectCard({
  onSuccess,
}: {
  onSuccess: (phone_number_id: string) => void;
}) {
  const [wabaId, setWabaId] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [flowType, setFlowType] = useState<"new_phone_number" | "existing_phone_number">("new_phone_number");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const { mutateAsync: manualConnect, isPending } = useManualConnect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wabaId.trim() || !phoneNumberId.trim()) return;

    try {
      const data = await manualConnect({
        waba_id: wabaId.trim(),
        phone_number_id: phoneNumberId.trim(),
        flow_type: flowType,
        callback_url: callbackUrl.trim() || undefined,
        verify_token: verifyToken.trim() || undefined,
      });
      const returnedPhoneId = ((data as Record<string, unknown>)?.address as string)
        || phoneNumberId.trim();
      onSuccess(returnedPhoneId);
    } catch (err) {
      console.error("Manual connect failed:", err);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-[16px] font-medium">Manual Connect</h2>
        <p className="text-[13px] text-muted-foreground">
          Use this if a partner has granted asset management permissions to
          your business. Enter the WABA ID and phone number ID provided by
          the partner.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <div className="text-[13px] font-medium mb-1">WABA ID</div>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="e.g. 123456789012345"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-[13px] font-medium mb-1">Phone Number ID</div>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="e.g. 987654321098765"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <div className="text-[13px] font-medium mb-1">Flow Type</div>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={flowType}
            onChange={(e) => setFlowType(e.target.value as "new_phone_number" | "existing_phone_number")}
          >
            <option value="new_phone_number">New phone number</option>
            <option value="existing_phone_number">Existing phone number (coexistence)</option>
          </select>
        </label>

        <button
          type="button"
          className="flex items-center gap-1 text-[13px] text-primary font-medium cursor-pointer"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            <label className="block">
              <div className="text-[13px] font-medium mb-1">
                Callback URL (optional)
              </div>
              <input
                type="url"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="https://example.com/webhook"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-[13px] font-medium mb-1">
                Verify Token (optional)
              </div>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
              />
            </label>
          </div>
        )}

        <Button
          type="submit"
          loading={isPending}
          disabled={!wabaId.trim() || !phoneNumberId.trim()}
          className="primary w-full"
        >
          Connect
        </Button>
      </form>
    </div>
  );
}
