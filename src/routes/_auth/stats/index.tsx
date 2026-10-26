import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import QuotaItem from "@/components/stats/QuotaItem";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuotas } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/stats/")({
  component: StatsIndex,
});

function StatsIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const quotas = useQuotas();

  return (
    <>
      <SectionHeader title={t("Estadísticas")} />
      <SectionBody>
        {quotas?.map((quota) => (
          <QuotaItem
            key={quota.id}
            quota={quota}
            onClick={() =>
              navigate({
                to: "/stats/$productId",
                params: { productId: quota.id },
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
        {quotas && !quotas.length && (
          <div className="text-muted-foreground text-center py-[40px]">
            {t("Sin cuotas configuradas")}
          </div>
        )}
      </SectionBody>
    </>
  );
}
