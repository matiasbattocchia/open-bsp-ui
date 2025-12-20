import { ArrowLeft, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocation, useRouter } from "@tanstack/react-router";
import { LinkButton } from "./LinkButton";

export default function SectionHeader(props: { title: string; closeButton?: boolean }) {
  const { translate: t } = useTranslation();
  const location = useLocation();
  const router = useRouter();

  const showBackButton = location.pathname.split("/").filter(Boolean).length >= 2;

  return (
    <div className="header items-center truncate">
      {/* Back button */}
      {showBackButton && (
        props.closeButton ?
          (
            <button
              className="p-[8px] rounded-full hover:bg-muted mr-[8px] ml-[-8px]"
              title={t("Cerrar") as string}
              onClick={() => router.history.back()}
            >
              <X className="w-[24px] h-[24px]" />
            </button>
          )
          :
          (
            <LinkButton
              to=".."
              className="mr-[8px] ml-[-8px]"
              title={t("Volver") as string}
            >
              <ArrowLeft className="w-[24px] h-[24px]" />
            </LinkButton>
          )
      )}

      {/* Section title */}
      <div className={showBackButton ? "text-[16px]" : "text-[22px]"}>
        {t(props.title)}
      </div>
    </div>
  );
}