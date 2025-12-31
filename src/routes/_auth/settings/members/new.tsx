import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent, useCurrentAgent } from "@/queries/useAgents";
import { type HumanAgentInsert } from "@/supabase/client";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";

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
    formState: { isValid },
  } = useForm<HumanAgentInsert>({
    defaultValues: {
      extra: {
        role: "user",
      },
    },
  });

  return (
    <>
      <SectionHeader title={t("Agregar miembro") as string} />

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
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              disabled={!isOwner}
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Rol")}</div>
            <select
              disabled={!isOwner}
              {...register("extra.role", { required: true })}
            >
              <option value="user">{t("Usuario")}</option>
              <option value="admin">{t("Administrador")}</option>
              <option value="owner">{t("Propietario")}</option>
            </select>
          </label>

          <label>
            <div className="label">{t("Correo electrónico")}</div>
            <input
              type="email"
              className="text"
              disabled={!isOwner}
              {...register("extra.invitation.email", {
                required: true, pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
          </label>
        </form>
      </SectionBody>

      {isOwner && <SectionFooter>
        <button
          form="create-member-form"
          type="submit"
          disabled={createAgent.isPending || !isValid}
          className="primary"
        >
          {createAgent.isPending ? "..." : t("Invitar")}
        </button>
      </SectionFooter>}
    </>
  );
}
