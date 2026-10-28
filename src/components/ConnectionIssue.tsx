import NoticeCard from "@/components/NoticeCard";
import ServiceIcon from "@/components/ServiceIcon";
import WarningBadge from "@/components/WarningBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  InstagramOrganizationAddressExtra,
  OrganizationAddressRow,
} from "@/supabase/client";
import { formatPhoneNumber } from "@/utils/FormatUtils";

type Translate = (s: string) => string;

/**
 * Whether the account works. Facing the user an account is connected or not;
 * an issue (the service's doing) makes it disconnected whatever the row says
 * — an Instagram token that died keeps its row connected, yet it can't send.
 */
export function isWorking(row: OrganizationAddressRow) {
  return row.status === "connected" && !row.issue;
}

/** How the account reads: its number, or its @username. */
export function accountLabel(row: OrganizationAddressRow) {
  if (row.service === "instagram") {
    const extra = row.extra as InstagramOrganizationAddressExtra | null;
    return extra?.username ? `@${extra.username}` : extra?.name || row.address;
  }
  const extra = row.extra as { phone_number?: string } | null;
  return formatPhoneNumber(extra?.phone_number || row.address);
}

/** A list item's status: connected, or not. */
export function ConnectionStatus({ row }: { row: OrganizationAddressRow }) {
  const { translate: t } = useTranslation();
  return isWorking(row) ? (
    <span className="text-primary">{t("Conectado")}</span>
  ) : (
    <>{t("Desconectado")}</>
  );
}

/** Why Meta took a WhatsApp Business account away, as far as it says. */
function removed(detail: string | undefined, t: Translate) {
  switch (detail) {
    case "ACCOUNT_DISCONNECTED":
      return t(
        "El número se desconectó de OpenBSP desde la app WhatsApp Business.",
      );
    case "CHANGE_NUMBER":
      return t("Se cambió el número en la app WhatsApp Business.");
    case "PRIMARY_INACTIVITY":
      return t(
        "La app WhatsApp Business pasó demasiado tiempo sin abrirse en el teléfono.",
      );
    case "USER_RE_REGISTERED":
      return t("El número se volvió a registrar en WhatsApp.");
    default:
      return t(
        "Se quitó desde Meta el acceso de OpenBSP a la cuenta de WhatsApp Business.",
      );
  }
}

/** What the service did and what it stopped, by the issue's reason. */
function cause(
  row: OrganizationAddressRow,
  t: Translate,
  language: string,
): string[] {
  const issue = row.issue!;
  const reinstated = t(
    "No se envían ni reciben mensajes. Se vuelve a conectar sola si Meta restablece la cuenta.",
  );
  switch (issue.reason) {
    case "logged_out":
      return [
        t(
          "WhatsApp desvinculó el dispositivo: se cerró la sesión desde el teléfono, o el teléfono estuvo demasiado tiempo sin conectarse.",
        ),
        t(
          "No se envían ni reciben mensajes hasta volver a conectar el número.",
        ),
      ];
    case "banned":
      if (row.service === "whatsapp") {
        return [
          t(
            "Meta deshabilitó la cuenta de WhatsApp Business por infringir sus políticas.",
          ),
          reinstated,
        ];
      }
      return [
        issue.until
          ? `${t("WhatsApp bloqueó el número temporalmente, hasta el")} ${new Date(
              issue.until,
            ).toLocaleString(language, {
              day: "numeric",
              month: "long",
              hour: "numeric",
              minute: "2-digit",
            })}.`
          : t("WhatsApp bloqueó el número temporalmente."),
        t("Volvé a conectar el número cuando se levante el bloqueo."),
      ];
    case "violation":
      return [
        `${t(
          "Meta reportó una infracción de sus políticas en la cuenta de WhatsApp Business. Para proteger la plataforma, OpenBSP la desconectó.",
        )}${issue.detail ? ` (${issue.detail.toLowerCase().replaceAll("_", " ")})` : ""}`,
        reinstated,
      ];
    case "expired":
      return [
        row.service === "instagram"
          ? t(
              "El acceso a Instagram expiró o fue revocado, como pasa al cambiar la contraseña.",
            )
          : t(
              "El acceso que la cuenta le dio a OpenBSP expiró o fue revocado.",
            ),
        t("No se pueden enviar mensajes hasta volver a conectar la cuenta."),
      ];
    case "removed":
      return [
        row.service === "instagram"
          ? t(
              "OpenBSP fue quitado de la configuración de la cuenta de Instagram.",
            )
          : removed(issue.detail, t),
        t(
          "No se envían ni reciben mensajes hasta volver a conectar la cuenta.",
        ),
      ];
    case "offboarded":
      return [
        t(
          "La app WhatsApp Business dejó de compartir el número con OpenBSP, por un cambio de teléfono o porque el número se volvió a registrar.",
        ),
        t(
          "Mientras tanto no se envían ni reciben mensajes. Se vuelve a conectar sola cuando se configure la app de nuevo.",
        ),
      ];
    case "deleted":
      return [
        t("El número o su cuenta de WhatsApp Business se eliminó en Meta."),
        t("Ya no se pueden enviar ni recibir mensajes con este número."),
      ];
  }
}

/**
 * The warning card for an account the service disconnected, shaped like a
 * quota's: the account, what happened, what it stopped. Nothing for an
 * account with no issue — working, or disconnected by a member.
 */
export function ConnectionIssueCard({
  row,
  onClick,
}: {
  row: OrganizationAddressRow;
  onClick?: () => void;
}) {
  const { translate: t, currentLanguage } = useTranslation();
  if (!row.issue) return null;

  return (
    <NoticeCard
      className="bg-destructive/10"
      icon={
        <WarningBadge show>
          <ServiceIcon service={row.service} size={24} />
        </WarningBadge>
      }
      title={`${accountLabel(row)}: ${t("Desconectado")}`}
      onClick={onClick}
    >
      {cause(row, t, currentLanguage).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </NoticeCard>
  );
}
