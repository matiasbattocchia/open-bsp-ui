import { useContext, useEffect, useState } from "react";
import {
  WhatsAppIntegrationContext,
  type SignupOptions,
} from "@/contexts/WhatsAppIntegrationContext";
import useBoundStore from "@/stores/useBoundStore";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";

export default function WhatsAppIntegration({
  onSuccess,
  signupOptions,
  // Whether the caller may connect at the scope they picked; see
  // useConnectionScope. Defaults to allowed for the third-party onboarding
  // flow, which has no member to ask about.
  allowed = true,
  // Whether the tier's cap leaves room for one more account; see
  // useCanConnectAccount.
  canConnect = true,
  // The button's text and style; a reconnect names itself and takes the
  // app's primary style.
  label,
  className = "primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full",
}: {
  onSuccess?: (phone_number_id: string) => void;
  signupOptions?: SignupOptions;
  allowed?: boolean;
  canConnect?: boolean;
  label?: string;
  className?: string;
}) {
  const { translate: t } = useTranslation();
  const context = useContext(WhatsAppIntegrationContext);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const [loading, setLoading] = useState(false);
  // The Facebook SDK loads asynchronously from connect.facebook.net, which is
  // commonly blocked by tracking protection / ad blockers. If it fails to load,
  // show the error up front instead of a button that cannot work.
  const [sdkFailed, setSdkFailed] = useState(() => !!window.__fbSdkFailed);

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
        disabled={!orgId || !allowed || !canConnect || sdkFailed}
        disabledReason={
          sdkFailed
            ? sdkErrorMessage
            : !canConnect
              ? t("No se pueden conectar más cuentas.")
              : !allowed
                ? t("Requiere permisos de administrador")
                : undefined
        }
        loading={loading}
        className={className}
        onClick={() =>
          context.launchWhatsAppSignup(
            onSuccess || (() => {}),
            setLoading,
            signupOptions,
          )
        }
      >
        {label ?? t("Continuar con Facebook")}
      </Button>
    </div>
  );
}
