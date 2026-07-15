import { formatPhoneNumber, nameInitials } from "@/utils/FormatUtils";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useContactByAddress } from "@/queries/useContacts";
import { useContactAddress } from "@/queries/useContactsAddresses";
import type { InstagramContactAddressExtra } from "@/supabase/client";

export default function Header() {
  const navigate = useNavigate();

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(state.ui.activeConvId || ""),
  );

  const { data: contact } = useContactByAddress(
    conversation?.contact_address,
    conversation?.service,
  );
  const { data: contactAddress } = useContactAddress(
    conversation?.contact_address,
    conversation?.service,
  );

  const service = conversation?.service;
  // Group conversations (whatsapp-web) have group_address set and no
  // contact_address; the conversation name carries the group subject.
  const isGroup = !!conversation?.group_address;

  const igExtra =
    service === "instagram"
      ? (contactAddress?.extra as InstagramContactAddressExtra | null)
      : null;

  // Name fallback order: conversation.name → contact.name →
  // contactAddress.extra?.name → @username (Instagram) → "?"
  const convName =
    conversation?.name ||
    contact?.name ||
    contactAddress?.extra?.name ||
    (igExtra?.username ? `@${igExtra.username}` : undefined);

  const address = conversation?.contact_address;

  // When there is no name, show the (formatted) contact address instead of "?".
  // WhatsApp addresses are phone numbers; Instagram addresses need no
  // formatting. Groups fall back to their opaque JID.
  const displayName =
    convName ||
    (isGroup
      ? conversation?.group_address
      : address
        ? service === "whatsapp" || service === "whatsapp-web"
          ? formatPhoneNumber(address)
          : address
        : undefined) ||
    "?";

  const convInitials = nameInitials(convName || "?");

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
          src={igExtra?.profile_picture_url}
          fallback={convInitials}
          size={40}
          className="bg-accent text-accent-foreground border border-border text-[16px]"
        />
      </div>
      <div className="info flex flex-col justify-center mr-[12px] truncate">
        <div className="text-[16px] text-foreground truncate">
          {displayName}
        </div>
        <div className="text-[13px] text-muted-foreground truncate">
          {isGroup && t("Grupo")}
          {service === "local" && t("Contacto de prueba")}
          {(service === "whatsapp" || service === "whatsapp-web") &&
            address &&
            formatPhoneNumber(address)}
          {service === "instagram" &&
            igExtra?.username &&
            `@${igExtra.username}`}
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
    </div>
  );
}
