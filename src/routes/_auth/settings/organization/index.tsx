import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization, useUpdateCurrentOrganization, useDeleteCurrentOrganization } from "@/queries/useOrgs";
import { useCurrentAgent } from "@/queries/useAgents";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/_auth/settings/organization/")({
  component: EditOrganization,
});

function EditOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();
  const { data: agent } = useCurrentAgent();
  const isOwner = agent?.extra?.role === "owner";

  const updateOrg = useUpdateCurrentOrganization();
  const deleteOrg = useDeleteCurrentOrganization();

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm({ values: org });

  return org && (
    <>
      <SectionHeader
        title={t("Editar organización")}
        onDelete={isOwner ? () => deleteOrg.mutate(undefined, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        }) : undefined}
      />

      <SectionBody>
        <form
          id="org-form"
          onSubmit={handleSubmit((data) => updateOrg.mutate(data))}
          className="flex flex-col gap-[24px]"
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              disabled={!isOwner}
              {...register("name", { required: true })}
            />
          </label>
        </form>
      </SectionBody>

      {isOwner && (
        <SectionFooter>
          <button
            form="org-form"
            type="submit"
            disabled={updateOrg.isPending || !isValid || !isDirty}
            className="primary"
          >
            {updateOrg.isPending ? "..." : t("Actualizar")}
          </button>
        </SectionFooter>
      )}
    </>
  );
}
