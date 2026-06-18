import { createFileRoute } from "@tanstack/react-router";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { useNavigate } from "@tanstack/react-router";
import { PlugZap } from "lucide-react";

export const Route = createFileRoute("/_auth/whatsapp/connect")({
  component: ConnectChannel,
});

function ConnectChannel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="header items-center gap-2 shrink-0 px-4">
        <PlugZap className="w-5 h-5 text-primary" />
        <h1 className="text-[17px] font-medium">Connect Channel</h1>
      </div>

      <div className="flex-1 p-4 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-medium">Facebook Embedded Signup</h2>
            <p className="text-[13px] text-muted-foreground">
              Connect a WhatsApp Business number through Meta&apos;s Embedded
              Signup flow. You&apos;ll be redirected to Facebook to authorize
              the integration.
            </p>
          </div>

          <div className="max-w-sm">
            <WhatsAppIntegration
              onSuccess={(phone_number_id) => {
                navigate({
                  to: "/integrations/whatsapp/$orgAddressId",
                  params: { orgAddressId: phone_number_id },
                });
              }}
            />
          </div>

          <div className="pt-2 border-t border-border">
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
    </div>
  );
}
