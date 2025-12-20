import useBoundStore from "@/stores/useBoundStore";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { startConversation } from "@/utils/ConversationUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { useState } from "react";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import { useNavigate } from "@tanstack/react-router";
import SectionHeader from "./SectionHeader"

export default function NewChat() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const addresses = useQuery({
    queryKey: [activeOrgId, "addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations_addresses")
        .select("*")
        .eq("organization_id", activeOrgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrgId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const internalAddress = addresses.data?.find(
    (address) => address.service === "local",
  )?.address;

  const whatsappAddresses = addresses.data?.filter(
    (address) => address.service === "whatsapp",
  );

  const [phoneNumber, setPhoneNumber] = useState("");

  function sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // If empty after sanitizing, return empty string
    if (!digits) return "";

    // If it already starts with 549, return as is
    if (digits.startsWith("549")) return digits;

    // If it starts with 54 but not 549, prepend 9
    if (digits.startsWith("54")) return "549" + digits.slice(2);

    // Otherwise prepend 549
    return "549" + digits;
  }

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Nueva conversación" />

      <div className="px-[12px] pb-[7px] flex bg-background">
        <div className="flex items-center w-full bg-incoming-chat-bubble h-[40px] rounded-full hover:ring ring-border px-[12px] text-foreground">
          <Search className="text-muted-foreground w-[16px] h-[16px] stroke-[3px]" />
          <input
            placeholder={t("Buscar nombre o número de teléfono") as string}
            className="bg-transparent border-none outline-none w-full h-full text-[15px] mx-[12px] placeholder:text-muted-foreground"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          {phoneNumber && (
            <X
              className="cursor-pointer text-muted-foreground w-[16px] h-[16px] stroke-[3px]"
              onClick={() => setPhoneNumber("")}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4 px-[12px]">
        {internalAddress && (
          <button
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-full text-center"
            onClick={() => {
              if (!activeOrgId) {
                return;
              }

              const convId = startConversation({
                organization_id: activeOrgId,
                organization_address: internalAddress,
                contact_address: crypto.randomUUID(),
                service: "local",
                type: "personal",
              });

              //setActiveConv(convId!);
              navigate({ to: "/conversations", hash: convId });
            }}
          >
            {t("Nueva conversación de prueba")}
          </button>
        )}

        {/* internalAddress && (
            <button
              className="px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded text-foreground text-left"
              onClick={() => {
                activeOrgId &&
                  setActiveConv(
                    startConversation({
                      organization_id: activeOrgId,
                      organization_address: internalAddress,
                      contact_address: crypto.randomUUID(),
                      service: "local",
                      type: "group",
                      name: "Nuevo grupo",
                    }),
                  );
                navigate({ to: "/conversations" });
              }}
            >
              {t("Nuevo grupo")}
            </button>
          )*/}

        {!!whatsappAddresses?.length &&
          phoneNumber.replace(/\D/g, "").length >= 10 && (
            <button
              className="px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded text-foreground text-left"
              onClick={() => {
                if (!activeOrgId) return;

                const convId = startConversation({
                  organization_id: activeOrgId,
                  organization_address: whatsappAddresses[0].address,
                  contact_address: sanitizePhoneNumber(phoneNumber),
                  service: "whatsapp",
                  type: "personal",
                  name: formatPhoneNumber(sanitizePhoneNumber(phoneNumber)),
                });

                // setActiveConv(convId!);
                navigate({ to: "/conversations", hash: convId });
              }}
            >
              {formatPhoneNumber(sanitizePhoneNumber(phoneNumber))}
            </button>
          )}
      </div>
    </div>
  );
}
