import { nameInitials } from "./ChatListItem/ChatListItem";
import Avatar from "./Avatar";
import useBoundStore from "@/store/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react";

export function formatPhoneNumber(phoneNumber: string): string {
  const areaCodeLenght = phoneNumber.slice(3, 5) === "11" ? 2 : 3;

  // Format phone number with spaces and hyphen using splice
  const chars = phoneNumber.split("");
  chars.splice(2, 0, " "); // Country code
  chars.splice(4, 0, " "); // Nine
  chars.splice(5 + areaCodeLenght, 0, " "); // Area code
  chars.splice(12, 0, "-"); // Hyphen

  return "+" + chars.join("");
}

export default function Header() {
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
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);

  const convInitials = nameInitials(convName);

  const { translate: t } = useTranslation();

  if (!activeConvId) {
    return null;
  }

  return (
    <div className="header border-b border-r bg-gray z-30">
      {/* Back button */}
      <button
        className={"mr-4" + (activeConvId ? " md:hidden" : "")}
        title={t("Volver") as string}
        onClick={() => activeConvId && setActiveConv(null)}
      >
        <ArrowLeft className="w-[24px] h-[24px] text-gray-icon" />
      </button>

      {/* Contact info */}
      <div className="profile-picture pr-[15px]">
        <Avatar
          fallback={convInitials}
          size={40}
          className="bg-gray-dark text-xl"
        />
      </div>
      <div className="info flex flex-col justify-center mr-[12px] truncate">
        <div className="text-[16px] truncate">{convName}</div>
        <div className="text-[13px] text-gray-dark truncate">
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
          <svg className="w-[24px] h-[24px] text-gray-icon">
            <use href="/icons.svg#options" />
          </svg>
        </button>
      </div>
    </div>
  );
}
