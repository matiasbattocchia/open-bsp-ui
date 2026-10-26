import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { planName, planPrice } from "@/components/plans/plan";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlans, useSubscription } from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/settings/plans/")({
  component: Plans,
});

function Plans() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans } = usePlans();
  const { data: subscription } = useSubscription();

  return (
    <>
      <SectionHeader title={t("Planes")} />
      <SectionBody>
        {plans?.map((plan) => {
          const isCurrent = plan.id === subscription?.plan_id;
          const price = planPrice(plan, t);

          return (
            <SectionItem
              key={plan.id}
              title={planName(plan.id)}
              description={
                [price.amount, price.period].join(" ").trim() +
                (isCurrent ? ` · ${t("Plan actual")}` : "")
              }
              aside={
                <div
                  className={`p-[8px] rounded-full ${isCurrent ? "bg-primary/10" : ""}`}
                >
                  <CreditCard
                    className={`w-[24px] h-[24px] ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
              }
              onClick={() =>
                navigate({
                  to: "/settings/plans/$planId",
                  params: { planId: plan.id },
                  hash: (prevHash) => prevHash!,
                })
              }
            />
          );
        })}
      </SectionBody>
    </>
  );
}
