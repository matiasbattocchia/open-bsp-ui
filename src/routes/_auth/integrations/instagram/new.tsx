import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useInstagramConnect } from "@/hooks/useInstagramConnect";
import ScopeToggle from "@/components/ScopeToggle";
import { useConnectionScope } from "@/hooks/useConnectionScope";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useCanConnectAccount } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/integrations/instagram/new")({
  component: InstagramNew,
});

function InstagramNew() {
  const { translate: t } = useTranslation();
  const { scope, setScope, isAdmin, agentId, allowed } = useConnectionScope();
  const canConnect = useCanConnectAccount();
  const { connect, loading, error } = useInstagramConnect();

  return (
    <>
      <SectionHeader title={t("Conectar Instagram")} />

      <SectionBody>
        <AccountLimitAlert />
        <div className="instructions">
          <p>
            {t(
              "Para conectar Instagram a la plataforma, iniciá sesión con la cuenta de Instagram profesional (empresa o creador) que querés conectar.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "La cuenta debe ser profesional (empresa o creador) y tener los mensajes habilitados.",
              )}
            </li>
            <li>
              {t(
                "Vas a ser redirigido a Instagram para autorizar y luego volverás a la plataforma.",
              )}
            </li>
          </ul>
          {error && (
            <p className="text-destructive font-medium">
              {t("No se pudo conectar la cuenta de Instagram.")}
            </p>
          )}
        </div>

        <label>
          <div className="label">{t("Cuenta")}</div>
          <ScopeToggle value={scope} onChange={setScope} isAdmin={isAdmin} />
        </label>
      </SectionBody>

      <SectionFooter>
        <Button
          loading={loading}
          disabled={!allowed || !canConnect}
          disabledReason={
            !canConnect
              ? t("No se pueden conectar más cuentas.")
              : t("Requiere permisos de administrador")
          }
          className="primary bg-[#E1306C] hover:bg-[#E1306C]/90 text-white w-full"
          onClick={() => connect(agentId)}
        >
          {t("Continuar con Instagram")}
        </Button>
      </SectionFooter>
    </>
  );
}
