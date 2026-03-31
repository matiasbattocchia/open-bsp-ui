import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, LayoutTemplate, LoaderCircle } from "lucide-react";
import { useTemplates } from "@/queries/useTemplates";

export const Route = createFileRoute(
  "/_auth/integrations/whatsapp/$orgAddressId/templates/",
)({
  component: TemplatesIndex,
});

function TemplatesIndex() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { orgAddressId } = Route.useParams();

  const { data: templates, isLoading } = useTemplates(orgAddressId);

  return (
    <>
      <SectionHeader title={t("Plantillas")} />
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
              to: "/integrations/whatsapp/$orgAddressId/templates/new",
              params: { orgAddressId },
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
                <span className="capitalize">
                  {template.category.toLowerCase()}
                </span>
                {template.status !== "APPROVED" && (
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full capitalize">
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
                to: "/integrations/whatsapp/$orgAddressId/templates/$templateId",
                params: { orgAddressId, templateId: template.id },
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
