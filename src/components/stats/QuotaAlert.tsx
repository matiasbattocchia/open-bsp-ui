import { TriangleAlert } from "lucide-react";
import NoticeCard from "@/components/NoticeCard";
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
 * stopped working. A monthly quota also says when it starts over, and an
 * `onUpgrade` adds a link to the plans. Nothing for a quota with room to spare.
 */
export default function QuotaAlert({
  quota,
  onClick,
  onUpgrade,
}: {
  quota: Quota;
  onClick?: () => void;
  onUpgrade?: () => void;
}) {
  const { translate: t, currentLanguage } = useTranslation();
  const status = quotaStatus(quota);
  if (status === "ok") return null;

  const amount = quotaAmount(quota, t);
  const colors = statusColors[status];

  return (
    <NoticeCard
      className={colors.background}
      icon={<TriangleAlert className={`w-[24px] h-[24px] ${colors.icon}`} />}
      title={`${translateProductName(quota.name, t)}: ${
        status === "capped" ? t("Límite alcanzado") : t("Cerca del límite")
      }`}
      actions={
        onUpgrade && (
          <button
            onClick={onUpgrade}
            className="font-bold text-primary/90 hover:text-primary cursor-pointer"
          >
            {t("Mejorar plan")}
          </button>
        )
      }
      onClick={onClick}
    >
      <p>
        {status === "capped"
          ? consequence(quota.id, t)
          : amount.used + amount.rest}
      </p>
      {quota.interval === "month" && <p>{renewal(currentLanguage, t)}</p>}
    </NoticeCard>
  );
}
