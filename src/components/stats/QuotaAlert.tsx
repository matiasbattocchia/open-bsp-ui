import { TriangleAlert } from "lucide-react";
import SectionItem from "@/components/SectionItem";
import { useTranslation } from "@/hooks/useTranslation";
import type { Quota } from "@/queries/useBilling";
import {
  quotaAmount,
  quotaStatus,
  statusColors,
  translateProductName,
} from "./quota";

type Translate = (s: string) => string;

/** What stops working once the quota is capped, by the trigger that caps it. */
function consequence(productId: string, t: Translate) {
  switch (productId) {
    case "messages":
      return t("No se envían más mensajes; los recibidos siguen llegando.");
    case "conversations":
      return t("No se crean conversaciones nuevas.");
    case "storage":
      return t("No se pueden subir más archivos.");
    case "organizations_addresses":
      return t("No se pueden conectar más cuentas.");
    case "ai_credits":
      return t("Los agentes de IA sin clave propia dejan de responder.");
    default:
      return t("No se puede usar más.");
  }
}

/** When a monthly quota starts over: the first of next month, in UTC. */
function renewal(language: string, t: Translate) {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1));
  return `${t("Se renueva el")} ${next.toLocaleDateString(language, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })}`;
}

/**
 * A warning card, shaped like the invitation card, for a quota about to meet
 * its cap or capped already. Near, it says how far along it is; capped, what
 * stopped working. A monthly quota also says when it starts over. Nothing for
 * a quota with room to spare.
 */
export default function QuotaAlert({
  quota,
  onClick,
}: {
  quota: Quota;
  onClick?: () => void;
}) {
  const { translate: t, currentLanguage } = useTranslation();
  const status = quotaStatus(quota);
  if (status === "ok") return null;

  const amount = quotaAmount(quota, t);
  const colors = statusColors[status];

  return (
    <div className={`${colors.background} rounded-lg`}>
      <SectionItem
        // Grows with its lines: h-auto! overrides SectionItem's own h-[72px]
        // whatever order the two land in, and min-h keeps a row's height.
        className="h-auto! min-h-[72px] py-[10px]"
        title={`${translateProductName(quota.name, t)}: ${
          status === "capped" ? t("Límite alcanzado") : t("Cerca del límite")
        }`}
        description={
          <div className="flex flex-col gap-[2px] w-full whitespace-normal">
            <p>
              {status === "capped"
                ? consequence(quota.id, t)
                : amount.used + amount.rest}
            </p>
            {quota.interval === "month" && <p>{renewal(currentLanguage, t)}</p>}
          </div>
        }
        aside={
          <div className="p-[8px]">
            <TriangleAlert className={`w-[24px] h-[24px] ${colors.icon}`} />
          </div>
        }
        onClick={onClick}
      />
    </div>
  );
}
