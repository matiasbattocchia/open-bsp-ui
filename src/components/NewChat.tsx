import useBoundStore from "@/stores/useBoundStore";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { startConversation } from "@/utils/ConversationUtils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { Input } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useState } from "react";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export default function NewChat() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);

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
    <div className="border-r border-gray-line bg-white flex flex-col">
      <div className="flex items-center truncate h-[59px] px-[16px]">
        {/* Back button */}
        <Link
          to="/conversations"
          hash={activeConvId || undefined}
          className="mr-4"
          title={t("Volver") as string}
        >
          <ArrowLeft className="w-[24px] h-[24px] text-gray-icon" />
        </Link>
        <div className="text-[16px]">{t("Nueva conversación")}</div>
      </div>

      <div className="px-[12px] py-[7px] flex bg-white">
        <Input
          placeholder={t("Buscar nombre o número de teléfono") as string}
          variant="borderless"
          className="bg-gray h-[35px] text-gray-dark"
          value={phoneNumber}
          prefix={<SearchOutlined className="mr-[15px]" />}
          allowClear={{ clearIcon: <CloseOutlined /> }}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 mt-4 px-[12px]">
        {internalAddress && (
          <button
            className="px-4 py-2 bg-gray-hover hover:bg-gray rounded"
            onClick={() => {
              if (!activeOrgId) { return }

              const convId =
                startConversation({
                  organization_id: activeOrgId,
                  organization_address: internalAddress,
                  contact_address: crypto.randomUUID(),
                  service: "local",
                  type: "personal",
                })

              //setActiveConv(convId!);
              navigate({ to: "/conversations", hash: convId });
            }}
          >
            {t("Nueva conversación de prueba")}
          </button>
        )}

        {/* internalAddress && (
            <button
              className="px-4 py-2 bg-gray-hover hover:bg-gray rounded"
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
              className="px-4 py-2 bg-gray-hover hover:bg-gray rounded"
              onClick={() => {
                if (!activeOrgId) return;

                const convId = startConversation({
                  organization_id: activeOrgId,
                  organization_address: whatsappAddresses[0].address,
                  contact_address: sanitizePhoneNumber(phoneNumber),
                  service: "whatsapp",
                  type: "personal",
                  name: formatPhoneNumber(
                    sanitizePhoneNumber(phoneNumber),
                  ),
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
