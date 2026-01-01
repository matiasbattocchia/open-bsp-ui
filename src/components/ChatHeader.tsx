import { nameInitials, formatPhoneNumber } from "@/utils/FormatUtils";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export default function Header() {
  const navigate = useNavigate();

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const convName = useBoundStore(
    (state) =>
      state.chat.conversations.get(state.ui.activeConvId || "")?.name || "?",
  );

  const convType = useBoundStore((state) => {
    const extra = state.chat.conversations.get(
      state.ui.activeConvId || "",
    )?.extra;

    return extra?.type;
  });

  const service = useBoundStore(
    (state) =>
      state.chat.conversations.get(state.ui.activeConvId || "")?.service,
  );

  const address = useBoundStore(
    (state) =>
      state.chat.conversations.get(state.ui.activeConvId || "")
        ?.contact_address,
  );

  const convInitials = nameInitials(convName);

  const { translate: t } = useTranslation();

  if (!activeConvId) {
    return null;
  }

  return (
    <div className="header border-b border-border bg-background z-30 shadow-md">
      {/* Back button */}
      <button
        className="mr-4 md:hidden"
        title={t("Volver")}
        onClick={() => navigate({ hash: undefined })}
      >
        <ArrowLeft className="w-[24px] h-[24px] text-foreground" />
      </button>

      {/* Contact info */}
      <div className="profile-picture pr-[15px]">
        <Avatar
          fallback={convInitials}
          size={40}
          className="bg-accent text-accent-foreground border border-border text-[16px]"
        />
      </div>
      <div className="info flex flex-col justify-center mr-[12px] truncate">
        <div className="text-[16px] text-foreground truncate">{convName}</div>
        <div className="text-[13px] text-muted-foreground truncate">
          {service === "local" &&
            convType !== "group" &&
            t("Contacto de prueba")}
          {service === "local" && convType === "group" && t("Grupo")}
          {service === "whatsapp" && address && formatPhoneNumber(address)}
        </div>
      </div>

      {/* Options button - Hidden, does nothing yet. */}
      <div className="options flex justify-end w-full hidden">
        <button className="p-[8px] ml-[10px] rounded-full active:bg-gray-icon-bg">
          <svg className="w-[24px] h-[24px] text-foreground">
            <use href="/icons.svg#options" />
          </svg>
        </button>
      </div>
    </div >
  );
}
