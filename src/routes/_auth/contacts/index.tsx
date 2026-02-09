import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useContacts } from "@/queries/useContacts";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import { formatPhoneNumber } from "@/utils/FormatUtils";

export const Route = createFileRoute("/_auth/contacts/")({
  component: ListContacts,
});

function ListContacts() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: contacts } = useContacts();

  return (
    <>
      <SectionHeader title={t("Contactos")} />

      <SectionBody>
        <SectionItem
          title={t("Agregar contacto")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/contacts/new",
              hash: (prevHash) => prevHash!,
            })
          }
        />
        {contacts?.map((contact) => (
          < SectionItem
            key={contact.id}
            title={contact.name || t("Sin nombre")}
            description={contact.primary_address?.at(0)?.address ? formatPhoneNumber(contact.primary_address.at(0)!.address) : t("Sin dirección")}
            aside={
              < Avatar
                fallback={contact.name?.substring(0, 2).toUpperCase() || "?"}
                size={40}
                className="bg-muted text-muted-foreground"
              />
            }
            onClick={() =>
              navigate({
                to: `/contacts/${contact.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
      </SectionBody>
    </>
  );
}
