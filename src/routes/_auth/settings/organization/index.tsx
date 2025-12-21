import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization, useUpdateCurrentOrganization, useDeleteCurrentOrganization } from "@/queries/useOrgs";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/_auth/settings/organization/")({
  component: SettingsOrganization,
});

export function OrganizationForm({
  defaultValues,
  onSubmit,
  isPending,
  submitText,
}: {
  defaultValues?: { name: string };
  onSubmit: (data: { name: string }) => void;
  isPending: boolean;
  submitText: string;
}) {
  const { translate: t } = useTranslation();
  const { register, handleSubmit } = useForm({ values: defaultValues });

  return (
    <SectionBody className="gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("Nombre de la organización")}</span>
        <div className="flex gap-2">
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("name", { required: true })}
          />
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
          >
            {isPending ? "..." : t(submitText)}
          </button>
        </div>
      </label>
    </SectionBody>
  );
}

function SettingsOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();
  const updateOrg = useUpdateCurrentOrganization();
  const deleteOrg = useDeleteCurrentOrganization();

  return (
    <>
      <SectionHeader title={t("Organización") as string} />


      <OrganizationForm
        defaultValues={org || { name: "" }}
        onSubmit={(data) => updateOrg.mutate(data)}
        isPending={updateOrg.isPending}
        submitText="Guardar"
      />

      <SectionBody className="mt-8">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-destructive">{t("Zona de peligro")}</span>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            onClick={() => deleteOrg.mutate(undefined, { onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! }) })}
            disabled={deleteOrg.isPending}
          >
            {deleteOrg.isPending ? "..." : t("Eliminar organización")}
          </button>
        </label>
      </SectionBody>
    </>
  );
}
