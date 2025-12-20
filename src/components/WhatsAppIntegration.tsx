import { Translate as T } from "@/hooks/useTranslation";
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
    <div className="flex justify-center">
      <T
        as="button"
        disabled={!orgId}
        className="bg-[#4267b2] hover:bg-[#4267b2]/90 rounded-[7.5px] text-white h-[40px] text-center w-[250px]"
        onClick={() => context.launchWhatsAppSignup(onSuccess || (() => { }), setLoading || (() => { }))}
      >
        Continuar con Facebook
      </T>
    </div>
  );
}
