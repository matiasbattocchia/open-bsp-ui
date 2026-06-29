import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, LayoutTemplate, LoaderCircle, RefreshCw } from "lucide-react";
import { useTemplates, useSyncTemplates } from "@/queries/useTemplates";

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
  const syncTemplates = useSyncTemplates();

  const handleSync = () => {
    syncTemplates.mutate(orgAddressId);
  };

  return (
    <>
      <div className="header items-center gap-2">
        <div className="text-[22px]">{t("Plantillas")}</div>
        <div className="flex-1" />
        <button
          className="px-3 py-1.5 rounded-full text-[13px] bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          onClick={handleSync}
          disabled={syncTemplates.isPending}
          title="Sync templates from Meta"
        >
          <RefreshCw className={`w-4 h-4 ${syncTemplates.isPending ? "animate-spin" : ""}`} />
          Sync from Meta
        </button>
      </div>
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

      <div className="mt-[24px]">
        <SectionHeader title={t("API Reference")} />
        <SectionBody>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left font-medium py-[8px] pr-[16px]">
                    {t("Method")}
                  </th>
                  <th className="text-left font-medium py-[8px] pr-[16px]">
                    {t("Endpoint")}
                  </th>
                  <th className="text-left font-medium py-[8px]">
                    {t("Action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-[8px] pr-[16px]">
                    <span className="rounded bg-primary/10 text-primary font-mono text-[11px] px-[6px] py-[2px]">
                      PUT
                    </span>
                  </td>
                  <td className="py-[8px] pr-[16px] font-mono text-[11px]">
                    /whatsapp-management/templates
                  </td>
                  <td className="py-[8px]">{t("List all templates")}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-[8px] pr-[16px]">
                    <span className="rounded bg-primary/10 text-primary font-mono text-[11px] px-[6px] py-[2px]">
                      PUT
                    </span>
                  </td>
                  <td className="py-[8px] pr-[16px] font-mono text-[11px]">
                    /whatsapp-management/templates
                    <br />
                    <span className="text-muted-foreground">
                      body: &#123; template &#125;
                    </span>
                  </td>
                  <td className="py-[8px]">{t("Fetch single template")}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-[8px] pr-[16px]">
                    <span className="rounded bg-primary/10 text-primary font-mono text-[11px] px-[6px] py-[2px]">
                      POST
                    </span>
                  </td>
                  <td className="py-[8px] pr-[16px] font-mono text-[11px]">
                    /whatsapp-management/templates
                  </td>
                  <td className="py-[8px]">{t("Create template")}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-[8px] pr-[16px]">
                    <span className="rounded bg-primary/10 text-primary font-mono text-[11px] px-[6px] py-[2px]">
                      PATCH
                    </span>
                  </td>
                  <td className="py-[8px] pr-[16px] font-mono text-[11px]">
                    /whatsapp-management/templates
                  </td>
                  <td className="py-[8px]">{t("Edit template")}</td>
                </tr>
                <tr>
                  <td className="py-[8px] pr-[16px]">
                    <span className="rounded bg-destructive/10 text-destructive font-mono text-[11px] px-[6px] py-[2px]">
                      DELETE
                    </span>
                  </td>
                  <td className="py-[8px] pr-[16px] font-mono text-[11px]">
                    /whatsapp-management/templates
                  </td>
                  <td className="py-[8px]">{t("Delete template")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionBody>
      </div>
    </>
  );
}
