import { Translate as T } from "@/hooks/useTranslation";
import { useWhatsAppIntegration } from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";

export default function WhatsAppIntegration({
  onSuccess,
  setLoading,
}: {
  onSuccess?: () => void;
  setLoading?: (loading: boolean) => void;
}) {
  const { launchWhatsAppSignup } = useWhatsAppIntegration();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return orgId && (
    <div className="flex justify-center">
      <T
        as="button"
        className="bg-[#4267b2] hover:bg-[#4267b2]/90 rounded-[7.5px] text-white h-[40px] text-center w-[250px] cursor-pointer"
        onClick={() => launchWhatsAppSignup(orgId, onSuccess || (() => { }), setLoading || (() => { }))}
      >
        Continuar con Facebook
      </T>
    </div>
  );
}
