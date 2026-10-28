import { useTranslation } from "@/hooks/useTranslation";

/**
 * Why an onboarding link cannot connect an account right now: the
 * organization that sent it is at its connected accounts cap. Said to the
 * link's recipient, who can only pass it on — the link works again once the
 * cap has room.
 */
export default function OnboardLimitNotice() {
  const { translate: t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-destructive font-medium">
        {t(
          "La organización alcanzó el límite de cuentas conectadas de su plan.",
        )}
      </p>
      <p className="text-muted-foreground text-[14px]">
        {t("Avisale a tu proveedor para que amplíe el plan.")}
      </p>
    </div>
  );
}
