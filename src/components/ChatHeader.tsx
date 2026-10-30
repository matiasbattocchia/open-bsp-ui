import { formatPhoneNumber, nameInitials } from "@/utils/FormatUtils";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useContactAddress } from "@/queries/useContactsAddresses";
import {
  contactName,
  type InstagramContactAddressExtra,
  type TikTokContactAddressExtra,
  peerAddress,
} from "@/supabase/client";

export default function Header() {
  const navigate = useNavigate();

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(state.ui.activeConvId || ""),
  );

  const service = conversation?.service;
  // Only a direct chat is with a contact: its address IS the peer's. See
  // peerAddress.
  const peer = peerAddress(conversation);
  const isGroup = conversation?.type === "group";

  const { data: contactAddress } = useContactAddress(
    conversation?.organization_address,
    service,
    peer,
  );

  // Instagram and TikTok contacts both read as @username, with a picture.
  const igExtra =
    service === "instagram" || service === "tiktok"
      ? (contactAddress?.extra as
          | InstagramContactAddressExtra
          | TikTokContactAddressExtra
          | null)
      : null;

  // Nearest name first: the address-book entry (saved name over push name,
  // see contactName), then the conversation. A group or channel finds no
  // entry, so its subject wins by falling through.
  const convName =
    contactName(contactAddress?.extra) ||
    (igExtra?.username ? `@${igExtra.username}` : undefined) ||
    conversation?.name;

  const address = conversation?.address;

  // Nameless: show the address. Only a peer's address is a phone number worth
  // formatting — a group or channel addresses a container, not a person.
  const displayName =
    convName ||
    (peer && (service === "whatsapp" || service === "whatsapp-web")
      ? formatPhoneNumber(peer)
      : address) ||
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
          {(service === "whatsapp" || service === "whatsapp-web") &&
            peer &&
            formatPhoneNumber(peer)}
          {(service === "instagram" || service === "tiktok") &&
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
