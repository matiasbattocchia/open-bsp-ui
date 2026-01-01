import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent, useCurrentAgent } from "@/queries/useAgents";
import { type HumanAgentInsert } from "@/supabase/client";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";

export const Route = createFileRoute("/_auth/settings/members/new")({
  component: AddMember,
});

function AddMember() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const { data: agent } = useCurrentAgent();
  const isOwner = agent?.extra?.role === "owner";

  const {
    register,
    handleSubmit,
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
                role: data!.extra!.role!,
                invitation: {
                  email: data!.extra!.invitation!.email!,
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
            <label>
              <div className="label">{t("Nombre")}</div>
              <input
                className="text"
                placeholder={t("Nombre del miembro")}
                {...register("name", { required: true })}
              />
            </label>


            <label>
              <div className="label">{t("Rol")}</div>
              <select
                {...register("extra.role", { required: true })}
              >
                <option value="member">{t("Miembro")}</option>
                <option value="admin">{t("Administrador")}</option>
                <option value="owner">{t("Propietario")}</option>
              </select>
            </label>

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
