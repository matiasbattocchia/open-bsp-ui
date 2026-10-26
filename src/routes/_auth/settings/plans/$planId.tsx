import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/Button";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import SectionHeader from "@/components/SectionHeader";
import SectionItem from "@/components/SectionItem";
import { ProductIcon } from "@/components/stats/QuotaItem";
import { translateProductName } from "@/components/stats/quota";
import {
  planName,
  planOffer,
  planPrice,
  planTier,
} from "@/components/plans/plan";
import { useTranslation } from "@/hooks/useTranslation";
import {
  usePlans,
  useProducts,
  useSubscription,
  useTiers,
} from "@/queries/useBilling";

export const Route = createFileRoute("/_auth/settings/plans/$planId")({
  component: PlanDetail,
});

const COMMUNITY_URL = "https://chat.whatsapp.com/Ch6AwZizSDt5quzHodcYh5";

function PlanDetail() {
  const { translate: t } = useTranslation();
  const { planId } = Route.useParams();
  const { data: plans } = usePlans();
  const { data: products } = useProducts();
  const { data: tiers } = useTiers();
  const { data: subscription } = useSubscription();
  // There are no online payments yet: the button tells how to ask for it.
  const [showContact, setShowContact] = useState(false);

  const plan = plans?.find((p) => p.id === planId);
  if (!plan || !subscription) {
    return <SectionHeader title={t("Planes")} />;
  }

  const current = plans?.find((p) => p.id === subscription.plan_id);
  const isCurrent = plan.id === current?.id;
  const tier = planTier(
    plan.min_tier,
    subscription.tiers?.level ?? 0,
    tiers ?? [],
  );
  const name = planName(plan.id);

  return (
    <>
      <SectionHeader title={name} />
      <SectionBody>
        <div className="px-[10px] pt-[8px] pb-[16px] flex flex-col gap-[4px]">
          <span className="text-[28px] text-foreground font-medium">
            {planPrice(plan, t)}
          </span>
          {isCurrent && (
            <span className="text-[14px] text-primary">{t("Plan actual")}</span>
          )}
        </div>

        {products?.map((product) => {
          const lines = planOffer(
            product,
            plan.plans_products.find((pp) => pp.product_id === product.id),
            tier?.tiers_products.find((tp) => tp.product_id === product.id),
            t,
          );
          if (!lines.length) return null;

          return (
            <SectionItem
              key={product.id}
              // Grows with its lines: h-auto! overrides SectionItem's own
              // h-[72px] whatever order the two land in.
              className="h-auto! min-h-[72px] py-[10px]"
              title={translateProductName(product.name, t)}
              description={
                <div className="flex flex-col gap-[2px] w-full whitespace-normal">
                  {lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              }
              aside={
                <div className="p-[8px]">
                  <ProductIcon productId={product.id} />
                </div>
              }
            />
          );
        })}
      </SectionBody>

      {!isCurrent && (
        <SectionFooter>
          {showContact ? (
            <div className="instructions">
              <p>
                {t(
                  "Todavía no hay pagos en línea: los cambios de plan se hacen a mano.",
                )}
              </p>
              <p>
                {t("Escribinos en la comunidad de WhatsApp y lo activamos.")}
              </p>
              <a
                href={COMMUNITY_URL}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-primary/90 hover:text-primary w-fit"
              >
                {t("Ir a la comunidad")}
              </a>
            </div>
          ) : (
            <Button
              type="button"
              className="primary"
              onClick={() => setShowContact(true)}
            >
              {(plan.price > (current?.price ?? 0)
                ? t("Mejorar a")
                : t("Cambiar a")) +
                " " +
                name}
            </Button>
          )}
        </SectionFooter>
      )}
    </>
  );
}
