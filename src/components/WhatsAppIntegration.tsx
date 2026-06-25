import { useContext, useEffect, useState } from "react";
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
  // The Facebook SDK loads asynchronously from connect.facebook.net, which is
  // commonly blocked by tracking protection / ad blockers. If it fails to load,
  // show the error up front instead of a button that cannot work.
  const [sdkFailed, setSdkFailed] = useState(
    () => !!(window as any).__fbSdkFailed,
  );

  useEffect(() => {
    const onFail = () => setSdkFailed(true);
    window.addEventListener("fb-sdk-failed", onFail);
    return () => window.removeEventListener("fb-sdk-failed", onFail);
  }, []);

  if (!context?.launchWhatsAppSignup) return null;

  const sdkErrorMessage = t(
    "No se pudo cargar el SDK de Facebook. Desactivá la protección contra rastreo o el bloqueador de anuncios para este sitio, o probá con otro navegador.",
  );

  return (
    <div className="flex flex-col gap-2">
      {sdkFailed && (
        <p className="text-destructive font-medium">{sdkErrorMessage}</p>
      )}
      <Button
        disabled={!orgId || !isOwner || sdkFailed}
        disabledReason={
          sdkFailed
            ? sdkErrorMessage
            : !isOwner
              ? t("Requiere permisos de propietario")
              : undefined
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
    </div>
  );
}
