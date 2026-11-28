import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useCurrentOrganization,
  useUpdateCurrentOrganization,
  useDeleteCurrentOrganization,
} from "@/queries/useOrganizations";
import { useCurrentAgent } from "@/queries/useAgents";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import useBoundStore from "@/stores/useBoundStore";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import { type OrganizationUpdate } from "@/supabase/client";

// The bare hostname the database takes (organizations_domain_check).
const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// What people paste — "https://www.Acme.com/about" — as that hostname; empty
// clears it.
function normalizeDomain(raw: string | null): string | null {
  const host = (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
  return host || null;
}

export const Route = createFileRoute("/_auth/settings/organization/")({
  beforeLoad: () => {
    const activeOrgId = useBoundStore.getState().ui.activeOrgId;
    if (!activeOrgId) {
      throw redirect({
        to: "/settings/organization/new",
      });
    }
  },
  component: EditOrganization,
});

function EditOrganization() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: org } = useCurrentOrganization();
  const { data: agent } = useCurrentAgent();
  // Admins run the organization — the whole row, name included. Deleting it is
  // the owner's, like every other way of taking control.
  const isAdmin = ["admin", "owner"].includes(agent?.role || "");
  const isOwner = agent?.role === "owner";
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const updateOrg = useUpdateCurrentOrganization();
  const deleteOrg = useDeleteCurrentOrganization();

  const normalizedOrg = useMemo(() => {
    if (!org) return undefined;
    return {
      ...org,
      extra: {
        ...org.extra,
        error_messages_direction:
          org.extra?.error_messages_direction || "internal",
      },
    };
  }, [org]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty, errors },
  } = useForm<OrganizationUpdate>({ values: normalizedOrg });

  return (
    <>
      <SectionHeader
        title={t("Editar organización")}
        onDelete={() =>
          deleteOrg.mutate(undefined, {
            onSuccess: () => {
              setActiveOrg(null);
              void navigate({ to: "/conversations" });
            },
          })
        }
        deleteDisabled={!isOwner}
        deleteDisabledReason={t("Requiere permisos de propietario")}
        deleteLoading={deleteOrg.isPending}
        deleteConfirmName={org?.name}
      />

      <SectionBody>
        <form
          id="org-form"
          onSubmit={handleSubmit((data) => updateOrg.mutate(data))}
        >
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              placeholder={t("Nombre de la organización")}
              disabled={!isAdmin}
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Dominio")}</div>
            <input
              className="text"
              placeholder="acme.com"
              disabled={!isAdmin}
              {...register("domain", {
                setValueAs: normalizeDomain,
                validate: (value) =>
                  !value || DOMAIN_PATTERN.test(value) || t("Dominio inválido"),
              })}
            />
            {errors.domain?.message && (
              <div className="text-destructive text-[12px] mt-1">
                {errors.domain.message}
              </div>
            )}
          </label>

          <SelectField
            control={control}
            name="extra.error_messages_direction"
            label={t("Mensajes de error")}
            options={[
              { value: "internal", label: t("Solo en la UI") },
              { value: "outgoing", label: t("Visible desde WhatsApp") },
            ]}
            disabled={!isAdmin}
          />
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="org-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={updateOrg.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
