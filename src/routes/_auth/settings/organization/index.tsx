import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization, useUpdateCurrentOrganization, useDeleteCurrentOrganization } from "@/queries/useOrgs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/_auth/settings/organization/")({
  component: SettingsOrganization,
});

function SettingsOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();
  const updateOrg = useUpdateCurrentOrganization();
  const deleteOrg = useDeleteCurrentOrganization();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm({ values: org });

  if (!org) return null;

  return (
    <>
      <SectionHeader title={org.name} />

      <SectionBody>
        <form
          onSubmit={handleSubmit((data) => updateOrg.mutate(data))}
          className="flex flex-col gap-[16px] pb-[14px] grow"
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
            className="destructive"
            onClick={(e) => {
              e.preventDefault();
              deleteOrg.mutate(undefined, {
                onSuccess: () =>
                  navigate({ to: "..", hash: (prevHash) => prevHash! }),
              });
            }}
            disabled={deleteOrg.isPending}
          >
            {deleteOrg.isPending ? "..." : t("Eliminar")}
          </button>

          <button
            type="submit"
            disabled={updateOrg.isPending || !isValid}
            className="primary"
          >
            {updateOrg.isPending ? "..." : t("Actualizar")}
          </button>
        </form>
      </SectionBody>
    </>
  );
}
