import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateOrganization } from "@/queries/useOrgs";
import { OrganizationForm } from "./index";
import useBoundStore from "@/stores/useBoundStore";

export const Route = createFileRoute("/_auth/settings/organization/new")({
  component: NewOrganization,
});

function NewOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);

  return (
    <>
      <SectionHeader title={t("Nueva organización") as string} closeButton={true} />
      <OrganizationForm
        onSubmit={(data) =>
          createOrg.mutate(data, {
            onSuccess: (org) => {
              setActiveOrg(org.id);
              navigate({ to: "..", hash: (prevHash) => prevHash! })
            },
          })
        }
        isPending={createOrg.isPending}
        submitText="Crear"
      />
    </>
  );
}
