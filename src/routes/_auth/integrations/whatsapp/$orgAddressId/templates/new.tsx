import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import TemplateEditor from "@/components/TemplateEditor";

export const Route = createFileRoute(
  "/_auth/integrations/whatsapp/$orgAddressId/templates/new",
)({
  component: NewTemplate,
});

function NewTemplate() {
  const { translate: t } = useTranslation();
  const { orgAddressId } = Route.useParams();

  return (
    <>
      <SectionHeader title={t("Crear plantilla")} />
      <TemplateEditor organizationAddress={orgAddressId} />
    </>
  );
}
