import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization, useUpdateCurrentOrganization, useDeleteCurrentOrganization } from "@/queries/useOrganizations";
import { useCurrentAgent } from "@/queries/useAgents";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import useBoundStore from "@/stores/useBoundStore";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import TextAreaField from "@/components/TextAreaField";
import { type OrganizationUpdate } from "@/supabase/client";

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
  const isOwner = agent?.extra?.role === "owner";
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const updateOrg = useUpdateCurrentOrganization();
  const deleteOrg = useDeleteCurrentOrganization();

  const normalizedOrg = useMemo(() => {
    if (!org) return undefined;
    return {
      ...org,
      extra: {
        ...org.extra,
        error_messages_direction: org.extra?.error_messages_direction || "internal",
      },
    };
  }, [org]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<OrganizationUpdate>({ values: normalizedOrg });

  return (
    <>
      <SectionHeader
        title={t("Editar organización")}
        onDelete={() => deleteOrg.mutate(undefined, {
          onSuccess: () => {
            setActiveOrg(null);
            navigate({ to: "/conversations" })
          }
        })}
        deleteDisabled={!isOwner}
        deleteDisabledReason={t("Requiere permisos de propietario")}
        deleteLoading={deleteOrg.isPending}
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
              disabled={!isOwner}
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Demora de respuesta (segundos)")}</div>
            <input
              type="number"
              className="text"
              placeholder="3"
              disabled={!isOwner}
              {...register("extra.response_delay_seconds", { valueAsNumber: true })}
            />
          </label>

          <TextAreaField
            control={control}
            name="extra.welcome_message"
            label={t("Mensaje de bienvenida")}
            placeholder={t("Hola! Soy un agente virtual. ¿En qué puedo ayudarte?")}
            disabled={!isOwner}
          />

          <SelectField
            control={control}
            name="extra.error_messages_direction"
            label={t("Mensajes de error")}
            options={[
              { value: "internal", label: t("Solo en la UI") },
              { value: "outgoing", label: t("Visible desde WhatsApp") },
            ]}
            disabled={!isOwner}
          />
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="org-form"
          type="submit"
          disabled={!isOwner}
          invalid={!isValid || !isDirty}
          loading={updateOrg.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
