import { ArrowLeft, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useArmed } from "@/hooks/useArmed";
import { useLocation, useRouter } from "@tanstack/react-router";
import { LinkButton } from "./LinkButton";
import Spinner from "./Spinner";

export default function SectionHeader({
  title,
  closeButton,
  onDelete,
  deleteDisabled,
  deleteDisabledReason,
  deleteLoading,
  deleteConfirmName,
  deleteWarning,
}: {
  title: string;
  closeButton?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteDisabledReason?: string;
  deleteLoading?: boolean;
  // A delete that takes everything with it asks for this name typed back.
  deleteConfirmName?: string;
  // What deleting costs beyond the resource, shown on the armed button.
  deleteWarning?: string;
}) {
  const { translate: t } = useTranslation();
  const location = useLocation();
  const router = useRouter();
  // Typing the name keeps the delete armed; a bare trash disarms on its own.
  const [armed, setArmed] = useArmed(deleteConfirmName ? null : 4000);
  const [typed, setTyped] = useState("");

  const showBackButton =
    location.pathname.split("/").filter(Boolean).length >= 2;

  const disarm = () => {
    setArmed(false);
    setTyped("");
  };

  const confirming = armed && !!deleteConfirmName;
  const nameMatches = !deleteConfirmName || typed.trim() === deleteConfirmName;

  return (
    <div
      className="header items-center truncate"
      onKeyDown={(e) => e.key === "Escape" && disarm()}
      // Leaving the header (not moving between its input and button) disarms.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) disarm();
      }}
    >
      {/* Back button */}
      {showBackButton &&
        (closeButton ? (
          <button
            className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
            title={t("Cerrar")}
            onClick={() => router.history.back()}
          >
            <X className="w-[24px] h-[24px]" />
          </button>
        ) : (
          <LinkButton
            to=".."
            className="mr-[8px] ml-[-8px]"
            title={t("Volver")}
          >
            <ArrowLeft className="w-[24px] h-[24px]" />
          </LinkButton>
        ))}

      {/* Section title, or the name to type back while confirming */}
      {confirming ? (
        <input
          autoFocus
          className="text min-w-0 flex-1 mr-[8px]"
          placeholder={deleteConfirmName}
          aria-label={t("Escribí el nombre para confirmar")}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && nameMatches && !deleteLoading && onDelete?.()
          }
        />
      ) : (
        <div className={showBackButton ? "text-[16px]" : "text-[22px]"}>
          {t(title)}
        </div>
      )}

      {/* One button that arms, then deletes: it stays the same element so it
          keeps focus between the clicks. */}
      {onDelete && (
        <button
          className={
            "ml-auto shrink-0 flex items-center rounded-full disabled:opacity-30 " +
            (armed
              ? "gap-[6px] h-[40px] px-[14px] bg-destructive text-white hover:bg-destructive/90"
              : "p-[8px] hover:bg-muted disabled:hover:bg-transparent")
          }
          title={
            armed
              ? nameMatches
                ? deleteWarning
                : t("Escribí el nombre para confirmar")
              : deleteDisabled && deleteDisabledReason
                ? `${t("Eliminar")} - ${deleteDisabledReason}`
                : t("Eliminar")
          }
          onClick={armed ? onDelete : () => setArmed(true)}
          disabled={deleteDisabled || deleteLoading || (armed && !nameMatches)}
        >
          {deleteLoading ? (
            <Spinner size={armed ? 20 : 24} />
          ) : (
            <Trash2
              className={armed ? "w-[20px] h-[20px]" : "w-[24px] h-[24px]"}
            />
          )}
          {armed && (deleteConfirmName ? t("Eliminar") : t("¿Eliminar?"))}
        </button>
      )}
    </div>
  );
}
