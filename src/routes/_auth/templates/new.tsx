import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import TemplateEditor from "@/components/TemplateEditor";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/_auth/templates/new")({
  component: NewTemplate,
});

function NewTemplate() {
  const { translate: t } = useTranslation();
  const { data: addresses, isLoading } = useOrganizationsAddresses();
  const whatsappAddress = addresses?.find(
    (a) => a.service === "whatsapp",
  )?.address;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!whatsappAddress) {
    return (
      <div className="p-4 text-muted-foreground">
        {t(
          "No se encontró una integración de WhatsApp activa para esta organización.",
        )}
      </div>
    );
  }

  return (
    <>
      <SectionHeader title={t("Crear plantilla") as string} />
      <TemplateEditor organizationAddress={whatsappAddress} />
    </>
  );
}
