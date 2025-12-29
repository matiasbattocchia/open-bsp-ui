import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import TemplateEditor from "@/components/TemplateEditor";
import { useIntegrations } from "@/queries/useOrganizationsAddresses";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/_auth/templates/new")({
  component: NewTemplate,
});

function NewTemplate() {
  const { translate: t } = useTranslation();
  const { data: integrations, isLoading } = useIntegrations();
  const whatsappAddress = integrations?.find((i) => i.service === "whatsapp")?.address;

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
        {t("No se encontró una integración de WhatsApp activa para esta organización.")}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SectionHeader title={t("Crear plantilla") as string} />
      <SectionBody>
        <TemplateEditor organizationAddress={whatsappAddress} />
      </SectionBody>
    </div>
  );
}
