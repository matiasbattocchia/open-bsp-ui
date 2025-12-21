import { useContext } from "react";
import { WhatsAppIntegrationContext } from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";

export default function WhatsAppIntegration({
  onSuccess,
  setLoading,
}: {
  onSuccess?: () => void;
  setLoading?: (loading: boolean) => void;
}) {
  const context = useContext(WhatsAppIntegrationContext);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return context?.launchWhatsAppSignup && (
    <button
      disabled={!orgId}
      className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full"
      onClick={() => context.launchWhatsAppSignup(onSuccess || (() => { }), setLoading || (() => { }))}
    >
      Continuar con Facebook
    </button>
  );
}
