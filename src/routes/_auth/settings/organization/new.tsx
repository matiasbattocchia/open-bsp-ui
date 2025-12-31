import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateOrganization } from "@/queries/useOrganizations";
import useBoundStore from "@/stores/useBoundStore";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import type { OrganizationInsert } from "@/supabase/client";

export const Route = createFileRoute("/_auth/settings/organization/new")({
  component: NewOrganization,
});

function NewOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<OrganizationInsert>();

  return (
    <>
      <SectionHeader title={t("Nueva organización") as string} closeButton={true} />

      <SectionBody>
        <form
          onSubmit={handleSubmit((data) =>
            createOrg.mutate(data, {
              onSuccess: (org) => {
                setActiveOrg(org.id);
                navigate({ to: "..", hash: (prevHash) => prevHash! });
              },
            })
          )}
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              {...register("name", { required: true })}
            />
          </label>

          <div className="grow" />

          <button
            type="submit"
            disabled={createOrg.isPending || !isValid}
            className="primary"
          >
            {createOrg.isPending ? "..." : t("Crear")}
          </button>
        </form>
      </SectionBody>
    </>
  );
}
