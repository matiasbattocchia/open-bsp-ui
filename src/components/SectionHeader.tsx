
import useBoundStore from "@/stores/useBoundStore";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Link } from "@tanstack/react-router";

export default function SectionHeader(props: { title: string, backTo?: string }) {
  const { translate: t } = useTranslation();
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  return (
    <div className="header items-center truncate bg-background text-foreground border-r border-border">
      {/* Back button */}
      {props.backTo && <Link
        to={props.backTo} // TODO: path minus one level
        hash={activeConvId || undefined}
        className="mr-4"
        title={t("Volver") as string}
      >
        <ArrowLeft className="w-[24px] h-[24px]" />
      </Link>}

      {/* Section title */}
      <div className={props.backTo ? "text-[16px]" : "text-[22px]"}>
        {t(props.title)}
      </div>
    </div>
  )
}