import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent, useCurrentAgent } from "@/queries/useAgents";
import { type HumanAgentInsert } from "@/supabase/client";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import { useCurrentOrganization } from "@/queries/useOrganizations";
import SelectField from "@/components/SelectField";

export const Route = createFileRoute("/_auth/settings/members/new")({
  component: AddMember,
});

function AddMember() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const { data: agent } = useCurrentAgent();
  const { data: organization } = useCurrentOrganization();
  const isOwner = agent?.extra?.role === "owner";

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<HumanAgentInsert>({
    defaultValues: {
      extra: {
        role: "member",
      },
    },
  });

  return (
    <>
      <SectionHeader title={t("Agregar miembro")} />

      <SectionBody>
        <form
          id="create-member-form"
          onSubmit={handleSubmit(data => createAgent.mutate(
            {
              ...data,
              ai: false,
              extra: {
                role: data.extra!.role!,
                invitation: {
                  organization_name: organization?.name || "",
                  email: data.extra!.invitation!.email!,
                  status: "pending"
                }
              }
            },
            {
              onSuccess: (agent) =>
                navigate({
                  to: `/settings/members/${agent!.id}`,
                  hash: (prevHash) => prevHash!,
                }),
            }),
          )}
        >
          <fieldset disabled={!isOwner} className="contents">
            <p>
              {t("Envía una invitación por correo. Los propietarios tienen control total, los administradores gestionan configuraciones y los miembros responden a las conversaciones.")}
            </p>

            <label>
              <div className="label">{t("Nombre")}</div>
              <input
                className="text"
                placeholder={t("Nombre del miembro")}
                {...register("name", { required: true })}
              />
            </label>


            <SelectField
              name="extra.role"
              control={control}
              label={t("Rol")}
              options={[
                { value: "member", label: t("Miembro") },
                { value: "admin", label: t("Administrador") },
                { value: "owner", label: t("Propietario") },
              ]}
              required
            />

            <label>
              <div className="label">{t("Correo electrónico")}</div>
              <input
                type="email"
                className="text"
                placeholder={t("usuario@ejemplo.com")}
                {...register("extra.invitation.email", {
                  required: true, pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
            </label>
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-member-form"
          type="submit"
          disabled={!isOwner}
          invalid={!isValid || !isDirty}
          loading={createAgent.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Invitar")}
        </Button>
      </SectionFooter>
    </>
  );
}
