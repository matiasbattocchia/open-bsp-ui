import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, LayoutTemplate, LoaderCircle } from "lucide-react";
import { useTemplates } from "@/queries/useTemplates";
import { useIntegrations } from "@/queries/useOrganizationsAddresses";

export const Route = createFileRoute("/_auth/templates/")({
  component: TemplatesIndex,
});

function TemplatesIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  const { data: integrations, isLoading: loadingIntegrations } = useIntegrations();
  const whatsappAddress = integrations?.find((i) => i.service === "whatsapp")?.address;

  const { data: templates, isLoading: loadingTemplates } = useTemplates(whatsappAddress);

  const isLoading = loadingIntegrations || loadingTemplates;

  return (
    <>
      <SectionHeader title={t("Plantillas") as string} />
      <SectionBody>
        <SectionItem
          title={t("Crear plantilla")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/templates/new",
              hash: (prevHash) => prevHash!,
            })
          }
        />

        {isLoading && (
          <div className="flex justify-center p-4">
            <LoaderCircle className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {templates?.map((template) => (
          <SectionItem
            key={template.id}
            title={template.name}
            description={
              <div className="flex gap-2 items-center">
                <span className="capitalize">{template.category.toLowerCase()}</span>
                {template.status !== "APPROVED" && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full capitalize">
                    {template.status.toLowerCase()}
                  </span>
                )}
              </div>
            }
            aside={
              <div className="p-[8px] bg-muted rounded-full">
                <LayoutTemplate className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            onClick={() =>
              navigate({
                to: `/templates/${template.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}

        {!isLoading && templates?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t("No hay plantillas disponibles.")}
          </div>
        )}
      </SectionBody>
    </>
  );
}
