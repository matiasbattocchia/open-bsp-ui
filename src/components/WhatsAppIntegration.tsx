import { useContext, useState } from "react";
import {
  WhatsAppIntegrationContext,
  type SignupOptions,
} from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";

export default function WhatsAppIntegration({
  onSuccess,
  signupOptions,
}: {
  onSuccess?: (phone_number_id: string) => void;
  signupOptions?: SignupOptions;
}) {
  const { translate: t } = useTranslation();
  const context = useContext(WhatsAppIntegrationContext);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const [loading, setLoading] = useState(false);
  const { data: agent } = useCurrentAgent();
  const isOwner = agent?.extra?.role === "owner";

  if (!context?.launchWhatsAppSignup) return null;

  return (
    <Button
      disabled={!orgId || !isOwner}
      disabledReason={
        !isOwner ? t("Requiere permisos de propietario") : undefined
      }
      loading={loading}
      className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full"
      onClick={() =>
        context.launchWhatsAppSignup(
          onSuccess || (() => {}),
          setLoading,
          signupOptions,
        )
      }
    >
      {t("Continuar con Facebook")}
    </Button>
  );
}
