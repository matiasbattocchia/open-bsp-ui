import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { supabase } from "@/supabase/client";
import WhatsAppBusinessCard from "@/components/WhatsAppBusinessCard";
import Spinner from "@/components/Spinner";
import { RefreshCw, Smartphone, Check, X, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_auth/whatsapp/channels")({
  component: ActiveChannels,
});

function ActiveChannels() {
  const navigate = useNavigate();
  const { data: integrations, isLoading, refetch } = useOrganizationsAddresses();

  const [modalChannel, setModalChannel] = useState<{ address: string; extra: Record<string, unknown> | null } | null>(null);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultState, setResultState] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const whatsappIntegrations = integrations?.filter(
    (integration) => integration.service === "whatsapp",
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const openModal = useCallback((integration: { address: string; extra: Record<string, unknown> | null }) => {
    setModalChannel(integration);
    setRecipient("");
    setMessage("");
    setResultState("idle");
    setErrorText("");
  }, []);

  const closeModal = useCallback(() => {
    setModalChannel(null);
    setSubmitting(false);
  }, []);

  const handleTestOutboundSubmit = useCallback(async () => {
    if (!modalChannel || !recipient.trim() || !message.trim()) return;

    setSubmitting(true);
    setResultState("idle");
    setErrorText("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userJwt = session?.access_token;
      const anonKey = (supabase as any).supabaseKey;

      if (!userJwt) {
        throw new Error("No active session found.");
      }

      const extra = modalChannel.extra as Record<string, unknown> & { waba_id?: string } | null;

      const response = await fetch(
        "https://wlnquwjdbrlnxfwonvnd.supabase.co/functions/v1/test-outbound",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userJwt}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number_id: modalChannel.address,
            waba_id: extra?.waba_id ?? null,
            to: recipient.trim(),
            message: message.trim(),
          }),
        },
      );

      if (response.ok) {
        setResultState("success");
        setTimeout(() => {
          setModalChannel(null);
          setResultState("idle");
          setMessage("");
          setRecipient("");
        }, 1500);
      } else {
        const body = await response.text();
        setResultState("error");
        setErrorText(body || `HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      setResultState("error");
      setErrorText(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }, [modalChannel, recipient, message]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="header items-center gap-2 shrink-0 px-4">
        <Smartphone className="w-5 h-5 text-primary" />
        <h1 className="text-[17px] font-medium">Active Channels Grid</h1>
        <div className="flex-1" />
        <button
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          title="Refresh"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : !whatsappIntegrations?.length ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-[15px] text-center border border-dashed border-border rounded-xl">
            No active channels found. Connect your first WhatsApp number.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {whatsappIntegrations.map((integration) => (
              <WhatsAppBusinessCard
                key={integration.address}
                address={integration.address}
                status={integration.status}
                extra={
                  (integration.extra as Record<string, unknown> & {
                    waba_id?: string;
                    business_name?: string;
                    display_phone_number?: string;
                    phone_number?: string;
                    quality_rating?: string;
                    verified_name?: string;
                  }) ?? {}
                }
                onClick={() =>
                  navigate({
                    to: "/integrations/whatsapp/$orgAddressId",
                    params: { orgAddressId: integration.address },
                  })
                }
                onTestOutbound={() => openModal(integration)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal overlay */}
      {modalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="text-[16px] text-foreground font-medium">
              Test Outbound
            </h3>

            <div className="space-y-1">
              <label className="text-[13px] text-muted-foreground">
                Recipient Number (To)
              </label>
              <input
                type="text"
                className="text w-full"
                placeholder="+1234567890"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] text-muted-foreground">
                Message Content
              </label>
              <textarea
                className="text w-full min-h-[80px] resize-y"
                placeholder="Enter your test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1.5 rounded-full text-[13px] hover:bg-muted text-muted-foreground"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                disabled={submitting || resultState === "success" || !recipient.trim() || !message.trim()}
                onClick={handleTestOutboundSubmit}
                className={`px-4 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                  resultState === "success"
                    ? "bg-green-500 text-white"
                    : resultState === "error"
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {submitting ? (
                  <Spinner />
                ) : resultState === "success" ? (
                  <>
                    <Check className="w-4 h-4" /> Sent
                  </>
                ) : resultState === "error" ? (
                  <>
                    <X className="w-4 h-4" /> Failed
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Send
                  </>
                )}
              </button>
            </div>

            {resultState === "success" && (
              <p className="text-[13px] text-green-600">
                Message sent successfully.
              </p>
            )}
            {resultState === "error" && (
              <p className="text-[13px] text-red-500 break-all">
                {errorText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
