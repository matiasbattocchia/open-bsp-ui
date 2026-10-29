import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import { useTikTokConnect } from "@/hooks/useTikTokConnect";
import ScopeToggle from "@/components/ScopeToggle";
import { useConnectionScope } from "@/hooks/useConnectionScope";
import AccountLimitAlert from "@/components/stats/AccountLimitAlert";
import { useCanConnectAccount } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/integrations/tiktok/new")({
  component: TikTokNew,
});

function TikTokNew() {
  const { translate: t } = useTranslation();
  const { scope, setScope, isAdmin, agentId, allowed } = useConnectionScope();
  const canConnect = useCanConnectAccount();
  const { connect, loading, error } = useTikTokConnect();

  return (
    <>
      <SectionHeader title={t("Conectar TikTok")} />

      <SectionBody>
        <AccountLimitAlert />
        <div className="instructions">
          <p>
            {t(
              "Para conectar TikTok a la plataforma, iniciá sesión con la cuenta de TikTok empresa que querés conectar.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "La cuenta debe ser de empresa y aceptar mensajes directos de todos. Las cuentas registradas en el Espacio Económico Europeo, Suiza o el Reino Unido no están disponibles.",
              )}
            </li>
            <li>
              {t(
                "Vas a ser redirigido a TikTok para autorizar y luego volverás a la plataforma.",
              )}
            </li>
          </ul>
          {error && (
            <p className="text-destructive font-medium">
              {t("No se pudo conectar la cuenta de TikTok.")}
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
          className="primary bg-foreground hover:bg-foreground/90 text-background w-full"
          onClick={() => connect(agentId)}
        >
          {t("Continuar con TikTok")}
        </Button>
      </SectionFooter>
    </>
  );
}
