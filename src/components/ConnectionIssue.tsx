import NoticeCard from "@/components/NoticeCard";
import ServiceIcon from "@/components/ServiceIcon";
import WarningBadge from "@/components/WarningBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  InstagramOrganizationAddressExtra,
  OrganizationAddressRow,
  TikTokOrganizationAddressExtra,
  SlackOrganizationAddressExtra,
} from "@/supabase/client";
import { formatPhoneNumber } from "@/utils/FormatUtils";

type Translate = (s: string) => string;

/** Where to ask OpenBSP about a decision on an account. */
const COMMUNITY = "https://chat.whatsapp.com/Ch6AwZizSDt5quzHodcYh5";

/** Where Meta reviews what it decided on a WhatsApp Business account. */
const BUSINESS_SUPPORT = "https://business.facebook.com/business-support-home";

/** The account's issue while it lasts: one whose `until` has passed is over. */
export function activeIssue(row: OrganizationAddressRow) {
  const issue = row.issue;
  if (!issue) return null;
  return issue.until && new Date(issue.until) < new Date() ? null : issue;
}

/**
 * Whether Meta holds the WhatsApp Business account: reported or disabled, it
 * can't be connected again until Meta reinstates it.
 */
export function isHeldByMeta(row: OrganizationAddressRow) {
  return (
    row.service === "whatsapp" &&
    ["violation", "banned"].includes(row.issue?.reason ?? "")
  );
}

/**
 * Whether the account works. Facing the user an account is connected or not;
 * an issue (the service's doing) makes it disconnected whatever the row says
 * — an Instagram token that died keeps its row connected, yet it can't send.
 * A restriction is the exception: it limits the account, which still works.
 */
export function isWorking(row: OrganizationAddressRow) {
  const issue = activeIssue(row);
  return (
    row.status === "connected" && (!issue || issue.reason === "restricted")
  );
}

/** The account's state in a word: connected, restricted, locked, or not. */
export function statusLabel(row: OrganizationAddressRow, t: Translate) {
  const reason = row.status === "connected" && activeIssue(row)?.reason;
  if (reason === "restricted") return t("Restringido");
  if (reason === "locked") return t("Bloqueado");
  return isWorking(row) ? t("Conectado") : t("Desconectado");
}

/** How the account reads: its number, or its @username. */
export function accountLabel(row: OrganizationAddressRow) {
  if (row.service === "instagram" || row.service === "tiktok") {
    const extra = row.extra as
      | InstagramOrganizationAddressExtra
      | TikTokOrganizationAddressExtra
      | null;
    return extra?.username ? `@${extra.username}` : extra?.name || row.address;
  }
  if (row.service === "slack") {
    const extra = row.extra as SlackOrganizationAddressExtra | null;
    return extra?.team_name || "Slack";
  }
  const extra = row.extra as { phone_number?: string } | null;
  return formatPhoneNumber(extra?.phone_number || row.address);
}

/** A list item's status: connected, or not. */
export function ConnectionStatus({ row }: { row: OrganizationAddressRow }) {
  const { translate: t } = useTranslation();
  return isWorking(row) && !activeIssue(row) ? (
    <span className="text-primary">{t("Conectado")}</span>
  ) : (
    <>{statusLabel(row, t)}</>
  );
}

/** What a restriction stops, by Meta's name for it. */
function restriction(type: string, t: Translate) {
  switch (type) {
    case "RESTRICTED_BIZ_INITIATED_MESSAGING":
      return t(
        "no puede iniciar conversaciones, solo responder a quien escribe primero",
      );
    case "RESTRICTED_CUSTOMER_INITIATED_MESSAGING":
      return t("no puede responder a los clientes");
    case "RESTRICTED_ADD_PHONE_NUMBER_ACTION":
      return t("no se le pueden agregar números");
    default:
      return type.toLowerCase().replaceAll("_", " ");
  }
}

function when(iso: string, language: string) {
  return new Date(iso).toLocaleString(language, {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
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
          ? `${t("WhatsApp bloqueó el número temporalmente, hasta el")} ${when(
              issue.until,
              language,
            )}.`
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
    case "restricted":
      return [
        `${
          issue.until
            ? `${t("Meta restringió la cuenta de WhatsApp Business hasta el")} ${when(issue.until, language)}`
            : t("Meta restringió la cuenta de WhatsApp Business")
        }: ${(issue.detail ?? "")
          .split(",")
          .filter(Boolean)
          .map((type) => restriction(type, t))
          .join("; ")}.`,
        t("Lo demás sigue funcionando, y la restricción se levanta sola."),
      ];
    case "locked":
      return [
        t(
          "Meta bloqueó la cuenta de WhatsApp Business, por infringir sus políticas o porque el PIN de verificación en dos pasos no coincide.",
        ),
        t("No se pueden enviar mensajes hasta que Meta la desbloquee."),
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
          : row.service === "slack"
            ? t(
                "OpenBSP fue quitado del espacio de trabajo de Slack, o se revocó su acceso.",
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
 * Where to take a decision Meta made on a WhatsApp Business account: a review
 * at Meta, questions to OpenBSP.
 */
export function MetaReview() {
  const { translate: t } = useTranslation();
  return (
    <p>
      {t("Si creés que es un error, pedí una revisión a Meta en")}{" "}
      <a href={BUSINESS_SUPPORT} target="_blank" rel="noreferrer">
        Business Support Home
      </a>
      . {t("Para consultas a OpenBSP, escribinos en la")}{" "}
      <a href={COMMUNITY} target="_blank" rel="noreferrer">
        {t("comunidad")}
      </a>
      .
    </p>
  );
}

/**
 * The warning card for an account the service broke, shaped like a quota's:
 * the account, what happened, what it stopped. Nothing for an account with
 * no issue, or one that's over — working, or disconnected by a member.
 */
export function ConnectionIssueCard({
  row,
  onClick,
}: {
  row: OrganizationAddressRow;
  onClick?: () => void;
}) {
  const { translate: t, currentLanguage } = useTranslation();
  if (!activeIssue(row)) return null;

  return (
    <NoticeCard
      className="bg-destructive/10"
      icon={
        <WarningBadge show>
          <ServiceIcon service={row.service} size={24} />
        </WarningBadge>
      }
      title={`${accountLabel(row)}: ${statusLabel(row, t)}`}
      onClick={onClick}
    >
      {cause(row, t, currentLanguage).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </NoticeCard>
  );
}
