import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrganizationAddress } from "@/queries/useOrganizationsAddresses";
import { useWhatsAppDisconnect } from "@/queries/useWhatsAppSignup";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import type { OrganizationAddressExtra } from "@/supabase/client";
import { useState } from "react";
import Button from "@/components/Button";
import SectionItem from "@/components/SectionItem";
import { LayoutTemplate } from "lucide-react";

export const Route = createFileRoute("/_auth/integrations/whatsapp/$orgAddressId/")({
  component: WhatsAppDetails,
});

function WhatsAppDetails() {
  const { orgAddressId } = Route.useParams();
  const navigate = useNavigate();
  const { data: integration } = useOrganizationAddress(orgAddressId);
  const disconnect = useWhatsAppDisconnect();
  const [showInstructions, setShowInstructions] = useState(false);

  if (!integration) return;

  const extra = integration.extra as OrganizationAddressExtra | undefined;
  const flowType = extra?.flow_type;
  const isCoexistence = flowType === "existing_phone_number";

  const flowTypeLabels: Record<string, string> = {
    new_phone_number: "New WhatsApp number",
    existing_phone_number: "Existing WhatsApp Business account",
    only_waba: "WABA only",
  };

  const handleDisconnect = () => {
    if (isCoexistence) {
      setShowInstructions(true);
      return;
    }

    disconnect.mutate(
      { phone_number_id: integration.address },
      {
        onSuccess: () => {
          navigate({ to: "/whatsapp/channels" });
        },
      }
    );
  };

  return (
    <>
      <SectionHeader title={extra?.verified_name || "WhatsApp Account"} />

      <SectionBody className="pb-[40px]">
        <SectionItem
          title="Message Templates"
          aside={
            <div className="p-[8px]">
              <LayoutTemplate className="w-[24px] h-[24px] text-muted-foreground" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/integrations/whatsapp/$orgAddressId/templates",
              params: { orgAddressId },
              hash: (prevHash) => prevHash!,
            })
          }
        />
        <form>
          <label>
            <div className="label">Verified Name</div>
            <input
              type="text"
              className="text"
              value={extra?.verified_name || "Unnamed"}
              readOnly
            />
          </label>

          <label>
            <div className="label">Phone Number</div>
            <input
              type="tel"
              className="text"
              value={formatPhoneNumber(extra?.phone_number || "")}
              readOnly
            />
          </label>

          <label>
            <div className="label">Integration Type</div>
            <input
              type="text"
              className="text"
              value={flowType ? flowTypeLabels[flowType] || flowType : ""}
              readOnly
            />
          </label>

          <label>
            <div className="label">Phone Number ID</div>
            <input
              type="text"
              className="text"
              value={integration.address}
              readOnly
            />
          </label>

          <label>
            <div className="label">WABA ID</div>
            <input
              type="text"
              className="text"
              value={extra?.waba_id || ""}
              readOnly
            />
          </label>

          <label>
            <div className="label">Status</div>
            <input
              type="text"
              className="text capitalize"
              value={integration.status === "connected" ? "Connected" : "Disconnected"}
              readOnly
            />
          </label>

          {extra?.access_token && (
            <label>
              <div className="label">WABA Access Token</div>
              <input
                type="text"
                className="text font-mono text-xs"
                value={extra.access_token}
                readOnly
              />
            </label>
          )}

          <div className="instructions">
            <p>
              Overriding the callback URL is useful to bypass OpenBSP and
              receive raw webhooks at the endpoint you specify. OpenBSP will
              continue to receive account and template events (which cannot be
              redirected), but will not receive messages.
            </p>
          </div>

          <label>
            <div className="label">Callback URL</div>
            <input
              type="text"
              className="text"
              value={extra?.callback_url || ""}
              placeholder="Not overridden"
              readOnly
            />
          </label>

          <label>
            <div className="label">Verify Token</div>
            <input
              type="text"
              className="text"
              value={extra?.verify_token || ""}
              placeholder="Not overridden"
              readOnly
            />
          </label>

          {/* Disconnect button */}
          {integration.status === "connected" && !showInstructions && (
            <Button
              type="button"
              className="primary bg-destructive text-primary-foreground hover:bg-destructive/80 px-4 py-2 rounded-full font-medium transition-colors w-fit text-[14px]"
              onClick={handleDisconnect}
              loading={disconnect.isPending}
            >
              Disconnect
            </Button>
          )}

          {/* Coexistence disconnect instructions */}
          {showInstructions && (
            <div className="instructions">
              <p>
                This account must be unlinked from the WhatsApp Business
                mobile app:
              </p>
              <ol>
                <li>Open the WhatsApp Business app</li>
                <li>Go to Settings &gt; Account &gt; Business Platform</li>
                <li>Tap the connected platform and select &quot;Disconnect&quot;</li>
              </ol>
            </div>
          )}
        </form>
      </SectionBody>
    </>
  );
}
