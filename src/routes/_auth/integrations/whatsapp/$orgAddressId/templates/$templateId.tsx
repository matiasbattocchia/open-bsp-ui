import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import TemplateEditor from "@/components/TemplateEditor";
import { useTemplateDetail, useDeleteTemplate } from "@/queries/useTemplates";
import { LoaderCircle } from "lucide-react";

export const Route = createFileRoute(
  "/_auth/integrations/whatsapp/$orgAddressId/templates/$templateId",
)({
  component: EditTemplate,
});

function EditTemplate() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { orgAddressId, templateId } = Route.useParams();

  const { data: template, isLoading } = useTemplateDetail(orgAddressId, templateId);
  const deleteTemplate = useDeleteTemplate();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4 text-muted-foreground">
        {t("Plantilla no encontrada")}
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("Editar plantilla")}
        onDelete={() => {
          deleteTemplate.mutate(
            { template, organizationAddress: orgAddressId },
            {
              onSuccess: () =>
                navigate({ to: "..", hash: (prevHash) => prevHash! }),
            },
          );
        }}
        deleteLoading={deleteTemplate.isPending}
      />
      <TemplateEditor
        existingTemplate={template}
        organizationAddress={orgAddressId}
      />
    </>
  );
}
