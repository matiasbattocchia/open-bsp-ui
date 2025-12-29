import { createFileRoute, useParams } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import TemplateEditor from "@/components/TemplateEditor";
import { useIntegrations } from "@/queries/useOrganizationsAddresses";
import { useTemplates } from "@/queries/useTemplates";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute("/_auth/templates/$templateId")({
  component: EditTemplate,
});

function EditTemplate() {
  const { translate: t } = useTranslation();
  const { templateId } = useParams({ from: "/_auth/templates/$templateId" });

  const { data: integrations, isLoading: loadingIntegrations } = useIntegrations();
  const whatsappAddress = integrations?.find((i) => i.service === "whatsapp")?.address;

  // Only fetch templates if we have an address
  const { data: templates, isLoading: loadingTemplates } = useTemplates(whatsappAddress);

  const isLoading = loadingIntegrations || loadingTemplates;

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

  const template = templates?.find((t) => t.id === templateId);

  if (!template) {
    return <div className="p-4 text-muted-foreground">{t("Plantilla no encontrada")}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SectionHeader title={t("Editar plantilla") as string} />
      <SectionBody>
        <TemplateEditor existingTemplate={template} organizationAddress={whatsappAddress} />
      </SectionBody>
    </div>
  );
}
