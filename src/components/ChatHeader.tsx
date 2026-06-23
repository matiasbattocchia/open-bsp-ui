import { formatPhoneNumber, nameInitials } from "@/utils/FormatUtils";
import Avatar from "./Avatar";
import useBoundStore from "@/stores/useBoundStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useContactByAddress } from "@/queries/useContacts";
import { useContactAddress } from "@/queries/useContactsAddresses";
import type { InstagramContactAddressExtra } from "@/supabase/client";
import {
  useConversationLabels,
  useLabels,
  useApplyLabel,
  useRemoveLabel,
} from "@/queries/useLabels";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();

  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(state.ui.activeConvId || ""),
  );

  const { data: contact } = useContactByAddress(conversation?.contact_address);
  const { data: contactAddress } = useContactAddress(
    conversation?.contact_address,
  );

  const service = conversation?.service;

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
  // WhatsApp addresses are phone numbers; Instagram addresses need no formatting.
  const displayName =
    convName ||
    (address
      ? service === "whatsapp"
        ? formatPhoneNumber(address)
        : address
      : "?");

  const convInitials = nameInitials(convName || "?");

  const { translate: t } = useTranslation();

  // Labels
  const { data: appliedLabels = [] } = useConversationLabels(activeConvId);
  const { data: allLabels = [] } = useLabels();
  const applyLabel = useApplyLabel();
  const removeLabel = useRemoveLabel();
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const appliedNames = new Set(appliedLabels.map((l) => l.label_name));
  const availableLabels = allLabels.filter((l) => !appliedNames.has(l.name));

  if (!activeConvId) {
    return null;
  }

  return (
    <div className="border-b border-border bg-background z-30 shadow-md">
      {/* Main header row */}
      <div className="header">
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
            {service === "local" && t("Contacto de prueba")}
            {service === "whatsapp" && address && formatPhoneNumber(address)}
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

      {/* Labels row */}
      {(appliedLabels.length > 0 || allLabels.length > 0) && (
        <div className="relative flex items-center gap-2 px-[20px] pb-[8px] flex-wrap">
          {appliedLabels.map((cl) => {
            const labelDef = allLabels.find((l) => l.name === cl.label_name);
            return (
              <span
                key={cl.label_name}
                className="inline-flex items-center gap-1 text-[12px] px-[8px] py-[2px] rounded-full text-white"
                style={{ backgroundColor: labelDef?.color || "#6b7280" }}
              >
                {cl.label_name}
                <button
                  type="button"
                  title={t("Quitar etiqueta")}
                  className="hover:opacity-70"
                  onClick={() =>
                    removeLabel.mutate({
                      conversationId: activeConvId,
                      labelName: cl.label_name,
                    })
                  }
                >
                  <X className="w-[10px] h-[10px]" />
                </button>
              </span>
            );
          })}

          {availableLabels.length > 0 && (
            <button
              type="button"
              title={t("Agregar etiqueta")}
              className="inline-flex items-center gap-1 text-[12px] px-[8px] py-[2px] rounded-full border border-border text-muted-foreground hover:bg-accent"
              onClick={() => setShowLabelPicker((v) => !v)}
            >
              <Plus className="w-[10px] h-[10px]" />
              {t("Etiqueta")}
            </button>
          )}

          {/* Label picker dropdown */}
          {showLabelPicker && (
            <div className="absolute top-full left-[20px] mt-[4px] z-20 bg-popover border border-border rounded-xl shadow-lg flex flex-col py-1 min-w-[160px]">
              {availableLabels.map((label) => (
                <button
                  key={label.name}
                  type="button"
                  className="flex items-center gap-2 px-[12px] py-[8px] text-[14px] text-foreground hover:bg-accent text-left"
                  onClick={() => {
                    applyLabel.mutate({
                      conversationId: activeConvId,
                      labelName: label.name,
                    });
                    setShowLabelPicker(false);
                  }}
                >
                  <span
                    className="w-[12px] h-[12px] rounded-full shrink-0"
                    style={{ backgroundColor: label.color || "#6b7280" }}
                  />
                  {label.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
